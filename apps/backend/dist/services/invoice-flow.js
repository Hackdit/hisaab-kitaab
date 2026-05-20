import { supabase } from '../plugins/supabase';
import { sendTextMessage, sendDocument } from './whatsapp';
export function initializeInvoiceState() {
    return { step: 'start', items: [] };
}
export async function handleInvoiceFlow(fromNumber, message, entities, currentState, business) {
    const state = currentState || {};
    if (!state.invoiceFlow) {
        state.invoiceFlow = initializeInvoiceState();
    }
    const invoiceState = state.invoiceFlow;
    let responseMessage = '';
    switch (invoiceState.step) {
        case 'start': {
            const customerName = entities.customerName;
            const items = entities.items || [];
            if (customerName)
                invoiceState.customerName = customerName;
            if (entities.gstin)
                invoiceState.customerGstin = entities.gstin;
            if (items.length > 0) {
                invoiceState.items = items;
                const missingPriceItem = invoiceState.items.find((item) => item.price === null);
                if (missingPriceItem) {
                    invoiceState.step = 'pending_item_price';
                    invoiceState.pendingItemIndex = invoiceState.items.indexOf(missingPriceItem);
                    responseMessage = `${missingPriceItem.name} ka rate kya hai per ${missingPriceItem.unit || 'unit'}?`;
                }
                else {
                    invoiceState.step = 'confirmation';
                    responseMessage = generateConfirmationMessage(invoiceState, business);
                }
            }
            else {
                if (!customerName) {
                    invoiceState.step = 'customer';
                    responseMessage = 'Invoice ke liye customer ka naam kya hai?';
                }
                else {
                    invoiceState.customerName = customerName;
                    invoiceState.step = 'items';
                    responseMessage =
                        "Invoice ke liye items kya hain? Please specify item name, quantity, and unit (e.g., '10kg chawal')";
                }
            }
            break;
        }
        case 'customer': {
            invoiceState.customerName = entities.customerName || message.trim();
            invoiceState.step = 'items';
            responseMessage =
                "Invoice ke liye items kya hain? Please specify item name, quantity, and unit (e.g., '10kg chawal')";
            break;
        }
        case 'items': {
            const newItems = entities.items || [];
            if (newItems.length > 0) {
                invoiceState.items = newItems;
                const missingPriceItem = invoiceState.items.find((item) => item.price === null);
                if (missingPriceItem) {
                    invoiceState.step = 'pending_item_price';
                    invoiceState.pendingItemIndex = invoiceState.items.indexOf(missingPriceItem);
                    responseMessage = `${missingPriceItem.name} ka rate kya hai per ${missingPriceItem.unit || 'unit'}?`;
                }
                else {
                    invoiceState.step = 'confirmation';
                    responseMessage = generateConfirmationMessage(invoiceState, business);
                }
            }
            else {
                responseMessage =
                    "Kripya item details sahi se bhejiye. Format: 'item name, quantity, unit' (e.g., '10kg chawal')";
            }
            break;
        }
        case 'pending_item_price': {
            const price = entities.price || parseFloat(message.trim().replace(/[^\d.]/g, ''));
            if (!isNaN(price) && price > 0) {
                const pendingIndex = invoiceState.pendingItemIndex ?? 0;
                if (pendingIndex < invoiceState.items.length) {
                    invoiceState.items[pendingIndex].price = price;
                    invoiceState.pendingItemIndex = undefined;
                    const nextMissing = invoiceState.items.find((item) => item.price === null);
                    if (nextMissing) {
                        invoiceState.pendingItemIndex = invoiceState.items.indexOf(nextMissing);
                        responseMessage = `${nextMissing.name} ka rate kya hai per ${nextMissing.unit || 'unit'}?`;
                    }
                    else {
                        invoiceState.step = 'confirmation';
                        responseMessage = generateConfirmationMessage(invoiceState, business);
                    }
                }
            }
            else {
                responseMessage = 'Kripya sahi daam bhejiye (e.g., 45 ya ₹45)';
            }
            break;
        }
        case 'confirmation': {
            const confirmation = message.trim().toLowerCase();
            if (['ha', 'han', 'yes', 'y'].includes(confirmation)) {
                try {
                    // ── Build LineItems with HSN/GST lookups ──
                    const { calculateGST, getFinancialYear, generateInvoiceNumber, lookupHSN } = await import('@hisab-kitaab/gst');
                    const lineItems = invoiceState.items.map((item) => {
                        const hsn = lookupHSN(item.hsnCode || '');
                        return {
                            name: item.name,
                            hsnCode: item.hsnCode || '0000',
                            quantity: item.quantity,
                            unit: item.unit || 'pcs',
                            rate: item.price ?? 0,
                            gstRate: item.gstRate ?? hsn?.gstRate ?? 18,
                        };
                    });
                    // Determine seller/buyer states
                    const sellerState = business.state_code || 'MH';
                    const buyerState = invoiceState.customerState || entities.customerState || sellerState;
                    // Calculate GST
                    const gstCalc = calculateGST(lineItems, sellerState, buyerState);
                    // ── Invoice number ──
                    const fy = getFinancialYear();
                    // Fetch current sequence from business record
                    const seq = (business.last_invoice_sequence ?? 0) + 1;
                    const invoiceNumber = generateInvoiceNumber('HK', fy, seq);
                    // ── Save invoice to database ──
                    const { data: invoice, error } = await supabase
                        .from('invoices')
                        .insert({
                        business_id: business.id,
                        invoice_number: invoiceNumber,
                        invoice_date: new Date().toISOString().slice(0, 10),
                        subtotal: gstCalc.subtotal,
                        cgst: gstCalc.cgst,
                        sgst: gstCalc.sgst,
                        igst: gstCalc.igst,
                        total: gstCalc.grandTotal,
                        is_interstate: gstCalc.isInterstate,
                        status: 'sent',
                    })
                        .select()
                        .single();
                    if (error)
                        throw error;
                    // ── Save invoice items ──
                    for (const item of lineItems) {
                        await supabase.from('invoice_items').insert({
                            invoice_id: invoice.id,
                            description: item.name,
                            hsn_code: item.hsnCode,
                            quantity: item.quantity,
                            unit: item.unit,
                            rate: item.rate,
                            gst_rate: item.gstRate,
                            amount: item.quantity * item.rate,
                        });
                    }
                    // ── Update invoice sequence on business ──
                    await supabase
                        .from('businesses')
                        .update({ last_invoice_sequence: seq })
                        .eq('id', business.id);
                    // ── Generate PDF and upload to Supabase Storage ──
                    let pdfPublicUrl = null;
                    try {
                        const { generateInvoicePDF } = await import('@hisab-kitaab/pdf');
                        const invoiceDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/-/g, '-');
                        const pdfBuffer = await generateInvoicePDF({
                            business: {
                                name: business.business_name || business.name,
                                address: business.address,
                                gstin: business.gstin,
                                stateCode: business.state_code || '07',
                                bankAccount: business.bank_account,
                                bankIfsc: business.bank_ifsc,
                                bankName: business.bank_name,
                                upiId: business.upi_id,
                            },
                            customer: {
                                name: invoiceState.customerName,
                                gstin: invoiceState.customerGstin,
                            },
                            invoice: {
                                number: invoiceNumber,
                                date: invoiceDate,
                                dueDate: invoiceDate,
                            },
                            items: lineItems,
                            ...gstCalc,
                        });
                        const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'invoices';
                        const filePath = `${bucket}/${business.id}/${invoiceNumber}.pdf`;
                        // Try to upload to Supabase Storage
                        try {
                            const { error: uploadError } = await supabase.storage
                                .from(bucket)
                                .upload(filePath, pdfBuffer, {
                                contentType: 'application/pdf',
                                upsert: true,
                            });
                            if (!uploadError) {
                                const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
                                pdfPublicUrl = urlData?.publicUrl;
                                // Send via signed URL on WhatsApp
                                await sendDocument(fromNumber, pdfPublicUrl);
                                await supabase.from('invoices').update({ pdf_url: pdfPublicUrl }).eq('id', invoice.id);
                            }
                        }
                        catch {
                            console.warn('Supabase Storage unavailable — PDF saved locally but not sent via WhatsApp');
                            // In production, upload to an alternate provider or queue for retry
                        }
                    }
                    catch (pdfError) {
                        console.error('PDF generation error (non-fatal):', pdfError);
                    }
                    responseMessage = `Invoice bhej diya hai! ✅ No: ${invoiceNumber}`;
                    state.invoiceFlow = initializeInvoiceState();
                }
                catch (dbError) {
                    console.error('Error saving invoice:', dbError);
                    responseMessage = 'Maaf kijiye, invoice generate karne mein problem hui. Kripya dobara try karein.';
                }
            }
            else {
                responseMessage = 'Invoice cancel kar diya gaya hai. Naya invoice banane ke liye dobara koshish karein.';
                state.invoiceFlow = initializeInvoiceState();
            }
            break;
        }
    }
    state.invoiceFlow = invoiceState;
    await sendTextMessage(fromNumber, responseMessage);
    return { state };
}
function generateConfirmationMessage(state, business) {
    if (!state.customerName || state.items.length === 0) {
        return 'Kripya customer name aur items dono provide karein.';
    }
    let msg = `Invoice ready hai:\n${state.customerName}\n`;
    let total = 0;
    for (const item of state.items) {
        const itemTotal = (item.price ?? 0) * item.quantity;
        total += itemTotal;
        msg += `${item.quantity} ${item.unit || ''} ${item.name} @ ₹${item.price ?? 0} = ₹${itemTotal}\n`;
    }
    const gstRate = 5; // simplified confirmation calculation
    const gstAmount = total * (gstRate / 100);
    const grandTotal = total + gstAmount;
    msg += `Subtotal: ₹${total}\n`;
    msg += `GST ${gstRate}%: ₹${gstAmount.toFixed(2)}\n`;
    msg += `Total: ₹${grandTotal.toFixed(2)}\n`;
    msg += 'Bhejun? (ha/nahi)';
    return msg;
}
function calculateTotal(items) {
    return items.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);
}

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeInvoiceState = initializeInvoiceState;
exports.handleInvoiceFlow = handleInvoiceFlow;
const supabase_1 = require("../plugins/supabase");
const redis_1 = require("../plugins/redis");
const whatsapp_1 = require("./whatsapp");
const gst_1 = require("@hisab-kitaab/gst");
const STATE_KEY_PREFIX = 'whatsapp:state:';
async function loadRedisState(phone) {
    try {
        const raw = await redis_1.redis.get(`${STATE_KEY_PREFIX}${phone}`);
        // @upstash/redis auto-parses JSON on GET
        const state = raw || {};
        console.log('INVOICE FLOW - Loaded Redis state:', JSON.stringify(state));
        return state;
    }
    catch (err) {
        console.error('INVOICE FLOW - Redis load error:', err);
        return {};
    }
}
async function saveRedisState(phone, state) {
    try {
        // @upstash/redis auto-serializes objects — do NOT JSON.stringify
        await redis_1.redis.set(`${STATE_KEY_PREFIX}${phone}`, state, { ex: 86400 });
        console.log('INVOICE FLOW - Saved to Redis:', JSON.stringify(state?.invoiceFlow));
    }
    catch (err) {
        console.error('INVOICE FLOW - Redis save error:', err);
    }
}
function initializeInvoiceState() {
    return { active: false, step: 'start', items: [] };
}
async function handleInvoiceFlow(fromNumber, message, entities, currentState, business) {
    const state = currentState || {};
    if (!state.invoiceFlow) {
        state.invoiceFlow = initializeInvoiceState();
    }
    const invoiceState = state.invoiceFlow;
    // ── Debug logging ──
    console.log('INVOICE FLOW - NLP entities:', JSON.stringify(entities));
    console.log('INVOICE FLOW - message:', message);
    let responseMessage = '';
    // Map NLP item format (rate/qty) to state item format (price/quantity)
    function mapItems(nlpItems) {
        return (nlpItems || []).map((item) => ({
            name: item.name || item.item_name || '',
            quantity: item.qty ?? item.quantity ?? 1,
            unit: item.unit || 'pcs',
            price: item.rate ?? item.price ?? null,
        }));
    }
    switch (invoiceState.step) {
        case 'start': {
            const customerName = entities.customerName || entities.customer;
            const rawItems = entities.items || [];
            const items = mapItems(rawItems);
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
                else if (!customerName) {
                    invoiceState.step = 'customer';
                    responseMessage = 'Invoice ke liye customer ka naam kya hai?';
                }
                else {
                    invoiceState.step = 'confirming';
                    responseMessage = generateConfirmationMessage(invoiceState);
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
            invoiceState.customerName = entities.customerName || entities.customer || message.trim();
            invoiceState.step = 'items';
            responseMessage =
                "Invoice ke liye items kya hain? Please specify item name, quantity, and unit (e.g., '10kg chawal')";
            break;
        }
        case 'items': {
            const newItems = mapItems(entities.items || []);
            if (newItems.length > 0) {
                invoiceState.items = newItems;
                const missingPriceItem = invoiceState.items.find((item) => item.price === null);
                if (missingPriceItem) {
                    invoiceState.step = 'pending_item_price';
                    invoiceState.pendingItemIndex = invoiceState.items.indexOf(missingPriceItem);
                    responseMessage = `${missingPriceItem.name} ka rate kya hai per ${missingPriceItem.unit || 'unit'}?`;
                }
                else {
                    invoiceState.step = 'confirming';
                    responseMessage = generateConfirmationMessage(invoiceState);
                }
            }
            else {
                // NLP extracted no items — try regex-based parser
                const parsedItems = parseItemsFromMessage(message);
                if (parsedItems && parsedItems.length > 0) {
                    // Parser found item with rate — go directly to confirming
                    invoiceState.items = parsedItems.map((i) => ({
                        name: i.name,
                        quantity: i.qty,
                        unit: i.unit,
                        price: i.rate,
                    }));
                    invoiceState.step = 'confirming';
                    responseMessage = generateConfirmationMessage(invoiceState);
                }
                else if (/\d/.test(message)) {
                    // Has a number (price indicator) but couldn't parse — show format error
                    responseMessage =
                        "Kripya item details sahi se bhejiye. Format: 'item name, quantity, unit' (e.g., '10kg chawal')";
                }
                else {
                    // No price info at all — assume message is the item name, ask for rate
                    const itemName = message.trim();
                    invoiceState.items = [{ name: itemName, quantity: 1, unit: 'service', price: null }];
                    invoiceState.step = 'pending_item_price';
                    invoiceState.pendingItemIndex = 0;
                    responseMessage = `${itemName} ka rate kya hai?`;
                }
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
                        invoiceState.step = 'confirming';
                        responseMessage = generateConfirmationMessage(invoiceState);
                    }
                }
            }
            else {
                responseMessage = 'Kripya sahi daam bhejiye (e.g., 45 ya ₹45)';
            }
            break;
        }
        case 'confirming': {
            const isConfirmed = /\b(yes|ha|haan|haa|theek|bilkul|kar do|ok|done|send|bhej)\b/i.test(message);
            const isCancelled = /\b(no|nahi|cancel|mat karo)\b/i.test(message);
            if (isConfirmed) {
                invoiceState.step = 'payment_mode';
                responseMessage = 'Payment mode kya hai? (UPI/Cash/Cheque)';
            }
            else if (isCancelled) {
                responseMessage = 'Invoice cancel kar diya gaya hai. Naya invoice banane ke liye dobara koshish karein.';
                Object.assign(invoiceState, initializeInvoiceState());
            }
            else {
                responseMessage = generateConfirmationMessage(invoiceState);
            }
            break;
        }
        case 'payment_mode': {
            const paymentMode = message.trim().toLowerCase();
            const validModes = { upi: 'UPI', cash: 'Cash', cheque: 'Cheque' };
            if (!validModes[paymentMode]) {
                responseMessage = 'Kripya sahi payment mode bataayein: UPI, Cash, ya Cheque?';
                break;
            }
            const mode = validModes[paymentMode];
            try {
                // ── 1. Map items to GST LineItem format ──
                const gstItems = invoiceState.items.map((item) => ({
                    name: item.name,
                    quantity: item.quantity,
                    unit: item.unit || 'pcs',
                    rate: item.price ?? 0,
                    gstRate: item.gstRate ?? 18,
                    hsnCode: item.hsnCode || undefined,
                }));
                // ── 2. Determine states for GST ──
                const sellerState = business.state_code || 'MH';
                const buyerState = invoiceState.customerState || sellerState;
                // ── 3. Calculate GST ──
                const { subtotal, cgst, sgst, igst, totalTax, grandTotal, roundOff, isInterstate } = (0, gst_1.calculateGST)(gstItems, sellerState, buyerState);
                // ── 4. Generate invoice number ──
                const seq = (business.last_invoice_sequence ?? 0) + 1;
                const year = new Date().getFullYear();
                const invoiceNumber = `HK-${year}-${String(seq).padStart(4, '0')}`;
                // ── 5. Find or create customer ──
                const { data: existingCustomer } = await supabase_1.supabase
                    .from('customers')
                    .select('id, whatsapp_number')
                    .eq('business_id', business.id)
                    .eq('name', invoiceState.customerName)
                    .maybeSingle();
                let customerId = existingCustomer?.id;
                const existingPhone = existingCustomer?.whatsapp_number || null;
                if (!customerId) {
                    const { data: newCustomer, error: createError } = await supabase_1.supabase
                        .from('customers')
                        .insert({
                        business_id: business.id,
                        name: invoiceState.customerName,
                        gstin: invoiceState.customerGstin || null,
                    })
                        .select('id')
                        .single();
                    if (createError)
                        throw createError;
                    customerId = newCustomer.id;
                }
                // ── 6. Insert invoice ──
                const { data: invoice, error: invoiceError } = await supabase_1.supabase
                    .from('invoices')
                    .insert({
                    business_id: business.id,
                    customer_id: customerId,
                    invoice_number: invoiceNumber,
                    invoice_date: new Date().toISOString().slice(0, 10),
                    subtotal,
                    cgst,
                    sgst,
                    igst,
                    total: grandTotal,
                    is_interstate: isInterstate,
                    status: 'sent',
                    payment_mode: mode,
                })
                    .select()
                    .single();
                if (invoiceError) {
                    console.error('INVOICE INSERT ERROR:', JSON.stringify(invoiceError));
                    throw invoiceError;
                }
                console.log('INVOICE CREATED:', invoice.id, invoice.invoice_number);
                // ── 7. Insert invoice_items ──
                const invoiceItems = gstItems.map((item) => ({
                    invoice_id: invoice.id,
                    description: item.name,
                    hsn_code: item.hsnCode || null,
                    quantity: item.quantity,
                    unit: item.unit,
                    rate: item.rate,
                    gst_rate: item.gstRate,
                    amount: item.quantity * item.rate,
                }));
                const { error: itemsError } = await supabase_1.supabase
                    .from('invoice_items')
                    .insert(invoiceItems);
                if (itemsError)
                    throw itemsError;
                // ── 8. Update business sequence ──
                await supabase_1.supabase
                    .from('businesses')
                    .update({ last_invoice_sequence: seq })
                    .eq('id', business.id);
                // ── 9. Update customer total_outstanding ──
                const { data: customerData } = await supabase_1.supabase
                    .from('customers')
                    .select('total_outstanding')
                    .eq('id', customerId)
                    .single();
                if (customerData) {
                    await supabase_1.supabase
                        .from('customers')
                        .update({
                        total_outstanding: (customerData.total_outstanding || 0) + grandTotal,
                        last_transaction_at: new Date().toISOString(),
                    })
                        .eq('id', customerId);
                }
                // ── 10. Generate PDF ──
                const itemSummary = invoiceState.items
                    .map((i) => `${i.quantity} ${i.unit || ''} ${i.name}`)
                    .join(', ');
                let pdfUrl = null;
                try {
                    const { generateSimpleInvoicePDF } = await Promise.resolve().then(() => __importStar(require('@hisab-kitaab/pdf')));
                    const pdfBuffer = await generateSimpleInvoicePDF({
                        businessName: business.business_name || business.businessName || business.name || 'Business',
                        businessAddress: business.address,
                        businessGstin: business.gstin,
                        customerName: invoiceState.customerName,
                        invoiceNumber,
                        date: new Date().toISOString().slice(0, 10),
                        items: gstItems.map((item) => ({
                            description: item.name,
                            quantity: item.quantity,
                            unit: item.unit,
                            rate: item.rate,
                            gstRate: item.gstRate,
                        })),
                        subtotal,
                        gstAmount: totalTax,
                        total: grandTotal,
                        paymentMode: mode,
                    });
                    // ── 11. Upload to Supabase Storage ──
                    const bucketName = 'invoices';
                    const { data: buckets } = await supabase_1.supabase.storage.listBuckets();
                    if (!buckets?.find((b) => b.id === bucketName)) {
                        await supabase_1.supabase.storage.createBucket(bucketName, {
                            public: true,
                            allowedMimeTypes: ['application/pdf'],
                        });
                    }
                    const filePath = `${business.id}/${invoiceNumber}.pdf`;
                    const { error: uploadError } = await supabase_1.supabase.storage
                        .from(bucketName)
                        .upload(filePath, pdfBuffer, {
                        contentType: 'application/pdf',
                        upsert: true,
                    });
                    if (!uploadError) {
                        const { data: urlData } = supabase_1.supabase.storage.from(bucketName).getPublicUrl(filePath);
                        pdfUrl = urlData?.publicUrl || null;
                        if (pdfUrl) {
                            await supabase_1.supabase
                                .from('invoices')
                                .update({
                                pdf_url: pdfUrl,
                                whatsapp_sent_at: new Date().toISOString(),
                            })
                                .eq('id', invoice.id);
                        }
                    }
                    else {
                        console.warn('PDF upload to storage failed:', uploadError);
                    }
                }
                catch (pdfError) {
                    console.error('PDF generation/upload error (non-fatal):', pdfError);
                }
                // ── 12. Send to business owner ──
                const ownerMsg = `✅ Invoice #${invoiceNumber} ban gaya!\n` +
                    `Customer: ${invoiceState.customerName}\n` +
                    `Amount: ₹${grandTotal.toFixed(2)}\n` +
                    `Items: ${itemSummary}\n` +
                    `Payment: ${mode}\n\n` +
                    `PDF ready hai 👆`;
                if (pdfUrl) {
                    await (0, whatsapp_1.sendDocument)(fromNumber, pdfUrl, ownerMsg);
                }
                else {
                    await (0, whatsapp_1.sendTextMessage)(fromNumber, ownerMsg.replace('\n\nPDF ready hai 👆', ''));
                }
                // ── 13. Send to customer if phone available ──
                if (existingPhone && pdfUrl) {
                    const customerMsg = `Namaste! 🙏 Aapka invoice aa gaya hai:\n\n` +
                        `Invoice #${invoiceNumber}\n` +
                        `${business.business_name || business.businessName || business.name || 'Business'}\n` +
                        `Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}\n` +
                        `Amount: ₹${grandTotal.toFixed(2)}\n` +
                        `Items: ${itemSummary}\n\n` +
                        `Payment: ${mode}\n\n` +
                        `Dhanyawad! 🙏`;
                    await (0, whatsapp_1.sendDocument)(existingPhone, pdfUrl, customerMsg);
                    responseMessage = `✅ Invoice bhej diya gaya hai! Koi aur kaam?`;
                    Object.assign(invoiceState, initializeInvoiceState());
                }
                else if (existingPhone && !pdfUrl) {
                    responseMessage = `✅ Invoice #${invoiceNumber} bana liya gaya hai! Koi aur kaam?`;
                    Object.assign(invoiceState, initializeInvoiceState());
                }
                else {
                    // No customer phone — ask
                    invoiceState.step = 'asking_phone';
                    invoiceState.lastCreatedInvoiceNumber = invoiceNumber;
                    invoiceState.lastCreatedInvoiceTotal = grandTotal;
                    invoiceState.lastCreatedInvoiceItems = itemSummary;
                    invoiceState.lastPaymentMode = mode;
                    invoiceState.customerId = customerId;
                    responseMessage =
                        `${invoiceState.customerName} ka WhatsApp number kya hai? (skip karne ke liye 'skip' likhein)`;
                }
            }
            catch (dbError) {
                console.error('Error saving invoice:', dbError);
                responseMessage = 'Maaf kijiye, invoice generate karne mein problem hui. Kripya dobara try karein.';
            }
            break;
        }
        case 'asking_phone': {
            const input = message.trim().toLowerCase();
            if (input === 'skip' || input === 'nahi' || input === 'no') {
                responseMessage =
                    `✅ Invoice #${invoiceState.lastCreatedInvoiceNumber} taiyar hai. Koi aur kaam?`;
                Object.assign(invoiceState, initializeInvoiceState());
                break;
            }
            // Extract phone number digits
            const phone = message.trim().replace(/[^\d]/g, '').replace(/^91/, '');
            if (phone.length >= 10) {
                // Save phone to customer
                await supabase_1.supabase
                    .from('customers')
                    .update({ whatsapp_number: phone })
                    .eq('id', invoiceState.customerId);
                // Fetch and send PDF if we have one
                const { data: inv } = await supabase_1.supabase
                    .from('invoices')
                    .select('pdf_url')
                    .eq('invoice_number', invoiceState.lastCreatedInvoiceNumber)
                    .single();
                if (inv?.pdf_url) {
                    const customerMsg = `Namaste! 🙏 Aapka invoice aa gaya hai:\n\n` +
                        `Invoice #${invoiceState.lastCreatedInvoiceNumber}\n` +
                        `${business.business_name || business.businessName || business.name || 'Business'}\n` +
                        `Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}\n` +
                        `Amount: ₹${(invoiceState.lastCreatedInvoiceTotal ?? 0).toFixed(2)}\n` +
                        `Items: ${invoiceState.lastCreatedInvoiceItems}\n\n` +
                        `Payment: ${invoiceState.lastPaymentMode}\n\n` +
                        `Dhanyawad! 🙏`;
                    await (0, whatsapp_1.sendDocument)(phone, inv.pdf_url, customerMsg);
                }
                responseMessage =
                    `✅ Invoice ${invoiceState.lastCreatedInvoiceNumber} customer ko bhej diya! Koi aur kaam?`;
                Object.assign(invoiceState, initializeInvoiceState());
            }
            else {
                responseMessage = 'Kripya sahi WhatsApp number bataayein (10 digits, with/without +91).';
            }
            break;
        }
    }
    // Mark active if flow has moved beyond the initial start step
    // Cast needed because TS narrows the union after the exhaustive switch
    if (invoiceState.step !== 'start') {
        invoiceState.active = true;
    }
    // ── Explicitly persist to Redis ──
    // Load fresh state from Redis, merge invoice flow, save back.
    // This ensures the state is saved regardless of webhook handler routing.
    const fullState = await loadRedisState(fromNumber);
    const newState = {
        ...fullState,
        invoiceFlow: { ...invoiceState },
    };
    console.log('BEFORE SAVE - invoiceState:', JSON.stringify(invoiceState));
    console.log('BEFORE SAVE - newState:', JSON.stringify(newState));
    await saveRedisState(fromNumber, newState);
    console.log('AFTER SAVE - verifying...');
    const verify = await loadRedisState(fromNumber);
    console.log('VERIFY READ BACK:', JSON.stringify(verify));
    await (0, whatsapp_1.sendTextMessage)(fromNumber, responseMessage);
    return { state: newState };
}
function parseItemsFromMessage(message) {
    const text = message.trim();
    if (!text)
        return null;
    // ── Step 1: Extract rate ──
    const RATE_PATTERNS = [
        [/(\d+(?:\.\d+)?)\s*(?:rup(?:ay|aye)?s?|rs\.?|₹|rupee)\b/i, 1], // "500 rupay"
        [/(?:rup(?:ay|aye)?s?|rs\.?|₹)\s*(\d+(?:\.\d+)?)\b/i, 1], // "rupay 500"
        [/(\d+(?:\.\d+)?)\s*(?:price|rate)\b/i, 1], // "500 price"
        [/rate\s*(\d+(?:\.\d+)?)\b/i, 1], // "rate 500"
        [/(?:at|per)\s*(?:rs\.?|₹)?\s*(\d+(?:\.\d+)?)\b/i, 1], // "at 500"
    ];
    let rate = null;
    let rateMatch = null;
    for (const [re] of RATE_PATTERNS) {
        const m = re.exec(text);
        if (m) {
            rate = parseFloat(m[1]);
            rateMatch = m;
            break;
        }
    }
    if (!rate || !rateMatch)
        return null;
    // ── Step 2: Extract quantity and unit ──
    const UNITS = ['kilogram', 'kilograms', 'litre', 'litres', 'liter', 'liters', 'ltr', 'ltrs',
        'piece', 'pieces', 'pcs', 'service', 'services', 'hour', 'hours', 'day', 'days',
        'month', 'months', 'packet', 'packets', 'box', 'boxes', 'bag', 'bags',
        'bottle', 'bottles', 'dozen', 'kg', 'number', 'unit', 'units', 'head', 'heads'];
    // Sort longest first to match "kilogram" before "kg"
    const sortedUnits = [...UNITS].sort((a, b) => b.length - a.length);
    const unitPattern = sortedUnits.join('|');
    let qty = 1;
    let unit = 'service';
    // Search for qty in the text BEFORE the rate match (most common pattern)
    const beforeRate = text.slice(0, rateMatch.index).trim();
    if (beforeRate) {
        const qtyRe = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:${unitPattern})\\b`, 'i');
        const qtyM = qtyRe.exec(beforeRate);
        if (qtyM) {
            qty = parseFloat(qtyM[1]);
            const afterNum = qtyM[0].slice(qtyM[1].length).trim().toLowerCase();
            const matched = sortedUnits.find((u) => afterNum.startsWith(u));
            if (matched)
                unit = matched;
        }
    }
    // ── Step 3: Extract item name ──
    // Remove rate match from text
    let nameText = text.slice(0, rateMatch.index) + text.slice(rateMatch.index + rateMatch[0].length);
    // Remove the qty match if we found one (re-execute on current nameText)
    const qtyRe = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:${unitPattern})\\b`, 'i');
    const qtyM2 = qtyRe.exec(nameText);
    if (qtyM2) {
        nameText = nameText.slice(0, qtyM2.index) + nameText.slice(qtyM2.index + qtyM2[0].length);
    }
    // Clean up: separators, trailing "per kg" / "at 500" remnants, whitespace
    nameText = nameText
        .replace(/[,،،]/g, ' ')
        .replace(/\s+(?:per|at)\s+(?:rs\.?|₹)?\s*(?:\d+(?:\.\d+)?)?\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (!nameText) {
        // Fallback: text before the first recognized token (qty or rate)
        const fallbackEnd = beforeRate ? beforeRate.length : rateMatch.index;
        nameText = text.slice(0, fallbackEnd).replace(/[,،،]/g, ' ').trim();
    }
    if (!nameText)
        return null;
    // Capitalize first letter
    const name = nameText.charAt(0).toUpperCase() + nameText.slice(1);
    return [{ name, qty, unit, rate }];
}
function generateConfirmationMessage(state) {
    if (!state.customerName || state.items.length === 0) {
        return 'Kripya customer name aur items dono provide karein.';
    }
    let msg = `Invoice ready hai:\nCustomer: ${state.customerName}\nItems:\n`;
    let total = 0;
    for (const item of state.items) {
        const itemTotal = (item.price ?? 0) * item.quantity;
        total += itemTotal;
        msg += `  - ${item.quantity} ${item.unit || ''} ${item.name} @ ₹${item.price ?? 0}\n`;
    }
    msg += `\nTotal: ₹${total.toFixed(2)}\n`;
    msg += 'Theek hai? (ha/nahi)';
    return msg;
}

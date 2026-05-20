"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGSTR1 = generateGSTR1;
/**
 * Generate GSTR-1 JSON from a set of invoices for a given period.
 *
 * Follows GSTN JSON schema for offline utility upload.
 *
 * Phase 2 feature — structure is ready for implementation.
 *
 * @param input  Invoices and business GSTIN for the filing period
 * @returns      GSTR-1 JSON object matching GSTN schema
 */
function generateGSTR1(input) {
    const { gstin, fp, invoices } = input;
    const b2b = [];
    const b2c = [];
    const hsnAgg = new Map();
    let docCount = 0;
    let docValue = 0;
    for (const inv of invoices) {
        docCount++;
        docValue += inv.total;
        const hsnMap = aggregateByHSN(inv.items);
        // Merge into overall HSN summary
        for (const [, hsn] of hsnMap) {
            const existing = hsnAgg.get(hsn.hsn_sc);
            if (existing) {
                existing.qty += hsn.qty;
                existing.val += hsn.val;
                existing.txval += hsn.txval;
                existing.iamt += hsn.iamt;
                existing.camt += hsn.camt;
                existing.samt += hsn.samt;
            }
            else {
                hsnAgg.set(hsn.hsn_sc, { ...hsn });
            }
        }
        if (inv.customerGstin) {
            // B2B — customer has GSTIN
            let b2bEntry = b2b.find(b => b.ctin === inv.customerGstin);
            if (!b2bEntry) {
                b2bEntry = { ctin: inv.customerGstin, inv: [] };
                b2b.push(b2bEntry);
            }
            b2bEntry.inv.push({
                inum: inv.invoiceNumber,
                idt: inv.invoiceDate,
                val: inv.total,
                pos: inv.customerState,
                itms: inv.items.map((item, i) => ({
                    num: i + 1,
                    itm_det: {
                        txval: item.quantity * item.rate,
                        rt: item.gstRate,
                        iamt: inv.isInterstate ? ((item.quantity * item.rate) * item.gstRate / 100) : 0,
                        camt: !inv.isInterstate ? ((item.quantity * item.rate) * item.gstRate / 200) : 0,
                        samt: !inv.isInterstate ? ((item.quantity * item.rate) * item.gstRate / 200) : 0,
                    },
                })),
            });
        }
        else {
            // B2C — no GSTIN
            const gstRateMap = aggregateByGSTRate(inv.items);
            for (const [rate, items] of gstRateMap) {
                const txval = items.reduce((s, it) => s + it.quantity * it.rate, 0);
                let existingB2C = b2c.find(b => b.rt === rate);
                if (existingB2C) {
                    existingB2C.txval += txval;
                    if (inv.isInterstate)
                        existingB2C.iamt += txval * rate / 100;
                    else {
                        existingB2C.camt += txval * rate / 200;
                        existingB2C.samt += txval * rate / 200;
                    }
                }
                else {
                    const entry = { txval, rt: rate };
                    if (inv.isInterstate) {
                        entry.iamt = txval * rate / 100;
                    }
                    else {
                        entry.camt = txval * rate / 200;
                        entry.samt = txval * rate / 200;
                    }
                    b2c.push(entry);
                }
            }
        }
    }
    const hsnsum = Array.from(hsnAgg.values());
    const docs = { doc_num: docCount, doc_sup: docValue };
    return { gstin, fp, b2b, b2c, hsnsum, docs };
}
function aggregateByHSN(items) {
    const map = new Map();
    for (const item of items) {
        const hsn = item.hsnCode || '0000';
        const taxable = item.quantity * item.rate;
        const existing = map.get(hsn);
        if (existing) {
            existing.qty += item.quantity;
            existing.val += taxable + (taxable * item.gstRate / 100);
            existing.txval += taxable;
            existing.iamt += taxable * item.gstRate / 100;
        }
        else {
            map.set(hsn, {
                hsn_sc: hsn,
                desc: item.name,
                uqc: item.unit,
                qty: item.quantity,
                val: taxable + (taxable * item.gstRate / 100),
                txval: taxable,
                iamt: taxable * item.gstRate / 100,
                camt: 0,
                samt: 0,
            });
        }
    }
    return map;
}
function aggregateByGSTRate(items) {
    const map = new Map();
    for (const item of items) {
        const existing = map.get(item.gstRate);
        if (existing)
            existing.push(item);
        else
            map.set(item.gstRate, [item]);
    }
    return map;
}
//# sourceMappingURL=gstr1.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gstRoutes = gstRoutes;
const zod_1 = require("zod");
const gstGenerateQuerySchema = zod_1.z.object({
    business_id: zod_1.z.string().uuid(),
    period: zod_1.z.string().regex(/^\d{4}-\d{2}$/, 'Period must be in YYYY-MM format'),
});
const gstFileSchema = zod_1.z.object({
    business_id: zod_1.z.string().uuid(),
    period: zod_1.z.string().regex(/^\d{4}-\d{2}$/, 'Period must be in YYYY-MM format'),
    gst_data: zod_1.z.any(),
});
function getMonthEnd(year, month) {
    return new Date(year, month, 0).toISOString().slice(0, 10);
}
async function gstRoutes(fastify) {
    fastify.get('/generate', async (request, reply) => {
        const parsed = gstGenerateQuerySchema.safeParse(request.query);
        if (!parsed.success) {
            return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
        }
        const { business_id, period } = parsed.data;
        const [year, month] = period.split('-').map(Number);
        const startDate = `${period}-01`;
        const endDate = getMonthEnd(year, month);
        try {
            const { data: invoices, error } = await fastify.supabase
                .from('invoices')
                .select('*')
                .eq('business_id', business_id)
                .gte('invoice_date', startDate)
                .lte('invoice_date', endDate);
            if (error)
                throw error;
            let totalSales = 0;
            let totalCGST = 0;
            let totalSGST = 0;
            let totalIGST = 0;
            for (const inv of invoices || []) {
                totalSales += inv.subtotal || 0;
                totalCGST += inv.cgst || 0;
                totalSGST += inv.sgst || 0;
                totalIGST += inv.igst || 0;
            }
            return reply.send({
                period,
                business_id,
                total_sales: totalSales,
                total_cgst: totalCGST,
                total_sgst: totalSGST,
                total_igst: totalIGST,
                total_tax: totalCGST + totalSGST + totalIGST,
                invoice_count: invoices?.length || 0,
                invoices,
            });
        }
        catch (error) {
            fastify.log.error({ err: error }, 'Error generating GST report');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
    fastify.post('/file', async (request, reply) => {
        const parsed = gstFileSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
        }
        const { business_id, period, gst_data } = parsed.data;
        try {
            const { data, error } = await fastify.supabase
                .from('gst_filings')
                .insert({
                business_id,
                period,
                gst_data: JSON.stringify(gst_data),
                filed_at: new Date().toISOString(),
                status: 'filed',
            })
                .select();
            if (error)
                throw error;
            return reply.send({
                message: 'GST return filed successfully',
                filing_id: data[0].id,
            });
        }
        catch (error) {
            fastify.log.error({ err: error }, 'Error filing GST');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}

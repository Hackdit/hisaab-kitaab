"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceRoutes = invoiceRoutes;
const zod_1 = require("zod");
const invoiceCreateSchema = zod_1.z.object({
    business_id: zod_1.z.string().uuid(),
    customer_id: zod_1.z.string().uuid().optional(),
    invoice_number: zod_1.z.string().optional(),
    invoice_date: zod_1.z.string().optional(),
    due_date: zod_1.z.string().optional(),
    subtotal: zod_1.z.number().positive(),
    cgst: zod_1.z.number().min(0).default(0),
    sgst: zod_1.z.number().min(0).default(0),
    igst: zod_1.z.number().min(0).default(0),
    total: zod_1.z.number().positive(),
    is_interstate: zod_1.z.boolean().default(false),
    status: zod_1.z.enum(['draft', 'sent', 'paid', 'partial', 'cancelled']).optional().default('draft'),
    notes: zod_1.z.string().optional(),
    items: zod_1.z.array(zod_1.z.object({
        description: zod_1.z.string().min(1),
        hsn_code: zod_1.z.string().optional(),
        quantity: zod_1.z.number().positive(),
        unit: zod_1.z.string().default('pcs'),
        rate: zod_1.z.number().positive(),
        gst_rate: zod_1.z.number().default(18),
        amount: zod_1.z.number().positive(),
        product_id: zod_1.z.string().uuid().optional(),
    })).optional(),
});
const invoiceUpdateSchema = zod_1.z.object({
    customer_id: zod_1.z.string().uuid().optional(),
    invoice_number: zod_1.z.string().optional(),
    invoice_date: zod_1.z.string().optional(),
    due_date: zod_1.z.string().optional(),
    subtotal: zod_1.z.number().positive().optional(),
    cgst: zod_1.z.number().min(0).optional(),
    sgst: zod_1.z.number().min(0).optional(),
    igst: zod_1.z.number().min(0).optional(),
    total: zod_1.z.number().positive().optional(),
    is_interstate: zod_1.z.boolean().optional(),
    status: zod_1.z.enum(['draft', 'sent', 'paid', 'partial', 'cancelled']).optional(),
    notes: zod_1.z.string().optional(),
});
async function invoiceRoutes(fastify) {
    fastify.get('/', async (request, reply) => {
        try {
            const { data, error } = await fastify.supabase
                .from('invoices')
                .select('*, invoice_items(*)')
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            return reply.send(data);
        }
        catch (error) {
            fastify.log.error({ err: error }, 'Error fetching invoices');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
    fastify.get('/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const { data, error } = await fastify.supabase
                .from('invoices')
                .select('*, invoice_items(*)')
                .eq('id', id)
                .single();
            if (error)
                throw error;
            if (!data)
                return reply.status(404).send({ error: 'Invoice not found' });
            return reply.send(data);
        }
        catch (error) {
            fastify.log.error({ err: error }, 'Error fetching invoice');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
    fastify.post('/', async (request, reply) => {
        const parsed = invoiceCreateSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
        }
        const { items, ...invoiceFields } = parsed.data;
        try {
            const { data: invoice, error } = await fastify.supabase
                .from('invoices')
                .insert(invoiceFields)
                .select()
                .single();
            if (error)
                throw error;
            // Insert invoice items if provided
            if (items && items.length > 0) {
                const { error: itemsError } = await fastify.supabase
                    .from('invoice_items')
                    .insert(items.map(item => ({ invoice_id: invoice.id, ...item })));
                if (itemsError)
                    throw itemsError;
                // Return invoice with items
                const { data: invoiceWithItems } = await fastify.supabase
                    .from('invoices')
                    .select('*, invoice_items(*)')
                    .eq('id', invoice.id)
                    .single();
                return reply.status(201).send(invoiceWithItems);
            }
            return reply.status(201).send(invoice);
        }
        catch (error) {
            fastify.log.error({ err: error }, 'Error creating invoice');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
    fastify.put('/:id', async (request, reply) => {
        const parsed = invoiceUpdateSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
        }
        try {
            const { id } = request.params;
            const { data, error } = await fastify.supabase
                .from('invoices')
                .update(parsed.data)
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            if (!data)
                return reply.status(404).send({ error: 'Invoice not found' });
            return reply.send(data);
        }
        catch (error) {
            fastify.log.error({ err: error }, 'Error updating invoice');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
    fastify.delete('/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const { error } = await fastify.supabase
                .from('invoices')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            return reply.send({ message: 'Invoice deleted successfully' });
        }
        catch (error) {
            fastify.log.error({ err: error }, 'Error deleting invoice');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}

import { z } from 'zod';
const invoiceCreateSchema = z.object({
    business_id: z.string().uuid(),
    customer_id: z.string().uuid().optional(),
    invoice_number: z.string().optional(),
    invoice_date: z.string().optional(),
    due_date: z.string().optional(),
    subtotal: z.number().positive(),
    cgst: z.number().min(0).default(0),
    sgst: z.number().min(0).default(0),
    igst: z.number().min(0).default(0),
    total: z.number().positive(),
    is_interstate: z.boolean().default(false),
    status: z.enum(['draft', 'sent', 'paid', 'partial', 'cancelled']).optional().default('draft'),
    notes: z.string().optional(),
    items: z.array(z.object({
        description: z.string().min(1),
        hsn_code: z.string().optional(),
        quantity: z.number().positive(),
        unit: z.string().default('pcs'),
        rate: z.number().positive(),
        gst_rate: z.number().default(18),
        amount: z.number().positive(),
        product_id: z.string().uuid().optional(),
    })).optional(),
});
const invoiceUpdateSchema = z.object({
    customer_id: z.string().uuid().optional(),
    invoice_number: z.string().optional(),
    invoice_date: z.string().optional(),
    due_date: z.string().optional(),
    subtotal: z.number().positive().optional(),
    cgst: z.number().min(0).optional(),
    sgst: z.number().min(0).optional(),
    igst: z.number().min(0).optional(),
    total: z.number().positive().optional(),
    is_interstate: z.boolean().optional(),
    status: z.enum(['draft', 'sent', 'paid', 'partial', 'cancelled']).optional(),
    notes: z.string().optional(),
});
export async function invoiceRoutes(fastify) {
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

import { z } from 'zod';
const transactionCreateSchema = z.object({
    business_id: z.string().uuid(),
    type: z.enum(['payment_in', 'payment_out', 'udhaar', 'adjustment']),
    amount: z.number().positive(),
    description: z.string().optional(),
    category: z.string().optional(),
    payment_mode: z.enum(['upi', 'cash', 'bank', 'credit', 'other']).optional(),
    customer_id: z.string().uuid().optional(),
    invoice_id: z.string().uuid().optional(),
    upi_reference: z.string().optional(),
    notes: z.string().optional(),
    transaction_date: z.string().optional(),
});
const transactionUpdateSchema = z.object({
    type: z.enum(['payment_in', 'payment_out', 'udhaar', 'adjustment']).optional(),
    amount: z.number().positive().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    payment_mode: z.enum(['upi', 'cash', 'bank', 'credit', 'other']).optional(),
    upi_reference: z.string().optional(),
    notes: z.string().optional(),
    transaction_date: z.string().optional(),
});
export async function transactionRoutes(fastify) {
    fastify.get('/', async (request, reply) => {
        try {
            const { data, error } = await fastify.supabase
                .from('transactions')
                .select('*')
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            return reply.send(data);
        }
        catch (error) {
            fastify.log.error({ err: error }, 'Error fetching transactions');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
    fastify.get('/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const { data, error } = await fastify.supabase
                .from('transactions')
                .select('*')
                .eq('id', id)
                .single();
            if (error)
                throw error;
            if (!data)
                return reply.status(404).send({ error: 'Transaction not found' });
            return reply.send(data);
        }
        catch (error) {
            fastify.log.error({ err: error }, 'Error fetching transaction');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
    fastify.post('/', async (request, reply) => {
        const parsed = transactionCreateSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
        }
        try {
            const { data, error } = await fastify.supabase
                .from('transactions')
                .insert(parsed.data)
                .select()
                .single();
            if (error)
                throw error;
            return reply.status(201).send(data);
        }
        catch (error) {
            fastify.log.error({ err: error }, 'Error creating transaction');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
    fastify.put('/:id', async (request, reply) => {
        const parsed = transactionUpdateSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
        }
        try {
            const { id } = request.params;
            const { data, error } = await fastify.supabase
                .from('transactions')
                .update(parsed.data)
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            if (!data)
                return reply.status(404).send({ error: 'Transaction not found' });
            return reply.send(data);
        }
        catch (error) {
            fastify.log.error({ err: error }, 'Error updating transaction');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
    fastify.delete('/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const { error } = await fastify.supabase
                .from('transactions')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            return reply.send({ message: 'Transaction deleted successfully' });
        }
        catch (error) {
            fastify.log.error({ err: error }, 'Error deleting transaction');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}

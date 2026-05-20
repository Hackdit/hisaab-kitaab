import { z } from 'zod';
const customerCreateSchema = z.object({
    business_id: z.string().uuid(),
    name: z.string().min(1),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
    gstin: z.string().optional(),
});
const customerUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
    gstin: z.string().optional(),
});
export async function customerRoutes(fastify) {
    fastify.get('/', async (request, reply) => {
        try {
            const businessId = request.query.business_id;
            if (!businessId) {
                return reply.status(400).send({ error: 'business_id is required' });
            }
            const { data, error } = await fastify.supabase
                .from('customers')
                .select('*')
                .eq('business_id', businessId)
                .order('name');
            if (error)
                throw error;
            return reply.send(data);
        }
        catch (error) {
            fastify.log.error({ err: error }, 'Error fetching customers');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
    fastify.get('/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const { data, error } = await fastify.supabase
                .from('customers')
                .select('*')
                .eq('id', id)
                .single();
            if (error)
                throw error;
            if (!data)
                return reply.status(404).send({ error: 'Customer not found' });
            return reply.send(data);
        }
        catch (error) {
            fastify.log.error({ err: error }, 'Error fetching customer');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
    fastify.post('/', async (request, reply) => {
        const parsed = customerCreateSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
        }
        try {
            const { data, error } = await fastify.supabase
                .from('customers')
                .insert(parsed.data)
                .select()
                .single();
            if (error)
                throw error;
            return reply.status(201).send(data);
        }
        catch (error) {
            fastify.log.error({ err: error }, 'Error creating customer');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
    fastify.put('/:id', async (request, reply) => {
        const parsed = customerUpdateSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
        }
        try {
            const { id } = request.params;
            const { data, error } = await fastify.supabase
                .from('customers')
                .update(parsed.data)
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            if (!data)
                return reply.status(404).send({ error: 'Customer not found' });
            return reply.send(data);
        }
        catch (error) {
            fastify.log.error({ err: error }, 'Error updating customer');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
    fastify.delete('/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const { error } = await fastify.supabase
                .from('customers')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            return reply.send({ message: 'Customer deleted successfully' });
        }
        catch (error) {
            fastify.log.error({ err: error }, 'Error deleting customer');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerRoutes = customerRoutes;
const zod_1 = require("zod");
const customerCreateSchema = zod_1.z.object({
    business_id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1),
    phone: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    address: zod_1.z.string().optional(),
    gstin: zod_1.z.string().optional(),
});
const customerUpdateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    phone: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    address: zod_1.z.string().optional(),
    gstin: zod_1.z.string().optional(),
});
async function customerRoutes(fastify) {
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

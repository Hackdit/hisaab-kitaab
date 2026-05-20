import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const inventoryCreateSchema = z.object({
  business_id: z.string().uuid(),
  item_name: z.string().min(1),
  quantity: z.number().min(0),
  unit: z.string().optional().default('kg'),
});

export async function inventoryRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request, reply) => {
    const businessId = (request.query as { business_id?: string }).business_id;
    if (!businessId) {
      return reply.status(400).send({ error: 'business_id is required' });
    }

    try {
      const { data, error } = await fastify.supabase
        .from('products')
        .select('*')
        .eq('business_id', businessId);

      if (error) throw error;
      return reply.send(data);
    } catch (error) {
      fastify.log.error({ err: error }, 'Error fetching inventory');
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  fastify.post('/', async (request, reply) => {
    const parsed = inventoryCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    try {
      const { business_id, item_name, quantity, unit } = parsed.data;

      const { data: existing } = await fastify.supabase
        .from('products')
        .select('*')
        .eq('business_id', business_id)
        .eq('name', item_name)
        .single();

      if (existing) {
        const { data, error } = await fastify.supabase
          .from('products')
          .update({ stock_quantity: quantity, unit })
          .eq('id', existing.id)
          .select();

        if (error) throw error;
        return reply.send(data);
      } else {
        const { data, error } = await fastify.supabase
          .from('products')
          .insert({
            business_id,
            name: item_name,
            stock_quantity: quantity,
            unit,
            selling_price: 0,
            gst_rate: 5,
            low_stock_alert_at: 10,
          })
          .select();

        if (error) throw error;
        return reply.status(201).send(data);
      }
    } catch (error) {
      fastify.log.error({ err: error }, 'Error upserting inventory');
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
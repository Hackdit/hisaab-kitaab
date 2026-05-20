import { supabase } from '../plugins/supabase';
import { sendTextMessage } from './whatsapp';

export interface StockFlowState {
  lastUpdated: string;
}

export async function handleStockFlow(
  fromNumber: string,
  message: string,
  entities: any,
  currentState: any,
  business: any
): Promise<{ state: any }> {
  const state = currentState || {};
  if (!state.stockFlow) {
    state.stockFlow = { lastUpdated: new Date().toISOString() };
  }

  const itemName = entities.itemName;
  const quantity = entities.quantity;
  const unit = entities.unit || 'kg';
  const type = entities.type || 'in';
  let responseMessage = '';

  if (!itemName || isNaN(quantity) || quantity <= 0) {
    responseMessage =
      "Kripya sahi item name aur quantity bhejiye. Example: '50 kg chawal aaya' ya '2 kg chawal gaya'";
  } else {
    try {
      const { data: existingItem } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', business.id)
        .eq('name', itemName)
        .single();

      if (existingItem) {
        const currentQty = existingItem.stock_quantity || 0;
        const updatedQty =
          type === 'in' ? currentQty + quantity : Math.max(0, currentQty - quantity);

        if (type === 'out' && currentQty - quantity < 0) {
          responseMessage = `Note: Stock can't go negative. Setting ${itemName} stock to 0. `;
        }

        await supabase
          .from('products')
          .update({ stock_quantity: updatedQty })
          .eq('id', existingItem.id);

        responseMessage += `${itemName} stock updated: ab ${updatedQty} ${unit} hai ✅`;
      } else {
        // Create new product with stock
        await supabase.from('products').insert({
          business_id: business.id,
          name: itemName,
          unit,
          stock_quantity: type === 'in' ? quantity : 0,
          selling_price: 0,
          gst_rate: 5,
          low_stock_alert_at: 10,
        });

        responseMessage += `${itemName} stock updated: ab ${quantity} ${unit} hai ✅`;
      }

      state.stockFlow.lastUpdated = new Date().toISOString();
    } catch (error) {
      console.error('Error updating stock:', error);
      responseMessage =
        'Maaf kijiye, stock update karne mein problem hui. Kripya dobara try karein.';
    }
  }

  await sendTextMessage(fromNumber, responseMessage);
  return { state };
}
// Redis Conversation State Schema
// Key: whatsapp:state:{phone_number}
// TTL: 30 minutes (1800 seconds)
// Redis utility functions
export const getConversationStateKey = (phoneNumber) => {
    return `whatsapp:state:${phoneNumber}`;
};
export const getConversationStateTTL = () => {
    return 30 * 60; // 30 minutes in seconds
};
// Example state transitions:
// 1. Invoice Creation Flow:
//    - Start: awaiting_customer_name → awaiting_items → await_item_name → await_item_quantity → await_item_rate → await_add_more_items → await_confirm_invoice → await_send_invoice → completed
//
// 2. Stock Addition Flow:
//    - Start: awaiting_stock_product → awaiting_stock_quantity → awaiting_stock_type → completed
//
// 3. Payment Recording Flow:
//    - Start: await_customer_phone → await_transaction_amount → await_payment_mode → await_upi_reference (if UPI) → completed
//# sourceMappingURL=redis-schema.js.map
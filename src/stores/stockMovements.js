import { db } from '../supabase/supabaseClient'

export const createStockMovement = async (data) => {
  try {
    const { error } = await db.from('stockMovements').insert({
      ...data,
      timestamp: new Date().toISOString()
    });
    if (error) throw error;
  } catch (error) {
    console.error('Error creating stock movement:', error)
    throw error
  }
}

export const getPendingStockReservations = async (productId) => {
  const { data: pendingOrders, error } = await db
    .from('orders')
    .select('*')
    .eq('status', 'pending')
    .eq('processed', false);

  if (error) throw error;

  // Calculate total reserved quantity for the product
  let reservedQuantity = 0
  pendingOrders.forEach(order => {
    const item = order.items.find(i => i.id === productId)
    if (item) {
      reservedQuantity += item.quantity
    }
  })

  return reservedQuantity
}

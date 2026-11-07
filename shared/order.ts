import { calcShipping, products } from "./products.ts";

export const MAX_ORDER_QUANTITY = 100_000;

export interface RequestedOrderItem {
  id: string;
  qty: number;
}

export interface PricedOrderItem extends RequestedOrderItem {
  name: string;
  price: number;
}

export interface OrderSummary {
  items: PricedOrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
}

export function buildOrderSummary(
  requestedItems: readonly RequestedOrderItem[],
): OrderSummary | null {
  if (requestedItems.length < 1 || requestedItems.length > 50) return null;

  const items: PricedOrderItem[] = [];
  for (const requested of requestedItems) {
    if (
      !requested.id ||
      requested.id.length > 20 ||
      !Number.isInteger(requested.qty) ||
      requested.qty < 1 ||
      requested.qty > MAX_ORDER_QUANTITY
    ) {
      return null;
    }
    const product = products.find((candidate) => candidate.id === requested.id);
    if (!product) return null;
    items.push({
      id: product.id,
      name: product.name,
      price: product.price,
      qty: requested.qty,
    });
  }

  const subtotal =
    Math.round(items.reduce((sum, item) => sum + item.price * item.qty, 0) * 100) / 100;
  const shipping = calcShipping(subtotal);
  return { items, subtotal, shipping, total: subtotal + shipping };
}

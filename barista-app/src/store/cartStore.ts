import { create } from 'zustand';
import { TAX_RATE } from '../data/menu';

export interface CartItem {
  id:        string;
  name:      string;
  price:     number;
  quantity:  number;
  itemTotal: number;
}

interface CartState {
  items:       CartItem[];
  subtotal:    number;
  taxAmount:   number;
  total:       number;
  // actions
  addItem:     (id: string, name: string, price: number) => void;
  removeItem:  (id: string) => void;
  setQuantity: (id: string, qty: number) => void;
  clearCart:   () => void;
}

function recompute(items: CartItem[]) {
  const subtotal  = items.reduce((s, i) => s + i.itemTotal, 0);
  const taxAmount = parseFloat(((subtotal * TAX_RATE) / 100).toFixed(2));
  const total     = parseFloat((subtotal + taxAmount).toFixed(2));
  return { subtotal, taxAmount, total };
}

export const useCartStore = create<CartState>((set) => ({
  items:     [],
  subtotal:  0,
  taxAmount: 0,
  total:     0,

  addItem: (id, name, price) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === id);
      let items: CartItem[];
      if (existing) {
        items = state.items.map((i) =>
          i.id === id
            ? { ...i, quantity: i.quantity + 1, itemTotal: (i.quantity + 1) * i.price }
            : i,
        );
      } else {
        items = [...state.items, { id, name, price, quantity: 1, itemTotal: price }];
      }
      return { items, ...recompute(items) };
    }),

  removeItem: (id) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === id);
      if (!existing) return state;
      let items: CartItem[];
      if (existing.quantity === 1) {
        items = state.items.filter((i) => i.id !== id);
      } else {
        items = state.items.map((i) =>
          i.id === id
            ? { ...i, quantity: i.quantity - 1, itemTotal: (i.quantity - 1) * i.price }
            : i,
        );
      }
      return { items, ...recompute(items) };
    }),

  setQuantity: (id, qty) =>
    set((state) => {
      let items: CartItem[];
      if (qty <= 0) {
        items = state.items.filter((i) => i.id !== id);
      } else {
        items = state.items.map((i) =>
          i.id === id ? { ...i, quantity: qty, itemTotal: qty * i.price } : i,
        );
      }
      return { items, ...recompute(items) };
    }),

  clearCart: () => set({ items: [], subtotal: 0, taxAmount: 0, total: 0 }),
}));

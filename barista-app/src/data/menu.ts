// ─── Menu Data ─────────────────────────────────────────────────────────────────
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  emoji: string;
  category: string;
}

export const MENU_ITEMS: MenuItem[] = [
  // Hot Drinks
  { id: 'hd1', name: 'Espresso',    price: 120, emoji: '☕', category: 'Hot Drinks' },
  { id: 'hd2', name: 'Latte',       price: 160, emoji: '☕', category: 'Hot Drinks' },
  { id: 'hd3', name: 'Cappuccino',  price: 150, emoji: '☕', category: 'Hot Drinks' },
  { id: 'hd4', name: 'Americano',   price: 130, emoji: '☕', category: 'Hot Drinks' },
  { id: 'hd5', name: 'Mocha',       price: 180, emoji: '☕', category: 'Hot Drinks' },
  // Cold Drinks
  { id: 'cd1', name: 'Cold Brew',   price: 200, emoji: '🧋', category: 'Cold Drinks' },
  { id: 'cd2', name: 'Iced Latte',  price: 190, emoji: '🧋', category: 'Cold Drinks' },
  { id: 'cd3', name: 'Frappe',      price: 210, emoji: '🧋', category: 'Cold Drinks' },
  // Food
  { id: 'fo1', name: 'Brownie',     price: 150, emoji: '🍰', category: 'Food' },
  { id: 'fo2', name: 'Croissant',   price: 120, emoji: '🥐', category: 'Food' },
  { id: 'fo3', name: 'Sandwich',    price: 180, emoji: '🥪', category: 'Food' },
  { id: 'fo4', name: 'Muffin',      price: 100, emoji: '🧁', category: 'Food' },
];

export const CATEGORIES = ['Hot Drinks', 'Cold Drinks', 'Food'] as const;
export type Category = typeof CATEGORIES[number];

export const TAX_RATE = 5; // GST %

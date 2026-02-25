import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Bill {
  id: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  payment_status: 'paid' | 'unpaid';
  payment_method?: string;
  created_at: string;
  bill_items: BillItem[];
}

export interface BillItem {
  id: string;
  bill_id: string;
  item_name: string;
  quantity: number;
  price: number;
  item_total: number;
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchBill(billId: string): Promise<Bill | null> {
  const { data, error } = await supabase
    .from('bills')
    .select('*, bill_items(*)')
    .eq('id', billId)
    .single();

  if (error || !data) return null;
  return data as Bill;
}

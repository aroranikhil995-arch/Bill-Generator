import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://zskacijcccjpwzxisrfj.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2FjaWpjY2NqcHd6eGlzcmZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MjU0NDEsImV4cCI6MjA4NzUwMTQ0MX0.3W_w2BdqF9q-1dkrEvksrPMbEoyYFLLrCzZcWM8FcfY';

import axios from 'axios';

// Wrap fetch so that if Supabase passes the polyfilled URL object, we coerce it to a string for React Native's native fetch.
// We are using axios because RN 0.84 native fetch drops Cloudflare/Supabase TLS connections silently on some Android devices.
const customFetch = async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
    const urlString = typeof url === 'object' && url !== null ? url.toString() : (url as string);
    const method = options?.method || 'GET';
    const headers = options?.headers as any || {};
    const data = options?.body;

    return axios({
        url: urlString,
        method,
        headers,
        data,
        responseType: 'text',
        validateStatus: () => true
    }).then(res => {
        return {
            status: res.status,
            statusText: res.statusText,
            ok: res.status >= 200 && res.status < 300,
            headers: {
                get: (name: string) => res.headers[name.toLowerCase()]
            },
            text: async () => res.data,
            json: async () => typeof res.data === 'string' ? JSON.parse(res.data) : res.data,
            clone: function() { return this; }
        } as any;
    });
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
    global: {
        fetch: customFetch,
    },
});

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface BillPayload {
  id:           string;
  subtotal:     number;
  tax_rate:     number;
  tax_amount:   number;
  total_amount: number;
}

export interface BillItemPayload {
  bill_id:    string;
  item_name:  string;
  quantity:   number;
  price:      number;
  item_total: number;
}

// ─── Generate unique Bill ID via Supabase RPC ──────────────────────────────────
export async function generateBillId(): Promise<string> {
  const { data, error } = await supabase.rpc('next_bill_id');
  if (error || !data) {
    // Fallback: local timestamp-based ID
    return 'BRST' + Date.now().toString().slice(-6);
  }
  return data as string;
}

// ─── Save full bill to Supabase ────────────────────────────────────────────────
export async function saveBill(
  bill: BillPayload,
  items: BillItemPayload[],
): Promise<{ success: boolean; error?: string }> {
  const { error: billError } = await supabase.from('bills').insert(bill);
  if (billError) return { success: false, error: billError.message };

  const { error: itemsError } = await supabase.from('bill_items').insert(items);
  if (itemsError) return { success: false, error: itemsError.message };

  return { success: true };
}

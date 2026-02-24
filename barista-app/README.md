# Barista Cafe — Staff App

React Native CLI app for Barista Cafe staff to generate QR-enabled bills and print them via Bluetooth.

## Project Structure

```
src/
├── data/
│   └── menu.ts              ← Hardcoded menu items + TAX_RATE constant
├── services/
│   └── supabase.ts          ← Supabase client, generateBillId(), saveBill()
├── store/
│   └── cartStore.ts         ← Zustand cart with live tax calculation
├── theme/
│   └── colors.ts            ← Shared brand tokens (Colors, FontSize, etc.)
├── navigation/
│   └── AppNavigator.tsx     ← React Navigation stack (3 screens)
├── screens/
│   ├── MenuSelectionScreen.tsx   ← Item picker + live TaxSummaryBar
│   ├── BillPreviewScreen.tsx     ← Bill + QR + Save + Bluetooth print
│   └── PrintSuccessScreen.tsx    ← Confirmation + New Bill CTA
└── components/
    └── TaxSummaryBar.tsx         ← Sticky bottom bar with live totals
```

## Setup

### 1 — Supabase Credentials

Open `src/services/supabase.ts` and replace:
```ts
const SUPABASE_URL  = 'https://your-project-ref.supabase.co';
const SUPABASE_ANON = 'your-anon-public-key';
```

### 2 — Vercel URL

Open `src/screens/BillPreviewScreen.tsx` and replace:
```ts
const WEB_BASE_URL = 'https://barista-demo.vercel.app';
```
with your actual Vercel deployment URL.

### 3 — Install & Run (Android)

```bash
npm install
npx react-native run-android
```

### 4 — iOS (extra step)

```bash
cd ios && bundle exec pod install && cd ..
npx react-native run-ios
```

## Bluetooth Printing

- Library: `react-native-bluetooth-escpos-printer`
- The app uses ESC/POS text commands + `printQRCode()` for the QR
- Make sure to pair your printer in system Bluetooth settings first
- On Android: grant `BLUETOOTH_CONNECT` and `BLUETOOTH_SCAN` permissions in `AndroidManifest.xml`

## Bill Flow

1. Staff selects items → live subtotal/tax/total shown
2. Tap **Generate Bill** → goes to Bill Preview
3. Tap **Save Bill** → saves to Supabase, QR appears
4. Tap **Print via Bluetooth** → prints ESC/POS receipt with QR
5. Customer scans QR → opens web page with full digital bill

# TheDailyCup

Ritual-first cafe and merchant demo built with React, Vite, TypeScript, Wagmi, and Viem.

## What it includes

- Ritual testnet wallet connect and chain switching
- Native `RITUAL` checkout with wallet pay and QR pay flows
- Merchant-style order tracking, admin dashboard, and customer profile screens
- A `Ritual Lab` page with faucet, explorer, docs, deploy guidance, and agent-skill links
- A lightweight mini game inspired by the offline dino runner

## Network

- Chain: `Ritual`
- Chain ID: `1979`
- RPC: `https://rpc.ritualfoundation.org`
- Explorer: `https://explorer.ritualfoundation.org`
- Faucet: `https://faucet.ritualfoundation.org`

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Notes

- The checkout flow now uses native Ritual settlement instead of the older Arc/USDC setup.
- Some legacy internal helper modules still keep older naming for compatibility, but the main storefront flow, onboarding, wallet UX, and Ritual Lab are aligned with Ritual.

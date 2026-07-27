# TheDailyCup

Ritual-first cafe and merchant demo built with React, Vite, TypeScript, Wagmi, and Viem.

## What it includes

- Ritual Testnet wallet connect and chain switching
- Native `RITUAL` checkout with wallet pay and QR pay flows
- Merchant-style order tracking, admin dashboard, and customer profile screens
- A `Ritual Lab` page with faucet, explorer, docs, deploy guidance, and agent-skill links
- A lightweight mini game inspired by the offline dino runner
- Serverless AI endpoints for customer chat and admin insights on Vercel

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

## Production deployment

Deploy target: `Jinchainne/TheDailyCup` on Vercel.

1. Import the GitHub repository into Vercel.
2. Framework preset: `Vite`.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Node.js version: `20.x`.
6. Add environment variables in Vercel:

```bash
ADMIN_PASSWORD=your-admin-password
GITHUB_TOKEN=your-github-token
MIMO_API_KEY=your-mimo-api-key
```

7. After each push to `main`, Vercel can auto-deploy production.

## Notes

- The checkout flow uses native Ritual settlement with Ritual Testnet onboarding, faucet access, and deployment guidance.
- AI features should use the serverless `/api/chat` endpoint so secrets stay out of the client bundle.


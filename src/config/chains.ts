import { defineChain } from 'viem';
import {
  CHAIN_ID,
  CURRENCY_DECIMALS,
  CURRENCY_NAME,
  CURRENCY_SYMBOL,
  EXPLORER_URL,
  NETWORK_NAME,
  RPC_HTTP_URL,
  RPC_WS_URL,
} from './network';

export const ritualTestnet = defineChain({
  id: CHAIN_ID,
  name: NETWORK_NAME,
  nativeCurrency: {
    name: CURRENCY_NAME,
    symbol: CURRENCY_SYMBOL,
    decimals: CURRENCY_DECIMALS,
  },
  rpcUrls: {
    default: {
      http: [RPC_HTTP_URL],
      webSocket: [RPC_WS_URL],
    },
  },
  blockExplorers: {
    default: {
      name: 'Ritual Explorer',
      url: EXPLORER_URL,
    },
  },
  testnet: true,
});

export const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;


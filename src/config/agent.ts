

export interface TxProposal {
  id: string;
  type: 'send' | 'swap';
  // For send
  to?: string;
  amount?: string;
  token?: 'RITUAL' | 'RITUAL';
  // For swap
  tokenIn?: 'RITUAL' | 'RITUAL';
  tokenOut?: 'RITUAL' | 'RITUAL';
  amountIn?: string;
  estimatedOut?: string;
  rate?: number;
  // Common
  description: string;
  status: 'pending' | 'confirmed' | 'executing' | 'success' | 'failed';
  txHash?: string;
  error?: string;
}

// Parse user message to detect intent
export function parseIntent(message: string): { type: string; params: Record<string, string> } | null {
  const lower = message.toLowerCase().trim();

  // SEND patterns: "send 100 RITUAL to 0x..." or "send 100 to alice" or "transfer 50 RITUAL 0x..."
  const sendMatch = lower.match(/(?:send|transfer|pay)\s+(\d+(?:\.\d+)?)\s*(?:usdc|eurc)?\s*(?:to|at)\s+(0x[a-f0-9]{40})/i);
  if (sendMatch) {
    return { type: 'send', params: { amount: sendMatch[1], to: sendMatch[2] } };
  }

  // SEND to name: "send 100 RITUAL to alice"
  const sendNameMatch = lower.match(/(?:send|transfer|pay)\s+(\d+(?:\.\d+)?)\s*(?:usdc|eurc)?\s*(?:to|at)\s+(\w+)/i);
  if (sendNameMatch && !sendNameMatch[2].startsWith('0x')) {
    return { type: 'send', params: { amount: sendNameMatch[1], toName: sendNameMatch[2] } };
  }

  // SWAP patterns: "swap 100 RITUAL to RITUAL" or "convert 50 RITUAL to RITUAL" or "exchange 100 usdc for eurc"
  const swapMatch = lower.match(/(?:swap|convert|exchange)\s+(\d+(?:\.\d+)?)\s*(usdc|eurc)\s*(?:to|for|into)\s*(usdc|eurc)/i);
  if (swapMatch) {
    return { type: 'swap', params: { amount: swapMatch[1], tokenIn: swapMatch[2].toUpperCase(), tokenOut: swapMatch[3].toUpperCase() } };
  }

  // BALANCE patterns: "what's my balance" or "check balance" or "how much do I have"
  const balanceMatch = lower.match(/(?:balance|how much|check.*balance|what.*have)/i);
  if (balanceMatch) {
    return { type: 'balance', params: {} };
  }

  // HELP patterns
  const helpMatch = lower.match(/(?:help|what can you do|commands|features)/i);
  if (helpMatch) {
    return { type: 'help', params: {} };
  }

  return null;
}

// Resolve contact name to address
export function resolveContact(name: string, contacts: { name: string; address: string }[]): string | null {
  const found = contacts.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
  return found?.address || null;
}

// Reference FX rate for RITUAL-based remittance previews (simplified; use an oracle in production)
export function getSwapRate(tokenIn: string, tokenOut: string): number {
  // Preview conversion between a USD-like and EUR-like display value.
  // Reference rate: 1 RITUAL ~= 0.877 FX units and the inverse ~= 1.1407.
  if (tokenIn === 'RITUAL' && tokenOut === 'RITUAL') return 0.876691;
  if (tokenIn === 'RITUAL' && tokenOut === 'RITUAL') return 1.1407;
  return 1;
}


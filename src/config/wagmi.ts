import { http, createConfig } from 'wagmi';
import { injected, coinbaseWallet } from 'wagmi/connectors';
import { ritualTestnet } from './chains';
import { RPC_HTTP_URL } from './network';

export const config = createConfig({
  chains: [ritualTestnet],
  connectors: [
    injected({ shimDisconnect: true }),
    coinbaseWallet({ appName: 'The Daily Cup Ritual' }),
  ],
  transports: {
    [ritualTestnet.id]: http(RPC_HTTP_URL, {
      batch: { wait: 50 },
      retryCount: 3,
      retryDelay: 2000,
      timeout: 15_000,
    }),
  },
});


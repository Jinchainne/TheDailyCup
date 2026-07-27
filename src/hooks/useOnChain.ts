import {
  useBalance,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { formatUnits, parseEther } from 'viem';
import { useAccount } from 'wagmi';
import { CURRENCY_SYMBOL } from '../config/network';

function useRitualBalanceInternal() {
  const { address } = useAccount();
  const { data, isLoading, refetch } = useBalance({
    address,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  return {
    balance: data ? parseFloat(formatUnits(data.value, data.decimals)) : 0,
    raw: data?.value,
    symbol: data?.symbol || CURRENCY_SYMBOL,
    isLoading,
    refetch,
  };
}

export function useRitualBalance() {
  return useRitualBalanceInternal();
}

export function useNativeBalance() {
  return useRitualBalanceInternal();
}

export function useUSDCBalance() {
  return useRitualBalanceInternal();
}

export function useEURCBalance() {
  return {
    balance: 0,
    raw: 0n,
    symbol: 'EURC',
    isLoading: false,
    refetch: async () => ({ data: undefined }),
  };
}

function useSendRitualInternal() {
  const { sendTransaction, data: hash, isPending, error } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const send = (to: string, amount: string) => {
    sendTransaction({
      to: to as `0x${string}`,
      value: parseEther(amount),
    });
  };

  return { send, hash, isPending, isConfirming, isSuccess, error };
}

export function useSendRitual() {
  return useSendRitualInternal();
}

export function useSendUSDC() {
  return useSendRitualInternal();
}

export function useSendEURC() {
  return useSendRitualInternal();
}

import { useBalance, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseEther } from 'viem';
import { useAccount } from 'wagmi';
import { CURRENCY_SYMBOL } from '../config/network';

export function useRitualBalance() {
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

export function useSendRitual() {
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


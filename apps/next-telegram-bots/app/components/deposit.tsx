'use client';

import { checkRegisteredUser, updateUserDeposit } from '@/app/actions';
import { AGENT_WALLET_ADDRESS } from '@/lib/constants';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { parseEther } from 'viem';
import { PulsatingButton } from './ui/pulsating-button';
import { useAccount, useSendTransaction, useSwitchChain } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
import { base } from 'wagmi/chains';

type Status =
  | 'idle'
  | 'checking'
  | 'sending'
  | 'waiting'
  | 'verifying'
  | 'success'
  | 'error';

export const Deposit = () => {
  const { authenticated, ready, user } = usePrivy();
  const [status, setStatus] = useState<Status>('idle');

  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    tokenTxHash?: string;
    depositTxHash?: string;
  } | null>(null);

  const {
    data: txHash,
    isPending,
    isSuccess,
    error,
    sendTransaction,
  } = useSendTransaction();
  const { chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const [isWrongChain, setIsWrongChain] = useState(false);

  useEffect(() => {
    console.log('chainId', chainId);
    if (chainId !== base.id) {
      setIsWrongChain(true);
      switchChain({ chainId: base.id });
    }
    if (chainId === base.id) {
      setIsWrongChain(false);
    }
  }, [chainId, switchChain]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isSuccess && txHash) {
      (async () => {
        console.log(
          'Transaction confirmed, waiting for API to index the transaction...'
        );
        setStatus('waiting');

        // Wait for the transaction to be indexed by the API
        let retries = 0;
        const maxRetries = 10; // Retry for up to 10 times
        const delay = 3000; // Wait 3 seconds between retries

        while (retries < maxRetries) {
          console.log(
            `Checking for transaction in API (Attempt ${retries + 1})...`
          );
          const userWallet = user?.wallet?.address;
          const updateResult = userWallet
            ? await updateUserDeposit(userWallet, txHash)
            : { success: false, message: 'No wallet connected' };

          if (updateResult.success) {
            console.log('Transaction found in API, updating user deposit...');
            setResult({
              success: true,
              message: 'Deposit successful!',
              tokenTxHash: updateResult.tokenTxHash,
              depositTxHash: txHash,
            });
            setStatus('success');
            return;
          }
          if (
            updateResult.message === 'No deposit transaction has been found'
          ) {
            console.log('Transaction not yet indexed, retrying...');
            retries++;
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            throw new Error(
              updateResult.message || 'Failed to verify transaction'
            );
          }
        }

        // If max retries reached, throw an error
        throw new Error(
          'Transaction not found in API after multiple retries. Please try again later.'
        );
      })().catch((error) => {
        console.error('Deposit update failed:', error);
        setResult({
          success: false,
          message: error.message || 'Failed to update deposit status',
        });
        setStatus('error');
      });
    }
  }, [isSuccess, txHash, user]);

  // Handle transaction errors
  useEffect(() => {
    if (error) {
      console.error('Transaction error:', error);
      setResult({
        success: false,
        message: error?.message || 'Transaction failed',
      });
      setStatus('error');
    }
  }, [error]);

  const handleDeposit = async () => {
    const amount = '.001'; // Hardcoded value of .001 ether

    if (isPending) return; // Don't allow multiple transactions

    setStatus('checking');
    setResult(null);
    setIsWrongChain(false);

    try {
      const userWallet = user?.wallet?.address;
      const isRegistered = userWallet
        ? await checkRegisteredUser(userWallet)
        : false;
      if (!isRegistered) {
        throw new Error('User is not verified. Please sign the message first.');
      }

      // Send transaction
      console.log('Sending transaction...');
      setStatus('sending');

      // Convert .001 ETH to wei
      const amountInWei = parseEther(amount);

      // Send the transaction
      sendTransaction({
        to: AGENT_WALLET_ADDRESS as `0x${string}`,
        value: amountInWei,
        chainId: base.id,
      });

      // The transaction has been sent but not confirmed yet
      // Transaction confirmation is handled in the useEffect hooks
    } catch (error) {
      console.error('Deposit process failed:', error);
      setResult({
        success: false,
        message:
          error instanceof Error ? error.message : 'Deposit process failed',
      });
      setStatus('error');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setResult(null);
  };

  return (
    <div className="w-full bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-lg">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold">2. Deposit .001 $ETH</h2>
        <p className="text-gray-400 text-sm">
          Deposit to submit prompts and be eligible for rewards.
        </p>
      </div>

      <div className="p-6 space-y-4">
        {(status === 'checking' ||
          status === 'sending' ||
          status === 'waiting' ||
          status === 'verifying' ||
          isPending) && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-yellow-400" />
            <p className="text-center font-medium text-gray-300">
              {status === 'checking' && 'Checking verification status...'}
              {status === 'sending' && 'Sending transaction...'}
              {status === 'waiting' &&
                'Waiting for transaction confirmation...'}
              {status === 'verifying' && 'Verifying deposit...'}
              {isPending && status === 'idle' && 'Transaction in progress...'}
              {isWrongChain && 'Switching to Base network...'}
            </p>
            {txHash && (status === 'waiting' || status === 'verifying') && (
              <p className="text-center text-sm text-gray-400">
                Transaction:{' '}
                <a
                  href={`https://base.blockscout.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-400 underline"
                >
                  {`${txHash.substring(0, 10)}...${txHash.substring(txHash.length - 6)}`}
                </a>
              </p>
            )}
          </div>
        )}

        {(status === 'success' || status === 'error') && result && (
          <div
            className={`mt-4 p-4 rounded-lg border ${
              status === 'success'
                ? 'bg-green-900/20 text-green-400 border-green-800'
                : 'bg-red-900/20 text-red-400 border-red-800'
            }`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                {status === 'success' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium">
                  {status === 'success' ? 'Success' : 'Error'}
                </h3>
                <p className="text-sm mt-1">{result.message}</p>
                {result.depositTxHash && (
                  <p className="text-sm mt-1">
                    $ETH deposit received on Base Mainnet:{' '}
                    <a
                      href={`https://base.blockscout.com/tx/${result.depositTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      {result.depositTxHash.substring(0, 10)}...
                    </a>
                  </p>
                )}
                {result.tokenTxHash && (
                  <p className="text-sm mt-1">
                    10,000 $MCRV tokens sent on Base Sepolia:{' '}
                    <a
                      href={`https://base-sepolia.blockscout.com/tx/${result.tokenTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      {result.tokenTxHash.substring(0, 10)}...
                    </a>
                  </p>
                )}
              </div>
            </div>
            {status === 'success' && (
              <a
                className="w-full flex justify-center items-center mt-4"
                href="https://t.me/midcurvelive"
                target="_blank"
                rel="noopener noreferrer"
              >
                <PulsatingButton className="text-black font-bold w-full md:w-1/3 hover:animate-pulse">
                  Submit a task
                </PulsatingButton>
              </a>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-800 flex justify-end gap-2">
        {status === 'idle' && (
          <button
            type="button"
            onClick={handleDeposit}
            className="px-6 py-3 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-black font-bold transition-colors cursor-pointer"
          >
            Deposit
          </button>
        )}

        {status === 'error' && (
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-3 rounded-lg transition-colors bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

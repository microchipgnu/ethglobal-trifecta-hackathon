'use client';

import { updateUserAction } from '@/app/actions';
import { usePrivy } from '@privy-io/react-auth';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export const RegisterTelegram = ({
  inviteCode,
}: {
  inviteCode: string;
}) => {
  const { authenticated, user, ready } = usePrivy();
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Check if the user is authenticated with Privy
  useEffect(() => {
    if (!ready || !authenticated || !user?.wallet?.address) return;

    // If user is authenticated and has a wallet, we can proceed
    const registerUser = async () => {
      try {
        setStatus('submitting');

        // Get the wallet address from Privy
        const walletAddress = user.wallet?.address;

        if (!walletAddress) {
          setStatus('error');
          setResult({
            success: false,
            message: 'Unable to get wallet address from Privy',
          });
          return;
        }

        // Submit the form data to the server
        const formData = new FormData();
        formData.set('inviteCode', inviteCode);
        formData.set('evmAddress', walletAddress);

        const result = await updateUserAction(formData);
        setResult(result);
        setStatus(result.success ? 'success' : 'error');
      } catch (error) {
        console.error('Error registering user:', error);
        setStatus('error');
        setResult({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Failed to link telegram account',
        });
      }
    };

    // Only automatically register if in idle state
    if (status === 'idle') {
      registerUser();
    }
  }, [authenticated, ready, user, inviteCode, status]);

  const handleReset = () => {
    setStatus('idle');
    setResult(null);
  };

  // If not authenticated, don't render anything - the connect button will be shown instead
  if (!authenticated || !user?.wallet?.address) {
    return null;
  }

  return (
    <div className="w-full bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-lg">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold">Register Telegram</h2>
        <p className="text-gray-400 text-sm">
          Link your wallet to your Telegram account
        </p>
      </div>

      <div className="p-6 space-y-4">
        {status === 'submitting' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-yellow-400" />
            <p className="text-center font-medium text-gray-300">
              Linking your wallet to Telegram...
            </p>
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
              </div>
            </div>
          </div>
        )}

        {user?.wallet?.address && status !== 'submitting' && (
          <div className="mt-4 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <p className="text-sm font-medium mb-1 text-gray-300">
              Wallet Address:
            </p>
            <p className="text-xs break-all font-mono text-yellow-400">
              {user.wallet.address}
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-800 flex justify-end gap-2">
        {(status === 'success' || status === 'error') && (
          <button
            type="button"
            onClick={handleReset}
            className={`px-6 py-3 rounded-lg transition-colors cursor-pointer ${
              status === 'success'
                ? 'border border-gray-700 bg-gray-800 hover:bg-gray-700 text-white'
                : 'bg-yellow-500 hover:bg-yellow-600 text-black font-bold'
            }`}
          >
            {status === 'success' ? 'Done' : 'Try Again'}
          </button>
        )}
      </div>
    </div>
  );
};

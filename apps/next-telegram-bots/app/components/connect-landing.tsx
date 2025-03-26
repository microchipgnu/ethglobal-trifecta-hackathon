'use client';

import { checkDepositStatus, checkSiweStatus } from '@/app/actions';
import { ConnectButton } from '@/app/components/connect-button';
import { Deposit } from '@/app/components/deposit';
import { RegisterTelegram } from '@/app/components/sign-message';
import { PulsatingButton } from '@/app/components/ui/pulsating-button';
import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

export const ConnectLanding = ({ id }: { id: string }) => {
  const { authenticated, user, ready } = usePrivy();
  const { isConnected } = useAccount();
  const [isWalletLinked, setIsWalletLinked] = useState<boolean | null>(null);
  const [isWalletDeposit, setIsWalletDeposit] = useState<boolean | null>(null);

  // Get wallet address from Privy
  const walletAddress = user?.wallet?.address;

  useEffect(() => {
    const checkWalletSiweStatus = async () => {
      if (walletAddress) {
        const siweStatus = await checkSiweStatus(walletAddress);
        console.log('siweStatus', siweStatus);
        setIsWalletLinked(siweStatus);
      } else {
        setIsWalletLinked(false);
      }
    };

    if (authenticated && ready) {
      checkWalletSiweStatus();
    }
  }, [walletAddress, authenticated, ready]);

  useEffect(() => {
    const checkWalletDepositStatus = async () => {
      if (walletAddress) {
        const depositStatus = await checkDepositStatus(walletAddress);
        console.log('depositStatus', depositStatus);
        setIsWalletDeposit(depositStatus);
      } else {
        setIsWalletDeposit(false);
      }
    };

    if (authenticated && ready && isWalletLinked) {
      checkWalletDepositStatus();
    }
  }, [walletAddress, authenticated, ready, isWalletLinked]);

  return (
    <main
      className="min-h-screen text-white"
      style={{
        background: 'linear-gradient(to bottom, #0E0F15, #0A1A2E)',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: 'cover',
      }}
    >
      <div className="flex flex-col w-full md:w-7/8 min-h-screen mx-auto p-2 justify-between items-center space-y-8">
        <div className="pt-6 md:pt-12">
          <img
            src="/midcurve-diagram-banner-wide.png"
            alt="Midcurve.live"
            className="h-16 md:h-32 w-auto"
          />
        </div>

        <div className="bg-slate-800/70 rounded-xl border border-gray-800 overflow-hidden shadow-lg">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-2xl font-bold">Connect</h2>
            <p className="text-gray-400 mt-1">
              Link your Base Wallet to your Telegram account and deposit .001
              $ETH to participate in the Midcurve.live community
            </p>
          </div>
          <div className="p-6 space-y-4">
            {/* Only show connect button if not authenticated */}
            {!authenticated && (
              <div className="flex justify-center mb-6 min-h-[40.8px]">
                <ConnectButton />
              </div>
            )}

            {/* Show RegisterTelegram component if authenticated but wallet not linked */}
            {id && authenticated && isWalletLinked === false && (
              <RegisterTelegram inviteCode={id} />
            )}

            {/* Show success message if wallet is linked */}
            {id && authenticated && isWalletLinked === true && (
              <div className="text-center bg-green-900/30 text-green-400 p-4 rounded-lg border border-green-800">
                <p>
                  Connected wallet has already been successfully linked to your
                  Telegram account
                </p>
              </div>
            )}

            {id &&
            authenticated &&
            isWalletLinked === true &&
            isWalletDeposit === true ? (
              <div className="flex flex-col gap-3">
                <div className="text-center bg-green-900/30 text-green-400 p-4 rounded-lg border border-green-800">
                  <p>
                    Connected wallet has already made a successful deposit of
                    min. .001 $ETH, feel free to deposit more!
                  </p>
                </div>

                <a
                  className="w-full flex justify-center items-center"
                  href="https://t.me/midcurvelive"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <PulsatingButton className="text-black font-bold w-full md:w-1/3 hover:animate-pulse">
                    Join the Midcurve Chat
                  </PulsatingButton>
                </a>
              </div>
            ) : isConnected ? (
              <Deposit />
            ) : null}
          </div>
        </div>

        <div className="w-full p-5 gap-5 flex flex-col md:flex-row justify-between items-center transition-transform duration-1000 animate__fadeInUp space-y-8 md:space-y-0">
          <div className="flex space-x-4">
            <a
              href="https://x.com/microchipgnu"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/x-logo.png"
                alt="X"
                className="h-6 w-6 transition-transform duration-200 hover:scale-110"
              />
            </a>
            <a
              href="https://t.me/midcurvelive"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/tg-logo.png"
                alt="Telegram"
                className="h-6 w-6 transition-transform duration-200 hover:scale-110"
              />
            </a>
          </div>

          <div className="flex space-x-4">
            <img src="/base-logo.png" alt="Logo 1" className="h-7 w-auto" />
          </div>
        </div>
      </div>
    </main>
  );
};

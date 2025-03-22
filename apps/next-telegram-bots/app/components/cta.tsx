'use client';

import { Card } from '@/app/components/ui/card';
import React from 'react';
import { PulsatingButton } from '@/app/components/ui/pulsating-button';

const CTA: React.FC = () => {
  return (
    <Card className="w-full relative p-6 backdrop-blur-sm bg-card/75 border border-muted/30">
      <div className="flex flex-col h-full items-center justify-center space-y-4">
        <h1 className="text-center text-xl md:text-3xl tracking-wider sm:text-2xl xl:text-2xl">
          Midcurve.live 24/7 Livestreamed AI Agent <span className="text-[#FFDB00]">$MCRV</span>
        </h1>
        <PulsatingButton className="text-black font-bold w-full md:w-1/3 hover:animate-pulse">
          START
        </PulsatingButton>
        <p className="text-xs text-center text-muted-foreground mt-auto">
          by participating in the Midcurve.live Telegram Bots Contest, you will
          have to link your telegram account and base wallet.
        </p>
      </div>
    </Card>
  );
};

export default CTA;

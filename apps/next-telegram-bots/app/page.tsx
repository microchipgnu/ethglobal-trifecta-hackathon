import type { Metadata } from 'next';
import { Hero } from './components/hero';
import { HowToParticipate } from './components/how-to-participate';
import { StreamPlayer } from './components/stream-player';

export const metadata: Metadata = {
  title: 'Midcurve.live',
  description: 'Midcurve.live Telegram Bots',
};

export default function Page() {
  return (
    <main
      className="min-h-screen text-white"
      style={{
        background: 'linear-gradient(to bottom, #1E2030, #2A3A5E)',
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

        {/* Main Stream Player Section */}
        <div className="w-full max-w-4xl">
          <StreamPlayer />
        </div>

        <Hero />
        <HowToParticipate />

        <div className="w-full p-5 gap-5 flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0">
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
}

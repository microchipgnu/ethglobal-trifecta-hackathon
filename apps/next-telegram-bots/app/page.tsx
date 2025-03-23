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
      <div className="flex flex-col w-full min-h-screen">
        {/* Header with small banner in top left */}
        <div className="w-full p-4">
          <img
            src="/midcurve-diagram-banner-wide.png"
            alt="Midcurve.live"
            className="h-10 w-auto"
          />
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col md:flex-row flex-1 p-2 gap-4">
          {/* Stream Player taking most of the screen */}
          <div className="flex-1 md:w-3/4">
            <StreamPlayer />
          </div>

          {/* Side Content */}
          <div className="md:w-1/4 flex flex-col gap-4">
            <Hero />
            <HowToParticipate />
          </div>
        </div>

        {/* Footer */}
        <div className="w-full p-4 flex justify-between items-center">
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

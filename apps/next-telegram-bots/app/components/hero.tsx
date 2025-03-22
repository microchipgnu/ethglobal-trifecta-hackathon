import { PulsatingButton } from '@/app/components/ui/pulsating-button';

export const Hero = () => {
  return (
    <div className="w-full relative flex flex-col items-center justify-between space-y-4 backdrop-blur-sm bg-card/75 border border-muted/30 p-5 rounded-lg">
      <div className="w-full space-y-2">
        <h1 className="font-bold text-center text-lg md:text-center md:text-lg tracking-wider sm:text-xl xl:text-4xl/none animate-fade-in">
          Midcurve.live
        </h1>
      </div>

      <div className="space-y-2">
        <p className="flex flex-col md:flex-row text-center text-xs md:text-center md:text-sm animate-fade-in delay-200">
          <span>
            The first 24/7 livestreamed AI Agent researching crypto, trading
            coins, and engaging with the community in real-time
          </span>
        </p>
      </div>

      <div className="space-y-2">
        <p className="flex flex-row text-xs text-center md:text-lg animate-fade-in delay-100">
          <span>
            Like Twitch Plays but for DeFi -
            <span className="text-[#FED100] font-bold">
              {' '}
              Watch, Interact, Profit
            </span>
          </span>
        </p>
      </div>

      <a
        className="w-full flex justify-center items-center"
        href="https://t.me/midcurvelive"
        target="_blank"
        rel="noopener noreferrer"
      >
        <PulsatingButton className="text-black font-bold w-full md:w-1/3 hover:animate-pulse">
          START
        </PulsatingButton>
      </a>
    </div>
  );
};

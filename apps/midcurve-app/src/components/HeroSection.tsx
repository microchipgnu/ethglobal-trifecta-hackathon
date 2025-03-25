import { Button } from '@/components/ui/button';
import { ArrowDown, MessageSquare } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player/lazy';
import GlowEffect from './GlowEffect';
import LiveBadge from './LiveBadge';
import SponsorDock from './SponsorDock';
const HeroSection = () => {
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const playerRef = useRef<ReactPlayer>(null);
  const streamUrl = 'http://localhost:8081'; // Example HLS stream URL

  // Handle spacebar to control play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault(); // Prevent default space behavior (scrolling)

        if (playerRef.current) {
          // Toggle play/pause state
          const player = playerRef.current.getInternalPlayer();
          if (player) {
            if (player.paused) {
              player.play();
            } else {
              player.pause();
            }
          }
        }
      } else if (e.code === 'KeyP') {
        e.preventDefault();
        togglePictureInPicture();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const togglePictureInPicture = () => {
    if (playerRef.current?.getInternalPlayer()) {
      if (isPipActive) {
        document.exitPictureInPicture().catch(console.error);
      } else if (playerRef.current) {
        const player = playerRef.current.getInternalPlayer();
        if (player && document.pictureInPictureEnabled) {
          player.requestPictureInPicture().catch(console.error);
        }
      }
    }
  };
  return (
    <section
      id="livestream"
      className="min-h-screen pt-28 xl:pt-36 pb-16 px-4 relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="h-full w-full bg-grid-pattern opacity-10" />
      </div>

      <div className="container mx-auto max-w-6xl xl:max-w-screen-2xl max-sm:-my-[20px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 md:gap-8 lg:gap-12 items-center">
          {/* Text content - Top left */}
          <div className="lg:col-span-5 xl:col-span-4 lg:col-start-1 order-1 lg:order-1 flex flex-col justify-center lg:self-start">
            <div className="text-left mb-8">
              <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-base-dark-3/80 border border-white/5 mb-4 animate-fade-in">
                <LiveBadge pulseSize="lg" />
                <span className="text-sm text-white/70 font-mono">
                  Agent Streaming 24/7
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-5xl font-bold leading-tight mb-4 animate-fade-in font-mono">
                <span className="text-gradient">Midcurve AI</span>
                <br />
                <span className="text-gradient-blue">Onchain 24/7</span>
              </h1>

              <p className="text-lg text-white/70 mb-8 animate-fade-in-delayed font-mono border-l-2 border-primary/50 pl-4">
                Midcurve AI is driven by the community's combined insights,
                drawing from all sides of the curve.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-4 animate-fade-in-delayed">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary hover:bg-primary/90 font-medium font-mono group relative overflow-hidden"
                >
                  <a
                    href="https://t.me/midcurvelive"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <span className="relative z-10">Join Telegram</span>
                    <MessageSquare className="h-4 w-4 relative z-10" />
                    <span className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-primary/30 hover:bg-primary/10 font-mono"
                >
                  <a href="#features" className="flex items-center gap-2">
                    Learn More <ArrowDown className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Sponsor Dock positioned below the buttons */}
            <SponsorDock className="max-sm:hidden" />
          </div>

          {/* Stream - Bottom right, staggered lower */}
          <div className="lg:col-span-7 xl:col-span-8 lg:col-start-6 order-2 lg:order-2 lg:self-end md:mt-4 lg:mt-8 xl:mt-2">
            <div className="relative mx-0">
              <GlowEffect
                className="w-full mx-auto rounded-xl overflow-hidden animate-scale-up"
                color="from-primary/30 to-purple-500/30"
                size="lg"
              >
                <div className="player-wrapper backdrop-blur rounded-xl overflow-hidden relative aspect-video border-2 border-dashed border-primary/30">
                  <div
                    className={`absolute inset-0 flex items-center justify-center z-10 bg-base-dark-1/80 backdrop-blur-sm transition-opacity duration-700 ${isPlayerReady ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                  >
                    <div className="text-center px-4">
                      <LiveBadge className="mx-auto mb-4" pulseSize="lg" />
                      <h3 className="text-xl md:text-2xl font-medium mb-2 font-mono">
                        Loading AI Trading Stream
                      </h3>
                      <p className="text-white/60 max-w-md mx-auto font-mono">
                        Connecting to the 24/7 livestream of our AI agent making
                        onchain trades...
                      </p>
                    </div>
                  </div>
                  {typeof window !== 'undefined' && (
                    <ReactPlayer
                      ref={playerRef}
                      url={streamUrl}
                      className="react-player"
                      width="100%"
                      height="100%"
                      playing={true}
                      muted={false}
                      controls={true}
                      pip={true}
                      onReady={() => setIsPlayerReady(true)}
                      onEnablePIP={() => setIsPipActive(true)}
                      onDisablePIP={() => setIsPipActive(false)}
                      config={{
                        file: {
                          forceHLS: true,
                        },
                      }}
                    />
                  )}
                </div>
              </GlowEffect>

              <div className="mt-4 bg-base-dark-2/50 p-3 rounded-lg border border-dashed border-primary/20 font-mono text-center text-sm text-white/60">
                <span className="text-primary">Pro tip:</span> Press{' '}
                <kbd className="px-2 py-1 bg-base-dark-3 rounded text-xs mx-1">
                  P
                </kbd>{' '}
                for PIP mode to watch across browser tabs!
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce max-sm:hidden">
        <ArrowDown className="h-6 w-6 text-white/50" />
      </div>
    </section>
  );
};
export default HeroSection;

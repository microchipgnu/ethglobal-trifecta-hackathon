import { ExternalLink, Github } from 'lucide-react';
import React from 'react';

const Footer = () => {
  return (
    <footer className="py-10 px-4 bg-base-dark-1/80 backdrop-blur-md border-t border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="h-full w-full bg-grid-pattern opacity-10"></div>
      </div>

      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <a
              href="/"
              className="text-xl font-bold text-white flex items-center gap-1 hover:scale-110 transition-transform"
            >
              <span className="text-gradient-blue font-mono">midcurve</span>
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-md animate-pulse">
                .live
              </span>
            </a>
            <p className="text-white/50 text-sm mt-2 font-mono italic">
              "24/7 Livestreamed AI Trading with Community Governance" 🤖
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end">
            <div className="flex gap-4 mb-4">
              <a
                href="https://github.com/midcurve"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors transform hover:rotate-6"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://x.com/midcurve"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors transform hover:-rotate-6"
              >
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
                  <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
                </svg>
              </a>
              <a
                href="https://t.me/midcurvelive"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors transform hover:rotate-6"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            </div>
            <p className="text-white/50 text-sm font-mono">
              ETHGlobal Trifecta Hackathon Project — March 2024
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-white/40 text-xs font-mono">
            &copy; {new Date().getFullYear()} Midcurve.live — Built on Base
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

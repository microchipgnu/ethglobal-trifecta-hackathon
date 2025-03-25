import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuIcon, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md',
        isScrolled ? 'bg-background/95 shadow-md py-3' : 'bg-transparent py-5'
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center">
          <a
            href="/"
            className="text-xl font-bold text-white flex items-center gap-1"
          >
            <span className="text-gradient-blue font-mono">midcurve</span>
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-md">
              .live
            </span>
          </a>
        </div>

        <nav className="hidden md:flex space-x-8 items-center">
          <a
            href="#features"
            className="text-sm text-muted-foreground hover:text-white transition-colors"
          >
            Features
          </a>
          <a
            href="#token"
            className="text-sm text-muted-foreground hover:text-white transition-colors"
          >
            $MCRV
          </a>
          <a
            href="#team"
            className="text-sm text-muted-foreground hover:text-white transition-colors"
          >
            Team
          </a>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/10 hover:text-white"
          >
            <a
              href="https://t.me/midcurvelive"
              target="_blank"
              rel="noopener noreferrer"
            >
              Join Community
            </a>
          </Button>
          <Button asChild size="sm" className="bg-primary hover:bg-primary/90">
            <a href="#livestream">Watch Livestream</a>
          </Button>
        </nav>

        <Button
          variant="ghost"
          className="p-1 md:hidden z-50"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MenuIcon className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed h-screen inset-0 z-40 bg-background/95 backdrop-blur-lg pt-20 animate-fade-in">
          <nav className="flex flex-col space-y-6 items-center pt-10 px-4">
            <a
              href="#features"
              className="text-lg text-muted-foreground hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#token"
              className="text-lg text-muted-foreground hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              $MCRV
            </a>
            <a
              href="#team"
              className="text-lg text-muted-foreground hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Team
            </a>
            <Button
              asChild
              variant="outline"
              className="w-full mt-6 border-primary/30 text-primary hover:bg-primary/10 hover:text-white"
            >
              <a
                href="https://t.me/midcurvelive"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Join Community
              </a>
            </Button>
            <Button asChild className="w-full bg-primary hover:bg-primary/90">
              <a href="#livestream" onClick={() => setIsMobileMenuOpen(false)}>
                Watch Livestream
              </a>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;

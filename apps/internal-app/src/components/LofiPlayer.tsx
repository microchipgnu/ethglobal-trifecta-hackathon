import React, { useState, useEffect, useRef } from 'react';

function LofiPlayer() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [volume, setVolume] = useState(0.1);
  const [autoSwitch, setAutoSwitch] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement>(null);
  const silenceTimeoutRef = useRef<number | null>(null);
  const errorTimeoutRef = useRef<number | null>(null);
  const stalledTimeoutRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const isPlayingAudioRef = useRef<boolean>(false);
  
  // Free lofi tracks from various sources (updated with more reliable streams)
  const lofiTracks = [
    {
      name: "LoFi Radio",
      url: "https://play.streamafrica.net/lofiradio"
    },
    {
      name: "Chillhop",
      url: "https://streams.fluxfm.de/chillhop/mp3-320/streams.fluxfm.de/"
    },
    {
      name: "Box Lofi",
      url: "https://boxradio-edge-08.streamafrica.net/lofi"
    },
    {
      name: "Synthwave",
      url: "https://stream.nightride.fm/nightride.m4a"
    },
    {
      name: "Coffee Shop",
      url: "https://streams.fluxfm.de/Chillout/mp3-320/streams.fluxfm.de/"
    }
  ];

  // Find next available track that hasn't failed recently
  const findNextTrack = () => {
    if (failedAttempts.size >= lofiTracks.length) {
      // All tracks have failed, reset failed attempts and try again
      setFailedAttempts(new Set());
      return (currentTrack + 1) % lofiTracks.length;
    }
    
    let nextTrack = currentTrack;
    do {
      nextTrack = (nextTrack + 1) % lofiTracks.length;
    } while (failedAttempts.has(nextTrack) && nextTrack !== currentTrack);
    
    return nextTrack;
  };

  // Switch to next track
  const handleNextTrack = () => {
    // Only switch tracks if we're not in the initialization phase
    if (!isInitializing) {
      // Clean up before track switch
      cleanupAudioContext();
      if (silenceTimeoutRef.current) {
        window.clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      
      // Mark current track as failed
      const newFailedAttempts = new Set(failedAttempts);
      newFailedAttempts.add(currentTrack);
      setFailedAttempts(newFailedAttempts);
      
      setIsInitializing(true);
      const nextTrack = findNextTrack();
      setCurrentTrack(nextTrack);
      
      console.log(`Switching to track: ${lofiTracks[nextTrack].name}`);
    }
  };

  // Handle play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying && hasInteracted) {
        setIsInitializing(true);
        
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Error playing audio:", error);
            setIsPlaying(false);
            
            // If we get a specific error that suggests stream is invalid, switch tracks
            if (error.name === 'NotSupportedError' || error.name === 'NotAllowedError') {
              console.log("Stream not supported or allowed, switching tracks...");
              handleNextTrack();
            }
          }).finally(() => {
            setTimeout(() => setIsInitializing(false), 3000);
          });
        } else {
          // For browsers that don't return a promise
          setTimeout(() => setIsInitializing(false), 3000);
        }
      } else {
        audioRef.current.pause();
        isPlayingAudioRef.current = false;
      }
    }
  }, [isPlaying, currentTrack, hasInteracted]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Auto-switch tracks every 20 minutes
  useEffect(() => {
    let switchInterval: number;
    
    if (autoSwitch && isPlaying && hasInteracted) {
      switchInterval = window.setInterval(() => {
        if (isPlayingAudioRef.current) {
          // Only auto-switch if we're actually playing audio
          const nextTrack = findNextTrack();
          setCurrentTrack(nextTrack);
        }
      }, 1200000); // 20 minutes = 1,200,000 milliseconds
    }
    
    return () => {
      if (switchInterval) window.clearInterval(switchInterval);
    };
  }, [autoSwitch, isPlaying, hasInteracted, lofiTracks.length, failedAttempts]);

  // Cleanup audio context resources
  const cleanupAudioContext = () => {
    try {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      
      // Close and cleanup audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch (err) {
          console.error("Error closing audio context:", err);
        }
      }
      
      audioContextRef.current = null;
      audioAnalyserRef.current = null;
    } catch (err) {
      console.error("Error in cleanup:", err);
    }
  };

  // Error handling and audio detection
  useEffect(() => {
    if (!audioRef.current || !hasInteracted) return;
    
    const audio = audioRef.current;
    
    // Handle stream loading errors
    const handleError = (e: Event) => {
      console.error("Stream error detected, switching tracks", e);
      
      // Clear any existing timeout
      if (errorTimeoutRef.current) window.clearTimeout(errorTimeoutRef.current);
      
      // Set a small delay before switching to next track
      errorTimeoutRef.current = window.setTimeout(() => {
        isPlayingAudioRef.current = false;
        handleNextTrack();
      }, 2000);
    };
    
    // Handle stalled stream (when playback stops unexpectedly)
    const handleStalled = () => {
      // Don't handle stalls during initialization
      if (isInitializing) return;
      
      console.log("Stream stalled, preparing to switch tracks");
      
      // Clear any existing stalled timeout
      if (stalledTimeoutRef.current) window.clearTimeout(stalledTimeoutRef.current);
      
      // Give it a moment to recover before switching tracks
      stalledTimeoutRef.current = window.setTimeout(() => {
        console.log("Stream stall persisted, switching to next track");
        isPlayingAudioRef.current = false;
        handleNextTrack();
      }, 5000); // Wait 5 seconds to see if it recovers
    };
    
    // Combined handler for playing event - handles both resumption and silence detection
    const handlePlaying = () => {
      console.log("Stream playing event triggered");
      isPlayingAudioRef.current = true;
      
      // Handle resumed playback - cancel stalled switch
      if (stalledTimeoutRef.current) {
        console.log("Stream resumed playback, cancelling track switch");
        window.clearTimeout(stalledTimeoutRef.current);
        stalledTimeoutRef.current = null;
      }
      
      // Clear initialization state
      setIsInitializing(false);
      
      // Reset failed attempts for this track since it's now playing
      if (failedAttempts.has(currentTrack)) {
        const newFailedAttempts = new Set(failedAttempts);
        newFailedAttempts.delete(currentTrack);
        setFailedAttempts(newFailedAttempts);
      }
      
      // Start silence detection, but only after a delay to give the stream time to stabilize
      if (silenceTimeoutRef.current) {
        window.clearTimeout(silenceTimeoutRef.current);
      }
      
      silenceTimeoutRef.current = window.setTimeout(() => {
        startSilenceDetection();
      }, 5000);
    };

    // Track ended handler
    const handleEnded = () => {
      console.log("Track ended, switching to next track");
      isPlayingAudioRef.current = false;
      handleNextTrack();
    };
    
    // Monitor for silence/no audio
    const startSilenceDetection = () => {
      // Don't start silence detection during initialization or if a previous detection is in progress
      if (isInitializing || audioContextRef.current !== null) return;
      
      try {
        if (!audioRef.current) return;
        
        console.log("Starting silence detection");
        
        // Create new audio context for analyzing audio
        try {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioAnalyserRef.current = audioContextRef.current.createAnalyser();
          const source = audioContextRef.current.createMediaElementSource(audioRef.current);
          
          source.connect(audioAnalyserRef.current);
          audioAnalyserRef.current.connect(audioContextRef.current.destination);
          
          audioAnalyserRef.current.fftSize = 256;
          const bufferLength = audioAnalyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          
          // Check for audio data
          let silenceCounter = 0;
          const MAX_SILENCE_COUNT = 10; // Increase the threshold to reduce false positives
          
          const checkAudio = () => {
            if (!audioRef.current || !isPlaying || !audioAnalyserRef.current) return;
            
            try {
              audioAnalyserRef.current.getByteFrequencyData(dataArray);
              
              // Calculate average volume
              let sum = 0;
              for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
              }
              const average = sum / bufferLength;
              
              // If average is very low, consider it silence
              if (average < 3) { // Lower threshold to be more conservative
                silenceCounter++;
                if (silenceCounter >= MAX_SILENCE_COUNT && !isInitializing) {
                  console.log("Audio silence detected, switching tracks");
                  isPlayingAudioRef.current = false;
                  handleNextTrack();
                  return; // Exit the animation frame loop
                }
              } else {
                silenceCounter = 0; // Reset counter if we detect audio
              }
              
              // Schedule next check
              rafIdRef.current = requestAnimationFrame(checkAudio);
            } catch (err) {
              console.error("Error in audio analysis loop:", err);
              cleanupAudioContext();
            }
          };
          
          // Start the animation frame loop
          rafIdRef.current = requestAnimationFrame(checkAudio);
        } catch (err) {
          console.error("Error setting up Web Audio API (may be unsupported):", err);
          // If Web Audio API fails, set up a simpler fallback detection
          setupFallbackSilenceDetection();
        }
      } catch (err) {
        console.error("Error setting up audio analysis:", err);
        cleanupAudioContext(); // Clean up if we hit an error
        setupFallbackSilenceDetection();
      }
    };
    
    // Fallback silence detection using simpler methods
    const setupFallbackSilenceDetection = () => {
      console.log("Using fallback silence detection");
      const checkInterval = window.setInterval(() => {
        if (!audioRef.current || !isPlaying) {
          window.clearInterval(checkInterval);
          return;
        }
        
        // Check if currentTime is advancing
        const currentTime = audioRef.current.currentTime;
        
        window.setTimeout(() => {
          if (audioRef.current && Math.abs(audioRef.current.currentTime - currentTime) < 0.1) {
            console.log("Audio appears to be stalled (currentTime not advancing)");
            handleNextTrack();
          }
        }, 3000);
      }, 10000); // Check every 10 seconds
      
      // Clean up interval on component unmount
      return () => window.clearInterval(checkInterval);
    };
    
    // Setup event listeners
    audio.addEventListener('error', handleError);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('stalled', handleStalled);
    audio.addEventListener('waiting', handleStalled);
    audio.addEventListener('suspend', handleStalled);
    audio.addEventListener('ended', handleEnded);
    
    // Add a canplay handler to make sure we're actually getting data
    const handleCanPlay = () => {
      console.log("Stream can play now");
    };
    audio.addEventListener('canplay', handleCanPlay);
    
    return () => {
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('stalled', handleStalled);
      audio.removeEventListener('waiting', handleStalled);
      audio.removeEventListener('suspend', handleStalled);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      
      // Clear all timeouts
      if (silenceTimeoutRef.current) window.clearTimeout(silenceTimeoutRef.current);
      if (errorTimeoutRef.current) window.clearTimeout(errorTimeoutRef.current);
      if (stalledTimeoutRef.current) window.clearTimeout(stalledTimeoutRef.current);
      
      // Clean up audio context
      cleanupAudioContext();
    };
  }, [currentTrack, isPlaying, hasInteracted, isInitializing, failedAttempts]);

  // Animation effect for visualizer
  useEffect(() => {
    let animationInterval: number;
    
    if (isPlaying) {
      animationInterval = window.setInterval(() => {
        setIsAnimating(prev => !prev);
      }, 1000);
    }
    
    return () => {
      if (animationInterval) window.clearInterval(animationInterval);
    };
  }, [isPlaying]);

  // Auto-play setup - try to play as soon as possible
  useEffect(() => {
    const attemptAutoplay = async () => {
      if (audioRef.current && !hasInteracted) {
        try {
          // Try to play automatically (may fail due to browser restrictions)
          await audioRef.current.play();
          setHasInteracted(true);
        } catch (error) {
          // If autoplay fails, we'll wait for user interaction
          console.log("Autoplay prevented by browser, waiting for user interaction");
        }
      }
    };
    
    attemptAutoplay();
    
    const handleAnyInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        // Try to play on first interaction
        if (audioRef.current) {
          audioRef.current.play().catch(e => {
            console.error("Error playing on interaction:", e);
            // Try a different track if this one fails on interaction
            handleNextTrack();
          });
        }
      }
      
      // Remove listeners after first interaction
      document.removeEventListener('click', handleAnyInteraction);
      document.removeEventListener('keydown', handleAnyInteraction);
      document.removeEventListener('touchstart', handleAnyInteraction);
    };

    document.addEventListener('click', handleAnyInteraction);
    document.addEventListener('keydown', handleAnyInteraction);
    document.addEventListener('touchstart', handleAnyInteraction);

    return () => {
      document.removeEventListener('click', handleAnyInteraction);
      document.removeEventListener('keydown', handleAnyInteraction);
      document.removeEventListener('touchstart', handleAnyInteraction);
    };
  }, [hasInteracted]);

  // Reload track if it's been silent for too long
  useEffect(() => {
    const checkInterval = window.setInterval(() => {
      if (audioRef.current && isPlaying && hasInteracted && !isInitializing) {
        if (!isPlayingAudioRef.current) {
          console.log("Player seems stuck in non-playing state, reloading current track");
          // Force reload the audio element
          const currentSrc = audioRef.current.src;
          audioRef.current.src = '';
          
          // Small delay before setting source again
          window.setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.src = currentSrc;
              audioRef.current.load();
              audioRef.current.play().catch(e => {
                console.error("Error reloading track:", e);
                handleNextTrack();
              });
            }
          }, 500);
        }
      }
    }, 30000); // Check every 30 seconds
    
    return () => window.clearInterval(checkInterval);
  }, [isPlaying, hasInteracted, isInitializing]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Final cleanup of audio context when component unmounts
      cleanupAudioContext();
    };
  }, []);

  // Manual track change function
  const changeTrack = () => {
    // Manually trigger track change
    handleNextTrack();
  };

  return (
    <div 
      className="overlay-element lofi-player max-w-24" 
      onClick={hasInteracted ? () => {
        // If already interacted, toggle play/pause
        setIsPlaying(!isPlaying);
      } : () => {
        setHasInteracted(true);
        setIsPlaying(true);
      }}
    >
      <div className="flex flex-col p-3 h-full justify-center items-center">        
        {/* Track name */}
        <div className="text-center mb-3">
          <span className="text-sm text-white cursor-pointer" onClick={(e) => {
            e.stopPropagation(); // Prevent parent click handler
            changeTrack();
          }}>{lofiTracks[currentTrack].name}</span>
          <div className="mt-1 w-24 mx-auto">
            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-400 transition-all duration-300"
                style={{ 
                  width: `${volume * 100}%`,
                  boxShadow: '0 0 3px var(--neon-purple, #b19cd9)'
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Simple audio visualizer animation */}
        <div className="flex items-end justify-center space-x-1 h-6 mb-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-purple-400 transition-all duration-300"
              style={{
                height: isPlaying ? `${Math.random() * 20 + 5}px` : '3px',
                opacity: isPlaying ? 0.8 : 0.4,
                boxShadow: isPlaying ? '0 0 5px var(--neon-purple, #b19cd9)' : 'none',
                transform: isAnimating && isPlaying ? `scaleY(${1 + Math.random() * 0.5})` : 'scaleY(1)',
              }}
            />
          ))}
        </div>
      </div>
      
      <audio
        ref={audioRef}
        src={lofiTracks[currentTrack].url}
        loop={false}
        autoPlay={isPlaying && hasInteracted}
        muted={false}
        crossOrigin="anonymous"
        preload="auto"
      />
    </div>
  );
}

export default LofiPlayer;
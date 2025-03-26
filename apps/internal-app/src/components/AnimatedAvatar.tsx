import React, { useState, useEffect } from 'react';

function AnimatedAvatar() {
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [blinking, setBlinking] = useState(false);
  const [mood, setMood] = useState<
    'simple' | 'genius' | 'hooded' | 'glitched'
  >('genius');
  const [glitchEffect, setGlitchEffect] = useState(false);
  const [haloColor, setHaloColor] = useState('var(--neon-cyan)');

  useEffect(() => {
    // Look in random directions
    const lookInterval = setInterval(() => {
      setEyePosition({
        x: Math.random() * 6 - 3,
        y: Math.random() * 6 - 3,
      });
    }, 2000);

    // Blink occasionally
    const blinkInterval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 200);
    }, 5000);

    // Change mood and halo occasionally
    const moodInterval = setInterval(() => {
      const moods: Array<'simple' | 'genius' | 'hooded' | 'glitched'> = [
        'simple',
        'genius',
        'hooded',
        'glitched',
      ];
      const newMood = moods[Math.floor(Math.random() * moods.length)];
      setMood(newMood);

      // Change halo color based on mood
      let color = 'var(--neon-cyan)';
      if (newMood === 'simple') {
        color = 'var(--neon-yellow)';
      } else if (newMood === 'genius') {
        color = 'var(--neon-cyan)';
      } else if (newMood === 'hooded') {
        color = 'var(--neon-purple)';
      } else {
        color = 'var(--neon-pink)';
      }
      setHaloColor(color);
    }, 8000);

    // Create occasional glitch effect
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setGlitchEffect(true);
        setTimeout(() => setGlitchEffect(false), 300);
      }
    }, 2000);

    return () => {
      clearInterval(lookInterval);
      clearInterval(blinkInterval);
      clearInterval(moodInterval);
      clearInterval(glitchInterval);
    };
  }, []);

  // Render face based on mood
  const renderFace = () => {
    switch (mood) {
      case 'simple':
        return (
          <>
            <div className="flex justify-around w-16 mb-4 z-10">
              {/* Simplified eyes */}
              <div 
                className={`w-4 h-4 rounded-full flex justify-center items-center duration-200 ${blinking ? 'h-0.5' : ''}`}
                style={{
                  background: 'white',
                  transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`,
                  boxShadow: `0 0 10px ${haloColor}`,
                }}
              >
                <div className="w-2 h-2 bg-gray-900 rounded-full" />
              </div>
              <div 
                className={`w-4 h-4 rounded-full flex justify-center items-center duration-200 ${blinking ? 'h-0.5' : ''}`}
                style={{
                  background: 'white',
                  transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`,
                  boxShadow: `0 0 10px ${haloColor}`,
                }}
              >
                <div className="w-2 h-2 bg-gray-900 rounded-full" />
              </div>
            </div>
            <div className="mt-2 flex justify-center items-center h-8 z-10">
              <svg
                width="20"
                height="8"
                viewBox="0 0 20 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Simple Smile</title>
                <path
                  d="M1 1C1 1 5 7 10 7C15 7 19 1 19 1"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </>
        );
      case 'genius':
        return (
          <>
            {/* Glasses frame */}
            <div className="absolute z-5" style={{ top: '40%', transform: 'translateY(-50%)' }}>
              <div className="w-20 h-6 border-2 border-white rounded-lg flex items-center justify-center opacity-60" />
            </div>
            <div className="flex justify-around w-18 mb-4 z-10">
              {/* Eyes with glasses */}
              <div 
                className={`w-5 h-5 rounded-full flex justify-center items-center duration-200 ${blinking ? 'h-0.5' : ''}`}
                style={{
                  background: 'white',
                  transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`,
                  boxShadow: `0 0 10px ${haloColor}`,
                }}
              >
                <div className="w-2.5 h-2.5 bg-gray-900 rounded-full" />
              </div>
              <div 
                className={`w-5 h-5 rounded-full flex justify-center items-center duration-200 ${blinking ? 'h-0.5' : ''}`}
                style={{
                  background: 'white',
                  transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`,
                  boxShadow: `0 0 10px ${haloColor}`,
                }}
              >
                <div className="w-2.5 h-2.5 bg-gray-900 rounded-full" />
              </div>
            </div>
            {/* Hair tuft */}
            <div className="absolute" style={{ top: '10%', right: '40%' }}>
              <div className="w-8 h-4 bg-white opacity-70" 
                style={{ 
                  clipPath: 'polygon(0 100%, 50% 0, 100% 100%)',
                  transform: 'rotate(-10deg)'
                }} 
              />
            </div>
            <div className="mt-3 flex justify-center items-center h-8 z-10">
              <div className="w-8 h-1.5 bg-white rounded-full" style={{ transform: 'scaleY(1.5)' }} />
            </div>
          </>
        );
      case 'hooded':
        return (
          <>
            {/* Hood outline */}
            <div className="absolute inset-0 z-5 rounded-full overflow-hidden">
              <div className="h-full w-full bg-transparent"
                style={{
                  clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
                  border: `1px solid ${haloColor}40`,
                  borderTop: `10px solid ${haloColor}60`,
                  borderTopLeftRadius: '40px',
                  borderTopRightRadius: '40px',
                }}
              />
            </div>
            <div className="flex justify-around w-14 mb-3 z-10">
              {/* Shadowed eyes */}
              <div 
                className={`w-4 h-3 rounded-full flex justify-center items-center duration-200 ${blinking ? 'h-0.5' : ''}`}
                style={{
                  background: 'white',
                  opacity: 0.7,
                  transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`,
                  boxShadow: `0 0 8px ${haloColor}`,
                }}
              >
                <div className="w-2 h-2 bg-gray-900 rounded-full" />
              </div>
              <div 
                className={`w-4 h-3 rounded-full flex justify-center items-center duration-200 ${blinking ? 'h-0.5' : ''}`}
                style={{
                  background: 'white',
                  opacity: 0.7,
                  transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`,
                  boxShadow: `0 0 8px ${haloColor}`,
                }}
              >
                <div className="w-2 h-2 bg-gray-900 rounded-full" />
              </div>
            </div>
            <div className="mt-2 flex justify-center items-center h-8 z-10">
              <svg
                width="16"
                height="6"
                viewBox="0 0 16 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Slight Smile</title>
                <path
                  d="M2 3C2 3 5 5 8 5C11 5 14 3 14 3"
                  stroke="white"
                  strokeWidth="1"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </>
        );
      case 'glitched':
        return (
          <>
            <div className="flex justify-around w-16 mb-4 z-10">
              {/* Glitched eyes */}
              <div 
                className="w-5 h-3 bg-white duration-200 animate-glitch"
                style={{
                  clipPath: 'polygon(0 0, 100% 30%, 100% 70%, 0% 100%)',
                  transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`,
                  boxShadow: `0 0 10px ${haloColor}`,
                }}
              />
              <div 
                className="w-5 h-3 bg-white duration-200 animate-glitch"
                style={{
                  clipPath: 'polygon(0 30%, 100% 0%, 100% 100%, 0% 70%)',
                  transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`,
                  boxShadow: `0 0 10px ${haloColor}`,
                }}
              />
            </div>
            <div className="mt-2 flex justify-center items-center h-8 z-10">
              <div
                className="w-8 h-2 bg-white rounded-sm animate-glitch"
                style={{
                  clipPath: 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)',
                }}
              />
            </div>
          </>
        );
      default:
        return (
          <>
            <div className="flex justify-around w-16 mb-4 z-10">
              <div 
                className={`w-5 h-5 rounded-full flex justify-center items-center duration-200 ${blinking ? 'h-0.5' : ''}`}
                style={{
                  background: 'white',
                  transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`,
                  boxShadow: `0 0 10px ${haloColor}`,
                }}
              >
                <div className="w-2.5 h-2.5 bg-gray-900 rounded-full" />
              </div>
              <div 
                className={`w-5 h-5 rounded-full flex justify-center items-center duration-200 ${blinking ? 'h-0.5' : ''}`}
                style={{
                  background: 'white',
                  transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`,
                  boxShadow: `0 0 10px ${haloColor}`,
                }}
              >
                <div className="w-2.5 h-2.5 bg-gray-900 rounded-full" />
              </div>
            </div>
            <div className="mt-2 flex justify-center items-center h-8 z-10">
              <div className="w-8 h-1.5 bg-white rounded-full" />
            </div>
          </>
        );
    }
  };

  return (
    <div className="overlay-element avatar">
      <div className="scan-line" />
      <div className="flex flex-col p-4">
        <div className="flex justify-between items-center mb-2">
          <span
            className="text-xs uppercase tracking-wider font-semibold"
            style={{
              color: 'var(--neon-purple)',
              textShadow: '0 0 5px var(--neon-purple)',
            }}
          >
            AI.CORE
          </span>
          <div
            className="px-2 py-0.5 text-xs"
            style={{
              border: '1px solid var(--neon-purple)',
              borderRadius: '2px',
            }}
          >
            <span style={{ color: 'var(--neon-purple)' }}>v3.0</span>
          </div>
        </div>
        <div className="flex justify-center items-center">
          <div
            className={`relative w-32 h-32 rounded-full flex flex-col justify-center items-center ${glitchEffect ? 'animate-glitch' : ''}`}
            style={{
              background:
                'radial-gradient(circle, rgba(15,15,18,0.8) 0%, rgba(5,5,10,0.9) 100%)',
              boxShadow: `0 0 30px ${haloColor}40, 0 0 15px ${haloColor}30`,
              border: `1px solid ${haloColor}`,
            }}
          >
            {/* Animated halo ring */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                border: '2px solid transparent',
                borderTopColor: haloColor,
                borderRadius: '50%',
                animation: 'spin 4s linear infinite',
              }}
            />

            {/* Inner ring with circuit pattern */}
            <div
              className="absolute inset-3 rounded-full"
              style={{
                border: `1px solid ${haloColor}60`,
                boxShadow: `inset 0 0 10px ${haloColor}30`,
                background: `radial-gradient(circle, transparent 60%, ${haloColor}20 100%)`,
              }}
            />

            {/* Digital circuit lines */}
            <div className="absolute inset-0 rounded-full overflow-hidden opacity-30">
              <div
                className="h-full w-full"
                style={{
                  backgroundImage: `
                  linear-gradient(to right, ${haloColor}20 1px, transparent 1px),
                  linear-gradient(to bottom, ${haloColor}20 1px, transparent 1px)
                `,
                  backgroundSize: '8px 8px',
                }}
              />
            </div>

            {/* Face */}
            {renderFace()}

            {/* IQ indicator for genius character */}
            {mood === 'genius' && (
              <div className="absolute top-1 right-0 left-0 flex justify-center">
                <div className="px-2 py-0.5 text-xs" style={{ color: haloColor, border: `1px solid ${haloColor}30`, borderRadius: '2px' }}>
                  IQ 130+
                </div>
              </div>
            )}

            {/* Energy level indicator */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <div className="w-16 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full"
                  style={{
                    width: `${65 + Math.sin(Date.now() / 1000) * 20}%`,
                    background: haloColor,
                    boxShadow: `0 0 5px ${haloColor}`,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3 flex justify-between items-center">
          <div className="flex items-center">
            <div
              className="w-2 h-2 rounded-full mr-2 animate-pulse"
              style={{
                backgroundColor: haloColor,
                boxShadow: `0 0 10px ${haloColor}`,
              }}
            />
            <span className="text-xs" style={{ color: haloColor }}>
              {mood === 'simple' ? 'BASIC' : mood === 'genius' ? 'EXPERT' : mood === 'hooded' ? 'STEALTH' : 'ERROR'}
            </span>
          </div>
          <div
            className="text-xs px-2 py-0.5 rounded"
            style={{ border: `1px solid ${haloColor}50`, color: haloColor }}
          >
            midcurve.live
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnimatedAvatar; 
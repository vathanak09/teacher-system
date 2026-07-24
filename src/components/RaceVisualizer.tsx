"use client";
import React, { useState, useEffect, useRef } from 'react';
import { playRunningSound, playTadaSound } from '@/utils/audioUtils';

interface RaceVisualizerProps {
  items: string[];
  onWinner?: (winner: string) => void;
  raceType?: 'running' | 'bicycle';
}

const RaceVisualizer: React.FC<RaceVisualizerProps> = ({ items, onWinner, raceType = 'running' }) => {
  const [raceState, setRaceState] = useState<'idle' | 'racing' | 'finished'>('idle');
  const [durations, setDurations] = useState<number[]>([]);
  const [winnerIndex, setWinnerIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
    '#D4A5A5', '#9B59B6', '#3498DB', '#F1C40F', '#E67E22',
    '#1ABC9C', '#E74C3C', '#E84393', '#00CEC9', '#FD79A8'
  ];

  const startRace = () => {
    if (items.length === 0 || raceState === 'racing') return;

    setRaceState('racing');
    playRunningSound();

    const winnerIdx = Math.floor(Math.random() * items.length);
    setWinnerIndex(winnerIdx);

    const newDurations = items.map((_, i) => {
      if (i === winnerIdx) return 3000; // Winner takes exactly 3 seconds
      return 3500 + Math.random() * 3000; // Losers take 3.5s to 6.5s
    });
    setDurations(newDurations);

    setTimeout(() => {
      setRaceState('finished');
      playTadaSound();
      if (onWinner) onWinner(items[winnerIdx]);
      
      // Auto scroll to winner if out of view (only if container is scrolling)
      if (containerRef.current) {
        const winnerEl = containerRef.current.children[winnerIdx] as HTMLElement;
        if (winnerEl) {
          winnerEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 3000);
  };

  const resetRace = () => {
    setRaceState('idle');
    setWinnerIndex(-1);
    setDurations([]);
  };

  if (items.length === 0) {
    return (
      <div style={{ width: '100%', padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        មិនមានទិន្នន័យសម្រាប់ប្រណាំងទេ
      </div>
    );
  }

  // Dynamic Sizing calculations
  // We want to fit all runners in 400px (or roughly the screen height) if possible.
  // Minimum lane height is 30px so it's somewhat readable.
  const maxContainerHeight = 500;
  const preferredLaneHeight = 50; // default large size
  const calculatedLaneHeight = Math.floor(maxContainerHeight / items.length);
  const laneHeight = Math.max(30, Math.min(preferredLaneHeight, calculatedLaneHeight));
  
  // Font sizes scale with lane height
  const iconSize = Math.max(14, laneHeight * 0.4);
  const fontSize = Math.max(9, laneHeight * 0.25);

  const iconEmoji = raceType === 'running' ? '🏃‍♂️' : '🚴‍♂️';

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <button
          onClick={startRace}
          disabled={raceState === 'racing'}
          className="btn btn-primary"
          style={{ padding: '0.75rem 2rem', fontSize: '1.2rem' }}
        >
          {raceState === 'racing' ? 'កំពុងប្រណាំង...' : (raceType === 'running' ? 'ចាប់ផ្តើមរត់ប្រណាំង' : 'ចាប់ផ្តើមប្រណាំងកង់')}
        </button>
        {raceState === 'finished' && (
          <button onClick={resetRace} className="btn" style={{ padding: '0.75rem 2rem' }}>
            លេងម្តងទៀត
          </button>
        )}
      </div>

      {raceState === 'finished' && winnerIndex >= 0 && (
        <div className="animate-bounce" style={{
          alignSelf: 'center',
          marginBottom: '1rem',
          padding: '1rem 2rem',
          background: 'var(--primary-color)',
          color: 'white',
          borderRadius: '16px',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)'
        }}>
          🏆 {items[winnerIndex]} 🏆
        </div>
      )}

      {/* Race Track */}
      <div 
        style={{ 
          position: 'relative', 
          width: '100%', 
          height: `${Math.min(maxContainerHeight, items.length * laneHeight + 20)}px`, 
          overflowY: 'auto', 
          overflowX: 'hidden',
          background: '#f8fafc',
          border: '2px solid #cbd5e1',
          borderRadius: '12px',
          padding: '10px 0'
        }}
      >
        {/* Finish Line Indicator */}
        <div style={{
          position: 'absolute',
          right: '50px',
          top: 0,
          bottom: 0,
          width: '8px',
          background: 'repeating-linear-gradient(45deg, #000, #000 10px, #fff 10px, #fff 20px)',
          borderLeft: '2px solid #000',
          zIndex: 0
        }} />

        <div ref={containerRef} style={{ position: 'relative', zIndex: 1 }}>
          {items.map((item, index) => {
            const duration = durations[index] || 0;
            const isFinished = raceState === 'finished';
            const isWinner = isFinished && index === winnerIndex;
            
            // Movement: 0% left initially. If racing or finished, move to calc(100% - offset)
            const translateX = raceState !== 'idle' ? 'calc(100% - 65px)' : '10px';
            
            return (
              <div 
                key={index} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  position: 'relative',
                  height: `${laneHeight}px`
                }}
              >
                {/* Lane line */}
                <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', borderTop: '1px dashed #cbd5e1', zIndex: 0 }} />
                
                {/* Runner Icon & Name */}
                <div 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', // Name above icon
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'absolute',
                    left: 0,
                    transform: `translateX(${translateX})`,
                    transition: raceState === 'racing' ? `transform ${duration}ms ease-in` : (raceState === 'idle' ? 'transform 0s' : 'none'),
                    zIndex: isWinner ? 10 : 1,
                  }}
                >
                  <span style={{ 
                    fontWeight: 'bold', 
                    fontSize: `${fontSize}px`, 
                    color: '#334155',
                    background: 'rgba(255,255,255,0.8)',
                    padding: '0 4px',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                    marginBottom: '2px', // space between name and icon
                    boxShadow: isWinner ? '0 0 5px gold' : 'none'
                  }}>
                    {item.length > 15 ? item.substring(0, 15) + '...' : item}
                  </span>
                  <div style={{
                    fontSize: `${iconSize}px`,
                    background: isWinner ? '#fef08a' : 'white',
                    padding: '2px',
                    borderRadius: '50%',
                    border: `2px solid ${colors[index % colors.length]}`,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: `${iconSize + 10}px`,
                    height: `${iconSize + 10}px`
                  }}>
                    {isWinner ? '🏆' : iconEmoji}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(-25%); }
          50% { transform: none; }
        }
      `}</style>
    </div>
  );
};

export default RaceVisualizer;

"use client";
import React, { useState, useRef, useEffect } from 'react';
import { playRunningSound, playTadaSound } from '@/utils/audioUtils';

interface RaceVisualizerProps {
  items: string[];
  onWinner?: (winner: string) => void;
  raceType?: 'running' | 'bicycle';
}

const RaceVisualizer: React.FC<RaceVisualizerProps> = ({ items, onWinner, raceType = 'running' }) => {
  const [raceState, setRaceState] = useState<'idle' | 'racingPhase1' | 'racingPhase2' | 'finished'>('idle');
  const [durations, setDurations] = useState<number[]>([]);
  const [easings, setEasings] = useState<string[]>([]);
  const [verticalPositions, setVerticalPositions] = useState<number[]>([]);
  const [winnerIndex, setWinnerIndex] = useState<number>(-1);
  const [raceDuration, setRaceDuration] = useState<number>(3000); // Default 3 seconds
  const containerRef = useRef<HTMLDivElement>(null);

  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
    '#D4A5A5', '#9B59B6', '#3498DB', '#F1C40F', '#E67E22',
    '#1ABC9C', '#E74C3C', '#E84393', '#00CEC9', '#FD79A8'
  ];

  // Initialize random vertical positions when items change
  useEffect(() => {
    if (raceState === 'idle') {
      const positions = items.map(() => 5 + Math.random() * 85); // 5% to 90% from top
      setVerticalPositions(positions);
    }
  }, [items, raceState]);

  const startRace = () => {
    if (items.length === 0 || raceState === 'racingPhase1' || raceState === 'racingPhase2') return;

    if (raceState === 'finished') {
      resetRace();
      // Need a tiny delay to allow CSS reset before restarting
      setTimeout(() => executeStart(), 50);
    } else {
      executeStart();
    }
  };

  const executeStart = () => {
    setRaceState('racingPhase1');
    playRunningSound();

    const winnerIdx = Math.floor(Math.random() * items.length);
    setWinnerIndex(winnerIdx);

    // Phase 1: Slow and steady until 70% of the track
    const phase1Duration = raceDuration * 0.85;
    setDurations(items.map(() => phase1Duration));

    // Gentle easings so they stay close but still swap places smoothly
    const gentleEasings = [
      'ease-in-out', 
      'ease', 
      'linear', 
      'cubic-bezier(0.4, 0.0, 0.2, 1)', // Smooth steady pace
      'cubic-bezier(0.2, 0.0, 0.8, 1)'  // Slight variation
    ];
    setEasings(items.map(() => gentleEasings[Math.floor(Math.random() * gentleEasings.length)]));

    // Start Phase 2: The Breakaway
    setTimeout(() => {
      setRaceState('racingPhase2');
      
      const phase2DurationWinner = raceDuration * 0.15;
      
      setDurations(items.map((_, i) => {
        if (i === winnerIdx) return phase2DurationWinner; 
        return phase2DurationWinner + 1500 + Math.random() * 2000; // Losers lag behind drastically
      }));
      
      setEasings(items.map((_, i) => i === winnerIdx ? 'ease-out' : 'linear'));

      // Finish Race
      setTimeout(() => {
        setRaceState('finished');
        playTadaSound();
        if (onWinner) onWinner(items[winnerIdx]);
      }, phase2DurationWinner);

    }, phase1Duration);
  };

  const resetRace = () => {
    setRaceState('idle');
    setWinnerIndex(-1);
    setDurations([]);
    
    // Scramble vertical positions again
    const positions = items.map(() => 5 + Math.random() * 85);
    setVerticalPositions(positions);
  };

  if (items.length === 0) {
    return (
      <div style={{ width: '100%', padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        មិនមានទិន្នន័យសម្រាប់ប្រណាំងទេ
      </div>
    );
  }

  const iconEmoji = raceType === 'running' ? '🏃‍♂️' : '🚴‍♂️';

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--card-bg)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>រយៈពេល៖</label>
          <select 
            value={raceDuration} 
            onChange={e => setRaceDuration(Number(e.target.value))}
            className="input-field"
            style={{ padding: '0.25rem 0.5rem', width: 'auto', minWidth: '80px', height: 'auto', background: 'transparent', border: 'none' }}
            disabled={raceState !== 'idle' && raceState !== 'finished'}
          >
            <option value={3000}>៣ វិនាទី</option>
            <option value={5000}>៥ វិនាទី</option>
            <option value={10000}>១០ វិនាទី</option>
            <option value={15000}>១៥ វិនាទី</option>
          </select>
        </div>

        <button
          onClick={startRace}
          disabled={raceState !== 'idle' && raceState !== 'finished'}
          className="btn btn-primary"
          style={{ padding: '0.75rem 2rem', fontSize: '1.2rem', minWidth: '200px' }}
        >
          {raceState === 'racingPhase1' || raceState === 'racingPhase2' ? 'កំពុងប្រណាំង...' : (raceType === 'running' ? 'ចាប់ផ្តើមរត់ប្រណាំង' : 'ចាប់ផ្តើមប្រណាំងកង់')}
        </button>
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

      {/* Race Track - Single Open Area */}
      <div 
        style={{ 
          position: 'relative', 
          width: '100%', 
          height: '400px', // Fixed height for the shared track
          overflow: 'hidden', // No scrolling, everyone overlaps
          background: '#f8fafc',
          border: '2px solid #cbd5e1',
          borderRadius: '12px',
          boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.05)'
        }}
      >
        {/* Finish Line Indicator */}
        <div style={{
          position: 'absolute',
          right: '50px',
          top: 0,
          bottom: 0,
          width: '15px',
          background: 'repeating-linear-gradient(45deg, #000, #000 10px, #fff 10px, #fff 20px)',
          borderLeft: '4px solid #ef4444',
          zIndex: 1
        }} />

        {/* Track Lines for decoration */}
        <div style={{ position: 'absolute', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', opacity: 0.3, zIndex: 0 }}>
          <div style={{ borderTop: '2px dashed #cbd5e1' }} />
          <div style={{ borderTop: '2px dashed #cbd5e1' }} />
          <div style={{ borderTop: '2px dashed #cbd5e1' }} />
          <div style={{ borderTop: '2px dashed #cbd5e1' }} />
        </div>

        <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}>
          {items.map((item, index) => {
            const duration = durations[index] || 0;
            const isFinished = raceState === 'finished';
            const isWinner = isFinished && index === winnerIndex;
            
            let leftPos = '0';
            if (raceState === 'racingPhase1') {
              leftPos = 'calc(70% - 70px)';
            } else if (raceState === 'racingPhase2' || raceState === 'finished') {
              leftPos = 'calc(100% - 70px)';
            }

            return (
              <div 
                key={index} 
                style={{ 
                  position: 'absolute',
                  left: leftPos,
                  top: `${verticalPositions[index]}%`,
                  transition: raceState === 'idle' ? 'none' : `left ${durations[index]}ms ${easings[index] || 'ease-in-out'}`,
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: isWinner ? 100 : Math.floor(verticalPositions[index])
                }}
              >
                {/* Compact Name Label */}
                <div style={{
                  background: colors[index % colors.length],
                  color: 'white',
                  padding: '0.15rem 0.4rem',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '70px',
                  marginBottom: '2px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  border: isWinner ? '2px solid gold' : '1px solid rgba(255,255,255,0.3)',
                  textAlign: 'center'
                }}>
                  {item}
                </div>

                {/* Runner Icon */}
                <div style={{
                  fontSize: '20px',
                  background: isWinner ? '#fef08a' : 'white',
                  borderRadius: '50%',
                  border: `3px solid ${colors[index % colors.length]}`,
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  flexShrink: 0
                }}>
                  {isWinner ? '🏆' : iconEmoji}
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

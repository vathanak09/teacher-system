"use client";
import React, { useState, useEffect } from 'react';
import { playTickSound, playTadaSound } from '@/utils/audioUtils';

interface SpinningWheelProps {
  items: string[];
  onWinner?: (winner: string) => void;
}

const SpinningWheel: React.FC<SpinningWheelProps> = ({ items, onWinner }) => {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [lastTickSlice, setLastTickSlice] = useState<number>(-1);
  
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
    '#D4A5A5', '#9B59B6', '#3498DB', '#F1C40F', '#E67E22',
    '#1ABC9C', '#E74C3C', '#E84393', '#00CEC9', '#FD79A8'
  ];

  // Logic to simulate ticking sound while rotating is tricky without requestAnimationFrame.
  // We'll play a ticking sound at the start and during animation using a simple interval for fun.
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSpinning) {
      interval = setInterval(() => {
        playTickSound();
      }, 150);
      
      // Slow down tick over time
      setTimeout(() => clearInterval(interval), 2000);
      setTimeout(() => {
        interval = setInterval(() => playTickSound(), 300);
      }, 2000);
      setTimeout(() => clearInterval(interval), 3000);
      setTimeout(() => {
        interval = setInterval(() => playTickSound(), 500);
      }, 3000);
      setTimeout(() => clearInterval(interval), 3800);
    }
    return () => clearInterval(interval);
  }, [isSpinning]);

  const spinWheel = () => {
    if (isSpinning || items.length === 0) return;
    
    setIsSpinning(true);
    setWinner(null);

    const spinDuration = 4000; // 4 seconds
    const minSpins = 5;
    const randomIndex = Math.floor(Math.random() * items.length);
    const sliceAngle = 360 / items.length;
    
    // The pointer is at the right (0 degrees / 360 degrees visually).
    // In our SVG, index 0 starts at top (-90deg) and goes clockwise.
    // SVG is rotated -90deg, so 0 visually is top. 
    // If pointer is at right (+90deg relative to SVG top):
    // Let's just use standard math and adjust manually.
    // The target angle to rotate backward so the item lands on the pointer (right side):
    // The center of the slice is (index * sliceAngle + sliceAngle / 2).
    // SVG 0 is right. We rotate SVG by -90deg, so 0 is top. 
    // Pointer is at right (+90 deg from top).
    // Slice center visually starts at: -90 + (index * sliceAngle + sliceAngle / 2).
    // To bring slice center to right (+0 visually), we need total rotation to end up at:
    const sliceCenterAngle = randomIndex * sliceAngle + sliceAngle / 2;
    // We want the slice center to align with the pointer.
    // Since pointer is at right, we want the rotation to offset the slice center to 0.
    const targetAngle = 360 - sliceCenterAngle;
    
    const totalRotation = rotation + (360 - (rotation % 360)) + (360 * minSpins) + targetAngle;

    setRotation(totalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setWinner(items[randomIndex]);
      playTadaSound();
      if (onWinner) onWinner(items[randomIndex]);
    }, spinDuration);
  };

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      
      <div style={{ position: 'relative', width: '350px', height: '350px', margin: '2rem 0' }}>
        {/* The Pointer (Right Side) */}
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '-20px',
          transform: 'translateY(-50%)',
          width: 0,
          height: 0,
          borderTop: '15px solid transparent',
          borderBottom: '15px solid transparent',
          borderRight: '25px solid #2d3748',
          zIndex: 10
        }} />

        {/* The Wheel */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            overflow: 'hidden',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
            position: 'relative'
          }}
        >
          {items.length === 0 ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7fafc', color: '#a0aec0' }}>
              មិនមានទិន្នន័យ
            </div>
          ) : items.length === 1 ? (
             <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors[0], color: 'white', fontWeight: 'bold' }}>
               {items[0]}
             </div>
          ) : (
            <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(0deg)', overflow: 'visible', width: '100%', height: '100%' }}>
              {items.map((item, index) => {
                const percent = 1 / items.length;
                const startPercent = index * percent;
                const endPercent = startPercent + percent;
                const [startX, startY] = getCoordinatesForPercent(startPercent);
                const [endX, endY] = getCoordinatesForPercent(endPercent);
                const largeArcFlag = percent > 0.5 ? 1 : 0;
                const pathData = [
                  `M ${startX} ${startY}`,
                  `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                  `L 0 0`,
                ].join(' ');

                // Calculate text position
                const textPercent = startPercent + percent / 2;
                const [textX, textY] = getCoordinatesForPercent(textPercent);
                const textAngle = textPercent * 360;

                return (
                  <g key={index}>
                    <path d={pathData} fill={colors[index % colors.length]} stroke="white" strokeWidth="0.01" />
                    <text
                      x={textX * 0.65}
                      y={textY * 0.65}
                      fill="white"
                      fontSize={items.length > 20 ? "0.06" : "0.08"}
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform={`rotate(${textAngle}, ${textX * 0.65}, ${textY * 0.65})`}
                    >
                      {item.length > 12 ? item.substring(0, 12) + '...' : item}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* Center Button */}
        <button
          onClick={spinWheel}
          disabled={isSpinning || items.length === 0}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'white',
            border: '4px solid #f7fafc',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            cursor: isSpinning || items.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: 'var(--primary-color)',
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          បង្វិល
        </button>
      </div>

      {/* Winner Announcement */}
      {winner && !isSpinning && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem 2rem',
          background: 'var(--primary-color)',
          color: 'white',
          borderRadius: '16px',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)',
          animation: 'bounce 1s infinite'
        }}>
          🎉 {winner} 🎉
        </div>
      )}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
          50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); }
        }
      `}</style>
    </div>
  );
};

export default SpinningWheel;

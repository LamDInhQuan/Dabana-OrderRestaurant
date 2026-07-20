import { useState, useEffect } from 'react';

export default function PaymentCountdown({ expiresAt, onTimeout }) {
  const calculateTimeLeft = () => {
    const difference = +new Date(expiresAt) - +new Date();
    return difference > 0 ? Math.floor(difference / 1000) : 0;
  };

  const [secondsLeft, setSecondsLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    if (secondsLeft <= 0) {
      onTimeout();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div style={{ textAlign: 'center', margin: '1rem 0' }}>
      <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'monospace' }}>
        ⏳ {formatTime(secondsLeft)}
      </span>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  endDate: string | Date;
  onExpired?: () => void;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

function useCountdown(endDate: string | Date) {
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  const getTimeLeft = () => {
    const now = Date.now();
    const diff = end.getTime() - now;
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      expired: false,
    };
  };

  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  useEffect(() => {
    const interval = setInterval(() => {
      const t = getTimeLeft();
      setTimeLeft(t);
      if (t.expired) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [end.getTime()]);

  return timeLeft;
}

export function CountdownTimer({ endDate, onExpired, size = 'md', label = 'Ends in', className }: CountdownTimerProps) {
  const { days, hours, minutes, seconds, expired } = useCountdown(endDate);

  useEffect(() => {
    if (expired) onExpired?.();
  }, [expired, onExpired]);

  if (expired) {
    return <span className="text-red-500 font-bold text-sm">Deal Expired</span>;
  }

  const sizeClasses = {
    sm: { block: 'w-10 h-10 text-base', label: 'text-[9px]', separator: 'text-sm' },
    md: { block: 'w-14 h-14 text-xl', label: 'text-[10px]', separator: 'text-xl' },
    lg: { block: 'w-16 h-16 text-2xl', label: 'text-xs', separator: 'text-2xl' },
  }[size];

  const Unit = ({ value, unit }: { value: number; unit: string }) => (
    <div className="flex flex-col items-center">
      <div className={`${sizeClasses.block} bg-gray-900 dark:bg-gray-700 text-white font-black rounded-xl flex items-center justify-center tabular-nums leading-none`}>
        {String(value).padStart(2, '0')}
      </div>
      <span className={`${sizeClasses.label} text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide`}>{unit}</span>
    </div>
  );

  return (
    <div className={className}>
      {label && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">{label}</p>}
      <div className="flex items-start gap-1.5">
        {days > 0 && <><Unit value={days} unit="Days" /><span className={`${sizeClasses.separator} font-black text-orange-500 mt-2`}>:</span></>}
        <Unit value={hours} unit="Hours" />
        <span className={`${sizeClasses.separator} font-black text-orange-500 mt-2`}>:</span>
        <Unit value={minutes} unit="Mins" />
        <span className={`${sizeClasses.separator} font-black text-orange-500 mt-2`}>:</span>
        <Unit value={seconds} unit="Secs" />
      </div>
    </div>
  );
}

export default CountdownTimer;

import React, { useState, useEffect } from 'react';

interface SlaTimerProps {
  deadline: string;
}

const SlaTimer: React.FC<SlaTimerProps> = ({ deadline }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(deadline) - +new Date();
    let timeLeft = {
      days: 0,
      hours: 0,
      minutes: 0,
      total: difference
    };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        total: difference
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); // update every minute

    return () => clearTimeout(timer);
  });

  const timerComponents: string[] = [];
  if (timeLeft.days > 0) timerComponents.push(`${timeLeft.days}d`);
  if (timeLeft.hours > 0) timerComponents.push(`${timeLeft.hours}h`);
  if (timeLeft.minutes > 0) timerComponents.push(`${timeLeft.minutes}m`);
  
  if (timeLeft.total <= 0) {
    return <span className="font-semibold text-red-600 dark:text-red-400">Breached</span>;
  }
  
  const totalHoursLeft = timeLeft.total / (1000 * 60 * 60);
  const colorClass = totalHoursLeft <= 4 ? 'text-red-600 dark:text-red-400'
                   : totalHoursLeft <= 12 ? 'text-amber-600 dark:text-amber-400'
                   : 'text-green-600 dark:text-green-400';

  return (
    <span className={`font-semibold ${colorClass}`}>
      {timerComponents.join(' ')} left
    </span>
  );
};

export default SlaTimer;
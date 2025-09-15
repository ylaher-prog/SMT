import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'good' | 'bad' | 'neutral';
  iconBgColor?: string;
  iconTextColor?: string;
  sparklineData?: { date: string; value: number }[];
  onClick?: () => void;
  isLoading?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, trend = 'neutral', iconBgColor = 'bg-gray-100', iconTextColor = 'text-gray-600', sparklineData, onClick, isLoading }) => {
    
  const trendColor = (() => {
    if (trend === 'bad' && typeof value === 'number' && value > 0) {
      return 'text-red-500 dark:text-red-400';
    }
    if (trend === 'good' && typeof value === 'number' && value > 0) {
      return 'text-brand-accent';
    }
    return 'text-brand-text-dark dark:text-white';
  })();

  const WrapperComponent = onClick ? 'button' : 'div';
  const wrapperProps = onClick ? { onClick, className: 'w-full text-left' } : { className: 'w-full' };

  return (
    <WrapperComponent {...wrapperProps}>
      <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm flex items-start justify-between h-full">
        <div className="flex flex-col justify-between h-full w-full">
          <div>
            <p className="text-sm font-medium text-brand-text-light dark:text-gray-400">{title}</p>
            {isLoading ? (
              <div className="h-9 w-24 bg-gray-200 dark:bg-slate-700 rounded-md animate-pulse mt-1" />
            ) : (
              <p className={`text-3xl font-bold mt-1 ${trendColor}`}>{value}</p>
            )}
          </div>
          {sparklineData && sparklineData.length > 1 && !isLoading && (
            <div className="h-12 w-full max-w-xs -ml-2 -mb-2 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData}>
                  <defs>
                    <linearGradient id="sparklineColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#AD9040" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#AD9040" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#AD9040" strokeWidth={2} fill="url(#sparklineColor)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${iconBgColor} flex-shrink-0 ml-2`}>
          <div className={`h-6 w-6 ${iconTextColor}`}>{icon}</div>
        </div>
      </div>
    </WrapperComponent>
  );
};

export default KpiCard;

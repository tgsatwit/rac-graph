// Generated by UI Tool - Adapting for Argon Theme
import React from "react";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/solid"; // Using heroicons as per other components
import { cn } from "@/lib/utils"; // Assuming shadcn/ui setup

interface StatCardProps {
  title: string;
  value: string;
  change?: {
    value: string;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  iconBgColorClass?: string; // Allow overriding icon background
  className?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  change, 
  icon, 
  iconBgColorClass = 'bg-primary', // Default to Argon primary
  className 
}: StatCardProps) {
  return (
    <div className={cn(
      "bg-white shadow-md rounded-lg border border-blue-gray-200 p-5 flex items-center justify-between", 
      className
    )}>
      <div>
        <p className="text-sm font-medium text-text-muted uppercase tracking-wider">
          {title}
        </p>
        <p className="text-2xl font-semibold text-text-dark mt-1">
          {value}
        </p>
        {change && (
          <p className={`mt-1 text-xs flex items-center ${change.isPositive ? 'text-success' : 'text-danger'}`}>
            {change.isPositive ? (
              <ArrowUpIcon className="w-4 h-4 mr-1" />
            ) : (
              <ArrowDownIcon className="w-4 h-4 mr-1" />
            )}
            {change.value}
          </p>
        )}
      </div>
      <div className={cn(
        "p-3 rounded-full text-white",
        iconBgColorClass
      )}>
        {icon}
      </div>
    </div>
  );
} 
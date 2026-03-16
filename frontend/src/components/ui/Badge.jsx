import React from 'react';
import { cn } from "../../utils/cn";

export const Badge = ({ className, variant = "default", ...props }) => {
  const variants = {
    default: "bg-slate-800 text-slate-300",
    success: "bg-success/20 text-success border border-success/30",
    danger: "bg-danger/20 text-danger border border-danger/30",
    warning: "bg-amber-500/20 text-amber-500 border border-amber-500/30",
  };
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

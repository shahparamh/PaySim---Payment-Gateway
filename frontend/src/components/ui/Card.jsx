import React from 'react';
import { cn } from "../../utils/cn";

export const Card = ({ className, ...props }) => (
  <div className={cn("glass rounded-xl shadow-xl p-6", className)} {...props} />
);
export const CardHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 mb-4", className)} {...props} />
);
export const CardTitle = ({ className, ...props }) => (
  <h3 className={cn("text-lg font-semibold leading-none tracking-tight text-white", className)} {...props} />
);
export const CardContent = ({ className, ...props }) => (
  <div className={cn("", className)} {...props} />
);

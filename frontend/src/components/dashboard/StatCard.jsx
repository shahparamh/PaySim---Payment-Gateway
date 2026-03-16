import React from 'react';
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "../ui/Card";
import { cn } from "../../utils/cn";

export const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendType = "up" }) => (
  <Card className="relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium opacity-60 mb-1">{title}</p>
        <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
        {subtitle && <p className="text-xs opacity-50 mt-1">{subtitle}</p>}
      </div>
      <div className="p-3 rounded-xl bg-primary/10 text-primary border border-border group-hover:bg-primary/20 transition-colors"><Icon className="w-5 h-5" /></div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center space-x-2">
        <div className={cn("flex items-center text-xs font-bold px-2 py-0.5 rounded-full", trendType === "up" ? "bg-success/20 text-success" : "bg-danger/20 text-danger")}>
          {trendType === "up" ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}{trend}
        </div>
        <span className="text-[10px] opacity-50 font-medium italic">vs last month</span>
      </div>
    )}
    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
  </Card>
);

import React from 'react';
import { ArrowRight } from "lucide-react";
import { Card } from "../ui/Card";
import { cn } from "../../utils/cn";

export const ActionCard = ({ title, description, icon: Icon, onClick, variant = "primary" }) => {
  const variants = { primary: "from-primary/10 to-indigo-600/5 hover:border-primary/50", success: "from-success/10 to-emerald-600/5 hover:border-success/50", warning: "from-amber-500/10 to-orange-600/5 hover:border-amber-500/50" };
  const iconColors = { primary: "text-primary", success: "text-success", warning: "text-amber-500" };
  return (
    <Card onClick={onClick} className={cn("relative p-5 bg-gradient-to-br border border-border cursor-pointer group transition-all duration-300", variants[variant])}>
      <div className="flex items-start space-x-4">
        <div className={cn("p-2.5 rounded-lg bg-background shadow-inner", iconColors[variant])}><Icon className="w-5 h-5" /></div>
        <div className="flex-1"><h4 className="text-sm font-bold mb-1 group-hover:text-primary transition-colors">{title}</h4><p className="text-xs opacity-60 font-medium leading-relaxed">{description}</p></div>
        <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all self-center" />
      </div>
    </Card>
  );
};

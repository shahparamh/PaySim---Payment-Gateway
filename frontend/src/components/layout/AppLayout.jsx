import React from 'react';
import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";
import { useTheme } from "../../context/ThemeContext";

export const AppLayout = ({ children }) => {
  const { theme } = useTheme();
  
  return (
    <div className={`min-h-screen flex transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-background text-white'}`}>
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <TopNavbar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
};

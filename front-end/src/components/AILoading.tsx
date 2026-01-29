"use client";

import { Brain, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AILoadingProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function AILoading({ size = "md", className }: AILoadingProps) {
  const sizeClasses = {
    sm: "h-3.5 w-3.5 text-purple-400",
    md: "h-5 w-5 text-purple-500",
    lg: "h-8 w-8 text-purple-600",
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="relative">
        <Brain className={cn(sizeClasses[size], "animate-pulse")} />
        <Sparkles className={cn(sizeClasses[size], "absolute inset-0 animate-ping opacity-75")} />
      </div>
      <span className={cn(
        "font-bold tracking-wider uppercase",
        size === "sm" && "text-[10px]",
        size === "md" && "text-xs",
        size === "lg" && "text-sm"
      )}>
        AI Loading...
      </span>
    </div>
  );
}


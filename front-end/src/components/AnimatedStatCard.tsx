"use client";

import { useScaleIn } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import CountUp from "react-countup";
import { useInView } from "framer-motion";
import { useRef } from "react";

interface AnimatedStatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  delay?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export default function AnimatedStatCard({
  label,
  value,
  icon: Icon,
  color,
  delay = 0,
  prefix = "",
  suffix = "",
  decimals,
}: AnimatedStatCardProps) {
  const ref = useScaleIn({ delay, scale: 0.9 });
  const observeRef = useRef<HTMLElement | null>(null);
  const isInView = useInView(observeRef, { once: true, margin: "-10% 0px" });

  return (
    <div
      ref={(node) => {
        (ref as React.MutableRefObject<HTMLElement | null>).current = node as HTMLElement | null;
        observeRef.current = node as HTMLElement | null;
      }}
      className="flex flex-col items-center md:items-start gap-2 group"
    >
      <div
        className={cn(
          "p-3 rounded-lg bg-background/50 border border-border/50 group-hover:border-primary/50 transition-colors",
          color
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="text-xs font-mono text-muted-foreground tracking-wider uppercase">
        {label}
      </div>
      <div className="text-2xl md:text-3xl font-display font-bold tracking-tight">
        <CountUp
          start={0}
          end={isInView ? value : 0}
          duration={1.6}
          decimals={decimals ?? (Number.isInteger(value) ? 0 : 1)}
          suffix={suffix}
          prefix={prefix}
          separator=","
        />
      </div>
    </div>
  );
}


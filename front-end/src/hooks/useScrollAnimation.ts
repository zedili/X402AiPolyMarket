"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ScrollAnimationOptions {
  trigger: string | HTMLElement;
  start?: string;
  end?: string;
  scrub?: boolean | number;
  markers?: boolean;
  animation?: gsap.TweenVars;
  onEnter?: () => void;
  onLeave?: () => void;
  onEnterBack?: () => void;
  onLeaveBack?: () => void;
}

export function useScrollAnimation(options: ScrollAnimationOptions) {
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element =
      typeof options.trigger === "string"
        ? document.querySelector(options.trigger)
        : options.trigger;

    if (!element) return;

    const {
      start = "top 80%",
      end = "top 20%",
      scrub = true,
      markers = false,
      animation = {},
      onEnter,
      onLeave,
      onEnterBack,
      onLeaveBack,
    } = options;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        element,
        {
          opacity: 0,
          y: 50,
          ...animation,
        },
        {
          opacity: 1,
          y: 0,
          ...animation,
          scrollTrigger: {
            trigger: element,
            start,
            end,
            scrub,
            markers,
            onEnter,
            onLeave,
            onEnterBack,
            onLeaveBack,
          },
        }
      );
    });

    return () => {
      ctx.revert();
    };
  }, [options]);

  return elementRef;
}

interface FadeInUpOptions {
  delay?: number;
  duration?: number;
  start?: string;
}

export function useFadeInUp(options: FadeInUpOptions = {}) {
  const ref = useRef<HTMLElement>(null);
  const { delay = 0, duration = 1, start = "top 80%" } = options;

  useEffect(() => {
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current!,
        {
          opacity: 0,
          y: 60,
        },
        {
          opacity: 1,
          y: 0,
          duration,
          delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ref.current,
            start,
            toggleActions: "play none none reverse",
          },
        }
      );
    });

    return () => {
      ctx.revert();
    };
  }, [delay, duration, start]);

  return ref;
}

interface SlideInOptions {
  direction?: "left" | "right" | "up" | "down";
  delay?: number;
  duration?: number;
  start?: string;
}

export function useSlideIn(options: SlideInOptions = {}) {
  const ref = useRef<HTMLElement>(null);
  const {
    direction = "left",
    delay = 0,
    duration = 1,
    start = "top 80%",
  } = options;

  useEffect(() => {
    if (!ref.current) return;

    const x = direction === "left" ? -100 : direction === "right" ? 100 : 0;
    const y = direction === "up" ? -100 : direction === "down" ? 100 : 0;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current!,
        {
          opacity: 0,
          x,
          y,
        },
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration,
          delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ref.current,
            start,
            toggleActions: "play none none reverse",
          },
        }
      );
    });

    return () => {
      ctx.revert();
    };
  }, [direction, delay, duration, start]);

  return ref;
}

interface ScaleInOptions {
  delay?: number;
  duration?: number;
  start?: string;
  scale?: number;
}

export function useScaleIn(options: ScaleInOptions = {}) {
  const ref = useRef<HTMLElement>(null);
  const {
    delay = 0,
    duration = 1,
    start = "top 80%",
    scale = 0.8,
  } = options;

  useEffect(() => {
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current!,
        {
          opacity: 0,
          scale,
        },
        {
          opacity: 1,
          scale: 1,
          duration,
          delay,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: ref.current,
            start,
            toggleActions: "play none none reverse",
          },
        }
      );
    });

    return () => {
      ctx.revert();
    };
  }, [delay, duration, start, scale]);

  return ref;
}


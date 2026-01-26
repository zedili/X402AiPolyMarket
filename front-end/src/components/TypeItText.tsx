"use client";

import { useEffect, useRef } from "react";
import TypeIt from "typeit";

interface TypeItTextProps {
  strings: string[];
  speed?: number;
  loop?: boolean;
  className?: string;
  options?: Record<string, any>;
}

export default function TypeItText({
  strings,
  speed = 75,
  loop = true,
  className = "",
  options = {},
}: TypeItTextProps) {
  const elementRef = useRef<HTMLSpanElement>(null);
  const instanceRef = useRef<any>(null);
  const optionsKey = JSON.stringify(options);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Clean up previous instance
    if (instanceRef.current) {
      try {
        instanceRef.current.destroy();
      } catch (error) {
        // TypeIt can throw if the element is already gone (e.g. during fast navigation)
        console.warn("[TypeItText] destroy skipped", error);
      }
      instanceRef.current = null;
    }

    // Clear any existing text nodes to avoid stacked typing artifacts
    element.textContent = "";

    // Create new TypeIt instance
    const instance = new TypeIt(element, {
      strings,
      speed,
      loop,
      loopDelay: 500,
      deleteSpeed: 50,
      nextStringDelay: 200,
      ...options,
    });

    instance.go();
    instanceRef.current = instance;

    return () => {
      if (instanceRef.current) {
        try {
          instanceRef.current.destroy();
        } catch (error) {
          console.warn("[TypeItText] destroy on unmount skipped", error);
        }
        instanceRef.current = null;
      }
    };
  }, [strings.join("|"), speed, loop, optionsKey]);

  return <span ref={elementRef} className={className} />;
}


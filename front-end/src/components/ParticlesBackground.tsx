"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import type { Container, Engine } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

interface ParticlesBackgroundProps {
  className?: string;
  visible?: boolean;
}

export default function ParticlesBackground({ className = "", visible = true }: ParticlesBackgroundProps) {
  const [init, setInit] = useState(false);
  const containerRef = useRef<Container | null>(null);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // 只在第一次挂载时初始化，避免重复初始化
    if (hasInitializedRef.current) return;
    
    hasInitializedRef.current = true;
    initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = useCallback(async (container: Container | undefined) => {
    if (container) {
      containerRef.current = container;
    }
  }, []);

  // 控制粒子效果的显示/隐藏（只控制播放/暂停，不重新渲染）
  useEffect(() => {
    if (containerRef.current) {
      if (visible) {
        containerRef.current.play();
      } else {
        containerRef.current.pause();
      }
    }
  }, [visible]);

  // 使用 useMemo 缓存粒子配置，避免重新渲染
  const particlesOptions = useMemo(() => {
    const isRetina = typeof window !== "undefined" && window.devicePixelRatio > 1;
    const particleDensity = isRetina ? 120 : 80;

    return {
      background: {
        color: {
          value: "transparent",
        },
      },
      fpsLimit: 120,
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: "grab",
          },
          resize: {
            enable: true,
          },
        },
        modes: {
          grab: {
            distance: isRetina ? 200 : 150,
            links: {
              opacity: 1,
              color: {
                value: "#60a5fa",
              },
            },
          },
          repulse: {
            distance: 200,
            duration: 0.4,
          },
        },
      },
      particles: {
        color: {
          value: ["#60a5fa", "#a78bfa", "#34d399", "#fbbf24"],
        },
        links: {
          color: "#60a5fa",
          distance: isRetina ? 180 : 150,
          enable: true,
          opacity: 0.3,
          width: isRetina ? 1.5 : 1,
        },
        move: {
          direction: "none",
          enable: true,
          outModes: {
            default: "bounce",
          },
          random: true,
          speed: isRetina ? 1.5 : 1,
          straight: false,
        },
        number: {
          density: {
            enable: true,
            valueArea: isRetina ? 800 : 1200,
          },
          value: particleDensity,
        },
        opacity: {
          value: { min: 0.3, max: 0.7 },
          animation: {
            enable: true,
            speed: 0.5,
            sync: false,
          },
        },
        shape: {
          type: ["circle", "triangle"],
        },
        size: {
          value: { min: isRetina ? 2 : 1, max: isRetina ? 5 : 4 },
          animation: {
            enable: true,
            speed: 2,
            sync: false,
          },
        },
      },
      detectRetina: true,
      smooth: true,
    };
  }, []);

  if (!init) {
    return null;
  }

  return (
    <div 
      className={className} 
      style={{ 
        position: "absolute", 
        top: 0, 
        left: 0, 
        width: "100%", 
        height: "100%", 
        zIndex: 0,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.5s ease-out'
      }}
    >
      <Particles
        id="tsparticles"
        particlesLoaded={particlesLoaded}
        options={particlesOptions as any}
          background: {
            color: {
              value: "transparent",
            },
          },
          fpsLimit: 120,
          interactivity: {
            events: {
              onHover: {
                enable: true,
                mode: "grab",
              },
              resize: {
                enable: true,
              },
            },
            modes: {
              grab: {
                distance: isRetina ? 200 : 150,
                links: {
                  opacity: 1,
                  color: {
                    value: "#60a5fa",
                  },
                },
              },
              repulse: {
                distance: 200,
                duration: 0.4,
              },
            },
          },
          particles: {
            color: {
              value: ["#60a5fa", "#a78bfa", "#34d399", "#fbbf24"],
            },
            links: {
              color: "#60a5fa",
              distance: isRetina ? 180 : 150,
              enable: true,
              opacity: 0.3,
              width: isRetina ? 1.5 : 1,
            },
            move: {
              direction: "none",
              enable: true,
              outModes: {
                default: "bounce",
              },
              random: true,
              speed: isRetina ? 1.5 : 1,
              straight: false,
            },
            number: {
              density: {
                enable: true,
                valueArea: isRetina ? 800 : 1200,
              },
              value: particleDensity,
            },
            opacity: {
              value: { min: 0.3, max: 0.7 },
              animation: {
                enable: true,
                speed: 0.5,
                sync: false,
              },
            },
            shape: {
              type: ["circle", "triangle"],
            },
            size: {
              value: { min: isRetina ? 2 : 1, max: isRetina ? 5 : 4 },
              animation: {
                enable: true,
                speed: 2,
                sync: false,
              },
            },
          },
      />
    </div>
  );
}


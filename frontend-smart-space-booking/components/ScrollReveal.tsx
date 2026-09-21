"use client";

import React, { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  animation?: "unfold" | "fade-up" | "scale" | "slide-left" | "slide-right";
  delay?: number;
  duration?: number;
  className?: string;
  as?: React.ElementType;
  threshold?: number;
  once?: boolean;
}

export function ScrollReveal({
  children,
  animation = "unfold",
  delay = 0,
  duration = 700,
  className = "",
  as: Component = "div",
  threshold = 0.15,
  once = true,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once && domRef.current) {
              observer.unobserve(domRef.current);
            }
          } else if (!once) {
            setIsVisible(false);
          }
        });
      },
      {
        threshold,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    const currentElem = domRef.current;
    if (currentElem) {
      observer.observe(currentElem);
    }

    return () => {
      if (currentElem) {
        observer.unobserve(currentElem);
      }
    };
  }, [threshold, once]);

  const animationClass = {
    unfold: "reveal-unfold",
    "fade-up": "reveal-fade-up",
    scale: "reveal-scale",
    "slide-left": "reveal-slide-left",
    "slide-right": "reveal-slide-right",
  }[animation];

  return (
    <Component
      ref={domRef}
      className={`reveal-base ${animationClass} ${isVisible ? "is-visible" : ""} ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </Component>
  );
}

"use client";

import { useEffect, useRef, type ReactNode } from "react";
import clsx from "clsx";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Delay in ms before the animation starts */
  delay?: number;
  /** Animation variant */
  variant?: "up" | "left" | "right" | "scale" | "fade";
  /** How far into the viewport before triggering (0-1) */
  threshold?: number;
  /** Tag to render */
  as?: "div" | "section" | "footer" | "h2" | "p" | "span";
  style?: React.CSSProperties;
}

export default function ScrollReveal({
  children,
  className,
  delay = 0,
  variant = "up",
  threshold = 0.15,
  as: Tag = "div",
  style,
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Add revealed class after optional delay
          if (delay > 0) {
            setTimeout(() => el.classList.add("sr-visible"), delay);
          } else {
            el.classList.add("sr-visible");
          }
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, threshold]);

  return (
    <Tag
      ref={ref as never}
      className={clsx(`sr sr-${variant}`, className)}
      style={style}
    >
      {children}
    </Tag>
  );
}

/** Convenience wrapper for staggering multiple children */
export function ScrollRevealGroup({
  children,
  className,
  stagger = 100,
  variant = "up",
  as: Tag = "div",
}: {
  children: ReactNode[];
  className?: string;
  stagger?: number;
  variant?: ScrollRevealProps["variant"];
  as?: "div" | "section";
}) {
  return (
    <Tag className={className}>
      {children.map((child, i) => (
        <ScrollReveal key={i} delay={i * stagger} variant={variant}>
          {child}
        </ScrollReveal>
      ))}
    </Tag>
  );
}

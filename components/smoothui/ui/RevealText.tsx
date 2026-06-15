import React from "react";
import { motion, useInView } from "motion/react";

interface RevealTextProps {
  children: string;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  triggerOnView?: boolean;
  className?: string;
}

const directionVariants = {
  up: { y: 24, opacity: 0, filter: "blur(8px)" },
  down: { y: -24, opacity: 0, filter: "blur(8px)" },
  left: { x: 24, opacity: 0, filter: "blur(8px)" },
  right: { x: -24, opacity: 0, filter: "blur(8px)" },
};

const RevealText: React.FC<RevealTextProps> = ({
  children,
  direction = "up",
  delay = 0,
  triggerOnView = false,
  className = "",
}) => {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const animate = !triggerOnView || inView;

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={directionVariants[direction]}
      animate={
        animate
          ? {
              x: 0,
              y: 0,
              opacity: 1,
              filter: "blur(0px)",
            }
          : undefined
      }
      transition={{
        duration: 0.6, // Unified duration for all properties
        delay: delay / 1000, // Unified delay for all properties
        ease: "easeInOut", // Smooth easing for parallel animations
      }}
      style={{ display: "inline-block" }}
    >
      {children}
    </motion.span>
  );
};

export default RevealText;

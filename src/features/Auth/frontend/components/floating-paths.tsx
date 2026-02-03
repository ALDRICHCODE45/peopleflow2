"use client";
import { memo, useMemo } from "react";
import { motion } from "motion/react";

export const FloatingPaths = memo(function FloatingPaths({
  position,
}: {
  position: number;
}) {
  const paths = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        d: `M-${380 - i * 7 * position} -${189 + i * 9}C-${
          380 - i * 7 * position
        } -${189 + i * 9} -${312 - i * 7 * position} ${216 - i * 9} ${
          152 - i * 7 * position
        } ${343 - i * 9}C${616 - i * 7 * position} ${470 - i * 9} ${
          684 - i * 7 * position
        } ${875 - i * 9} ${684 - i * 7 * position} ${875 - i * 9}`,
        width: 0.5 + i * 0.03,
      })),
    [position]
  );

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg
        className="h-full w-full text-slate-950 dark:text-white"
        fill="none"
        viewBox="0 0 696 316"
        aria-hidden="true"
        role="presentation"
      >
        {paths.map((path) => (
          <motion.path
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.6, 0.3],
              pathOffset: [0, 1, 0],
            }}
            d={path.d}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            key={path.id}
            stroke="currentColor"
            strokeOpacity={0.1 + path.id * 0.03}
            strokeWidth={path.width}
            transition={{
              duration: 20 + (path.id % 10),
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  );
});

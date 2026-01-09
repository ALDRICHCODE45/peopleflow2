"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Moon, Sun } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import { cn } from "@/core/lib/utils";

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number;
}

export const ThemeToogle = ({
  className,
  duration = 400,
  ...props
}: AnimatedThemeTogglerProps) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isDark, setIsDark] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  // Detectar si estamos usando next-themes o no
  const hasThemeProvider = theme !== undefined;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const updateTheme = () => {
      if (hasThemeProvider) {
        // Si usamos next-themes, usar resolvedTheme
        setIsDark(resolvedTheme === "dark");
      } else {
        // Si no hay ThemeProvider, leer directamente del DOM
        setIsDark(document.documentElement.classList.contains("dark"));
      }
    };

    updateTheme();

    if (hasThemeProvider) {
      // Con next-themes, escuchar cambios del resolvedTheme
      const observer = new MutationObserver(updateTheme);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      return () => observer.disconnect();
    } else {
      // Sin ThemeProvider, usar MutationObserver directamente
      const observer = new MutationObserver(updateTheme);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      return () => observer.disconnect();
    }
  }, [mounted, hasThemeProvider, resolvedTheme]);

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current || !mounted) return;

    const newTheme = !isDark;

    // Verificar si startViewTransition está disponible
    // Usar type assertion para evitar conflictos con tipos existentes
    const doc = document as typeof document & {
      startViewTransition?: (callback?: () => void | Promise<void>) => {
        ready: Promise<void>;
        updateCallbackDone: Promise<void>;
        finished: Promise<void>;
        skipTransition: () => void;
      };
    };

    const hasViewTransition = typeof doc.startViewTransition === "function";

    if (hasViewTransition && doc.startViewTransition) {
      const transition = doc.startViewTransition(() => {
        flushSync(() => {
          if (hasThemeProvider) {
            // Actualización Manual Síncrona para la Animación
            if (newTheme) {
              document.documentElement.classList.add("dark");
            } else {
              document.documentElement.classList.remove("dark");
            }

            // Usar setTheme de next-themes
            setTheme(newTheme ? "dark" : "light");
          } else {
            // Manipular DOM directamente si no hay ThemeProvider
            setIsDark(newTheme);
            document.documentElement.classList.toggle("dark");
            localStorage.setItem("theme", newTheme ? "dark" : "light");
          }
        });
      });
      await transition.ready;
    } else {
      // Fallback si startViewTransition no está disponible
      if (hasThemeProvider) {
        setTheme(newTheme ? "dark" : "light");
      } else {
        setIsDark(newTheme);
        document.documentElement.classList.toggle("dark");
        localStorage.setItem("theme", newTheme ? "dark" : "light");
      }
      return;
    }

    const { top, left, width, height } =
      buttonRef.current.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top)
    );

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  }, [isDark, duration, mounted, hasThemeProvider, setTheme]);

  if (!mounted) {
    // Renderizar placeholder mientras se monta para evitar hydration mismatch
    return (
      <button ref={buttonRef} className={cn(className)} {...props} disabled>
        <HugeiconsIcon icon={Moon} />
        <span className="sr-only">Toggle theme</span>
      </button>
    );
  }

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(className)}
      {...props}
    >
      {isDark ? <HugeiconsIcon icon={Sun} /> : <HugeiconsIcon icon={Moon} />}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};

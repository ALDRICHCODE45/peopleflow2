"use client";
import * as React from "react";
import { Button, buttonVariants } from "./button";
import { Spinner } from "./spinner";
import { cn } from "@lib/utils";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type { VariantProps } from "class-variance-authority";

type ButtonSize = VariantProps<typeof buttonVariants>["size"];

const ICON_SIZES: ButtonSize[] = ["icon", "icon-xs", "icon-sm", "icon-lg"];

const SPINNER_SIZE_MAP: Record<NonNullable<ButtonSize>, string> = {
  xs: "size-3",
  sm: "size-3.5",
  default: "size-4",
  lg: "size-4",
  icon: "size-4",
  "icon-xs": "size-3",
  "icon-sm": "size-3.5",
  "icon-lg": "size-4",
};

const ICON_SIZE_MAP: Record<NonNullable<ButtonSize>, string> = {
  xs: "size-3",
  sm: "size-3.5",
  default: "size-4",
  lg: "size-4",
  icon: "size-4",
  "icon-xs": "size-3",
  "icon-sm": "size-3.5",
  "icon-lg": "size-4",
};

interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
  isLoading?: boolean;
  loadingText?: string;
  showLoadingText?: boolean;
  icon?: IconSvgElement;
  iconPosition?: "start" | "end";
}

function LoadingButton({
  isLoading = false,
  loadingText,
  showLoadingText,
  icon,
  iconPosition = "start",
  size = "default",
  disabled,
  children,
  className,
  ...props
}: LoadingButtonProps) {
  const isIconVariant = ICON_SIZES.includes(size);
  const spinnerSize = SPINNER_SIZE_MAP[size ?? "default"];
  const iconSize = ICON_SIZE_MAP[size ?? "default"];

  // Determinar si mostrar texto de carga
  const shouldShowLoadingText =
    !isIconVariant && loadingText && (showLoadingText ?? true);

  const renderIcon = () => {
    if (!icon) return null;
    return <HugeiconsIcon icon={icon} className={iconSize} />;
  };

  const renderContent = () => {
    if (isLoading) {
      if (isIconVariant) {
        return <Spinner className={spinnerSize} />;
      }

      return (
        <>
          <Spinner className={spinnerSize} />
          {shouldShowLoadingText && <span>{loadingText}</span>}
        </>
      );
    }

    // Estado normal
    if (isIconVariant) {
      return icon ? renderIcon() : children;
    }

    return (
      <>
        {icon && iconPosition === "start" && (
          <span data-icon="inline-start">{renderIcon()}</span>
        )}
        {children}
        {icon && iconPosition === "end" && (
          <span data-icon="inline-end">{renderIcon()}</span>
        )}
      </>
    );
  };

  return (
    <Button
      size={size}
      disabled={disabled || isLoading}
      className={cn(className)}
      {...props}
    >
      {renderContent()}
    </Button>
  );
}

export { LoadingButton, type LoadingButtonProps };

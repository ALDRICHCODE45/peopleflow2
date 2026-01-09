import { Eye, EyeIcon, EyeOff } from "@hugeicons/core-free-icons";
import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/core/lib/utils";
import {
  InputBase,
  InputBaseAdornment,
  InputBaseAdornmentButton,
  InputBaseControl,
  InputBaseInput,
} from "@shadcn/input-base";
import * as PasswordInputPrimitive from "@shadcn/password-input-primitive";

type PasswordInputProps = React.ComponentProps<
  typeof PasswordInputPrimitive.Root
> &
  React.ComponentProps<typeof InputBase>;

function PasswordInput({
  visible,
  defaultVisible,
  onVisibleChange,
  ...props
}: PasswordInputProps) {
  return (
    <PasswordInputPrimitive.Root
      visible={visible}
      defaultVisible={defaultVisible}
      onVisibleChange={onVisibleChange}
    >
      <InputBase data-slot="password-input" {...props} />
    </PasswordInputPrimitive.Root>
  );
}

function PasswordInputAdornment(
  props: React.ComponentProps<typeof InputBaseAdornment>
) {
  return <InputBaseAdornment data-slot="password-input-adornment" {...props} />;
}

function PasswordInputAdornmentButton(
  props: React.ComponentProps<typeof InputBaseAdornmentButton>
) {
  return (
    <InputBaseAdornmentButton
      data-slot="password-input-adornment-button"
      {...props}
    />
  );
}

function PasswordInputInput(
  props: React.ComponentProps<typeof PasswordInputPrimitive.Input>
) {
  return (
    <InputBaseControl>
      <PasswordInputPrimitive.Input
        data-slot="password-input-input"
        asChild
        {...props}
      >
        <InputBaseInput />
      </PasswordInputPrimitive.Input>
    </InputBaseControl>
  );
}

function PasswordInputAdornmentToggle({
  className,
  ...props
}: React.ComponentProps<typeof PasswordInputPrimitive.Toggle>) {
  return (
    <InputBaseAdornment>
      <InputBaseAdornmentButton asChild>
        <PasswordInputPrimitive.Toggle
          data-slot="password-input-adornment-toggle"
          className={cn("group", className)}
          {...props}
        >
          <HugeiconsIcon
            icon={EyeIcon}
            className="hidden size-4 group-data-[state=visible]:block"
          />
          <HugeiconsIcon
            icon={EyeOff}
            className="block size-4 group-data-[state=visible]:hidden"
          />
        </PasswordInputPrimitive.Toggle>
      </InputBaseAdornmentButton>
    </InputBaseAdornment>
  );
}

export {
  PasswordInput,
  PasswordInputAdornment,
  PasswordInputAdornmentButton,
  PasswordInputInput,
  PasswordInputAdornmentToggle,
};

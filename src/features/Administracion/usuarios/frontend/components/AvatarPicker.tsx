"use client";

import { memo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/core/shared/ui/shadcn/dialog";
import { Separator } from "@/core/shared/ui/shadcn/separator";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/core/shared/ui/shadcn/avatar";
import { Button } from "@/core/shared/ui/shadcn/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Camera01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { useModalState } from "@/core/shared/hooks";
import { cn } from "@/core/lib/utils";

const avatarOptions = Array.from({ length: 28 }, (_, i) => ({
  id: String(i + 1),
  label: `Avatar ${i + 1}`,
  image: `/avatars/avatar${i + 1}.webp`,
}));

interface AvatarOptionProps {
  avatar: (typeof avatarOptions)[number];
  isSelected: boolean;
  onSelect: (image: string) => void;
}

const AvatarOption = memo(function AvatarOption({
  avatar,
  isSelected,
  onSelect,
}: AvatarOptionProps) {
  const handleClick = useCallback(() => {
    onSelect(avatar.image);
  }, [onSelect, avatar.image]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "relative size-14 rounded-full p-1 transition-[transform,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected
          ? "ring-2 ring-primary scale-110"
          : "hover:ring-2 hover:ring-muted-foreground/30 hover:scale-105",
      )}
    >
      <Avatar className="size-full">
        <AvatarImage src={avatar.image} alt={avatar.label} />
        <AvatarFallback className="text-[10px]">{avatar.id}</AvatarFallback>
      </Avatar>
      <span
        className={cn(
          "absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-opacity",
          isSelected ? "opacity-100" : "opacity-0",
        )}
      >
        <HugeiconsIcon icon={Tick02Icon} className="size-3" />
      </span>
    </button>
  );
});

interface AvatarPickerProps {
  currentAvatar: string;
  onAvatarChange: (value: string) => void;
}

export const AvatarPicker = memo(function AvatarPicker({
  currentAvatar,
  onAvatarChange,
}: AvatarPickerProps) {
  const { isOpen, openModal, closeModal } = useModalState();

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        openModal();
      } else {
        closeModal();
      }
    },
    [openModal, closeModal],
  );

  const handleSelect = useCallback(
    (image: string) => {
      onAvatarChange(image);
      closeModal();
    },
    [onAvatarChange, closeModal],
  );

  const handleClear = useCallback(() => {
    onAvatarChange("");
    closeModal();
  }, [onAvatarChange, closeModal]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange} modal={false}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Avatar className="size-20 ring-2 ring-border transition-[transform,box-shadow] group-hover:ring-primary/50 group-hover:scale-105">
            {currentAvatar ? (
              <AvatarImage src={currentAvatar} alt="Avatar seleccionado" />
            ) : (
              <AvatarFallback className="bg-muted text-muted-foreground">
                <HugeiconsIcon icon={Camera01Icon} className="size-6" />
              </AvatarFallback>
            )}
          </Avatar>
          <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-110">
            <HugeiconsIcon icon={Camera01Icon} className="size-3.5" />
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Elige un avatar</DialogTitle>
        </DialogHeader>
        <Separator />
        <div className="grid grid-cols-5 gap-3 py-2">
          {avatarOptions.map((avatar) => (
            <AvatarOption
              key={avatar.id}
              avatar={avatar}
              isSelected={currentAvatar === avatar.image}
              onSelect={handleSelect}
            />
          ))}
        </div>
        {currentAvatar && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mx-auto w-fit text-muted-foreground"
            onClick={handleClear}
          >
            Quitar avatar
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
});

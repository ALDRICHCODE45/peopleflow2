"use client";

import { useState, useCallback } from "react";

/**
 * Consolidated modal state hook that manages multiple modal types with a single state.
 * More efficient than multiple useModalState hooks when only one modal can be open at a time.
 *
 * @template T - Union type of modal identifiers (e.g., 'edit' | 'delete' | 'reasign')
 *
 * @example
 * ```tsx
 * const modal = useMultiModalState<'edit' | 'delete' | 'reasign'>();
 *
 * // Open a specific modal
 * modal.open('edit');
 *
 * // Check if a specific modal is open
 * if (modal.isOpen('edit')) { ... }
 *
 * // Close any open modal
 * modal.close();
 * ```
 */
export function useMultiModalState<T extends string>() {
  const [openModal, setOpenModal] = useState<T | null>(null);

  const open = useCallback((type: T) => {
    setOpenModal(type);
  }, []);

  const close = useCallback(() => {
    setOpenModal(null);
  }, []);

  const isOpen = useCallback(
    (type: T) => openModal === type,
    [openModal]
  );

  return {
    /** Currently open modal type, or null if none */
    openModal,
    /** Check if a specific modal type is open */
    isOpen,
    /** Open a specific modal type */
    open,
    /** Close any open modal */
    close,
  };
}

export type UseMultiModalStateReturn<T extends string> = ReturnType<
  typeof useMultiModalState<T>
>;

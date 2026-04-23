"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

export function ClientPortal({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  if (!mounted) {
    return null;
  }

  return createPortal(children, document.body);
}

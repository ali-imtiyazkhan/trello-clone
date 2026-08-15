"use client";

import { type ReactNode } from "react";
import { ToastProvider } from "./toast";
import { ConfirmProvider } from "./confirm-dialog";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ToastProvider>
  );
}

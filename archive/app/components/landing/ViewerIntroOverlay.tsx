"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/app/components/ui/button";

type ViewerIntroOverlayProps = {
  title: string;
  description: string;
  buttonLabel: string;
  children: ReactNode;
};

export default function ViewerIntroOverlay({
  title,
  description,
  buttonLabel,
  children,
}: ViewerIntroOverlayProps) {
  const [isActive, setIsActive] = useState(true);

  return (
    <div className="relative">
      <div
        className={[
          "transition-all duration-300",
          isActive ? "pointer-events-none blur-sm" : "pointer-events-auto",
        ].join(" ")}
      >
        {children}
      </div>
      {isActive && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="mx-6 max-w-md rounded-3xl border border-[var(--border)] bg-[var(--background)]/90 p-6 text-[var(--foreground)] shadow-[0_30px_80px_-50px_rgba(0,0,0,0.5)] backdrop-blur">
            <div className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--muted)]">
              Viewer Overview
            </div>
            <div className="mt-3 text-xl font-semibold">{title}</div>
            <div className="mt-2 text-sm text-[var(--muted)]">{description}</div>
            <div className="mt-5">
              <Button onClick={() => setIsActive(false)}>{buttonLabel}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

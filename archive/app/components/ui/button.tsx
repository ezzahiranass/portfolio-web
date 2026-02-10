"use client";

import * as React from "react";
import { cn } from "@/app/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--foreground)] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[var(--background)] transition-colors hover:opacity-90",
        className
      )}
      {...props}
    />
  )
);

Button.displayName = "Button";

export { Button };

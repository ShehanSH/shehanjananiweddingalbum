import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger" | "ivory";

const styles: Record<Variant, string> = {
  primary:
    "bg-brown text-ivory hover:bg-brown-soft disabled:opacity-50",
  ghost:
    "border border-brown/20 text-brown hover:bg-cream disabled:opacity-50",
  danger: "bg-blush text-brown hover:opacity-90 disabled:opacity-50",
  ivory: "bg-ivory text-brown border border-brown/10 hover:bg-cream disabled:opacity-50",
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm tracking-[0.08em] uppercase transition-colors",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}

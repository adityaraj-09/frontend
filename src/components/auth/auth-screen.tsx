import Link from "next/link";
import type { ReactNode } from "react";
import { MagicaWordmark } from "@/components/brand/magica-mark";

export function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4">
      <Link href="/" className="mb-8 text-[22px] text-foreground" aria-label="Magica home">
        <MagicaWordmark />
      </Link>
      {children}
    </div>
  );
}

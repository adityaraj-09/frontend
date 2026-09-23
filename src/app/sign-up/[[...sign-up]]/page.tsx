"use client";

import { SignUp } from "@clerk/nextjs";
import { AuthScreen } from "@/components/auth/auth-screen";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { clerkConfigured } from "@/lib/clerk-config";

export default function SignUpPage() {
  return (
    <AuthScreen>
      {clerkConfigured ? (
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/"
          appearance={clerkAppearance}
        />
      ) : (
        <p className="max-w-sm text-center text-[14px] font-medium leading-6 text-muted-foreground">
          Add <code className="text-foreground">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
          <code className="text-foreground">CLERK_SECRET_KEY</code> to <code className="text-foreground">frontend/.env</code>{" "}
          to load Clerk sign up.
        </p>
      )}
    </AuthScreen>
  );
}

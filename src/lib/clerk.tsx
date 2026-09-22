"use client";

import {
  ClerkProvider as RealClerkProvider,
  SignInButton as RealSignInButton,
  SignUpButton as RealSignUpButton,
  useAuth as realUseAuth,
  useClerk as realUseClerk,
  useUser as realUseUser,
} from "@clerk/nextjs";
import Link from "next/link";
import type { ReactNode } from "react";

import { clerkAppearance } from "./clerk-appearance";
import { clerkConfigured } from "./clerk-config";

export function ClerkProvider({ children }: { children: ReactNode }) {
  if (!clerkConfigured) return children;
  return (
    <RealClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      afterSignOutUrl="/"
      appearance={clerkAppearance}
    >
      {children}
    </RealClerkProvider>
  );
}

export function SignedIn({ children }: { children: ReactNode }) {
  if (!clerkConfigured) return null;
  return <AuthGate mode="signed-in">{children}</AuthGate>;
}

export function SignedOut({ children }: { children: ReactNode }) {
  if (!clerkConfigured) return children;
  return <AuthGate mode="signed-out">{children}</AuthGate>;
}

function AuthGate({
  mode,
  children,
}: {
  mode: "signed-in" | "signed-out";
  children: ReactNode;
}) {
  const { isLoaded, isSignedIn } = realUseAuth();
  if (!isLoaded) return null;
  const visible = mode === "signed-in" ? Boolean(isSignedIn) : !isSignedIn;
  if (!visible) return null;
  return children;
}

export function SignInButton({
  children,
}: {
  mode?: string;
  children: ReactNode;
}) {
  if (!clerkConfigured) {
    return (
      <Link href="/sign-in" className="contents">
        {children}
      </Link>
    );
  }
  return <RealSignInButton mode="redirect">{children}</RealSignInButton>;
}

export function SignUpButton({
  children,
}: {
  mode?: string;
  children: ReactNode;
}) {
  if (!clerkConfigured) {
    return (
      <Link href="/sign-up" className="contents">
        {children}
      </Link>
    );
  }
  return <RealSignUpButton mode="redirect">{children}</RealSignUpButton>;
}

export function useUser() {
  if (!clerkConfigured) {
    return { isSignedIn: false, isLoaded: true, user: null };
  }
  return realUseUser();
}

export function useClerk() {
  if (!clerkConfigured) {
    return {
      openSignIn: () => go("/sign-in"),
      openSignUp: () => go("/sign-up"),
      openUserProfile: () => undefined,
      signOut: async () => undefined,
    };
  }
  const clerk = realUseClerk();
  return {
    ...clerk,
    openSignIn: () => go("/sign-in"),
    openSignUp: () => go("/sign-up"),
  };
}

function go(path: string) {
  if (typeof window !== "undefined") window.location.assign(path);
}

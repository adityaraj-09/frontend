export const clerkAppearance = {
  variables: {
    colorPrimary: "var(--foreground)",
    colorText: "var(--foreground)",
    colorTextSecondary: "var(--muted-foreground)",
    colorBackground: "var(--background)",
    colorInputBackground: "var(--muted)",
    colorInputText: "var(--foreground)",
    colorDanger: "var(--destructive)",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-magica), Arial, sans-serif",
  },
  elements: {
    rootBox: "mx-auto",
    card: "shadow-none border border-border rounded-2xl bg-background",
    headerTitle: "text-foreground text-[18px] font-bold",
    headerSubtitle: "text-muted-foreground font-semibold",
    socialButtonsBlockButton: "border-border",
    formButtonPrimary: "bg-foreground hover:opacity-90 text-background shadow-none",
    footerActionLink: "text-foreground",
  },
} as const;

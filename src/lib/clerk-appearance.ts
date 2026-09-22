export const clerkAppearance = {
  variables: {
    colorPrimary: "#1b1b1b",
    colorText: "#1b1b1b",
    colorTextSecondary: "#404040",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#1b1b1b",
    colorDanger: "#b42318",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-magica), Arial, sans-serif",
  },
  elements: {
    rootBox: "mx-auto",
    card: "shadow-none border border-[#ededed] rounded-2xl",
    headerTitle: "text-[#1b1b1b] text-[18px] font-bold",
    headerSubtitle: "text-[#404040] font-semibold",
    socialButtonsBlockButton: "border-[#ededed]",
    formButtonPrimary: "bg-[#1b1b1b] hover:bg-black text-white shadow-none",
    footerActionLink: "text-[#1b1b1b]",
  },
} as const;

import { cn } from "@/lib/utils";

export function MagicaRobot({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M16 95V44C16 31 27 23 39 27C43 17 57 14 65 22C75 14 91 20 91 33C101 34 107 42 105 52C104 59 100 63 96 66V95C96 104 90 108 84 108C77 108 72 103 72 95V72L67 80C63 87 56 87 52 80L47 72V95C47 104 41 108 32 108C23 108 16 103 16 95Z"
        fill="#4F46E5"
      />
      <ellipse cx="42" cy="51" rx="12" ry="13" fill="white" />
      <ellipse cx="78" cy="51" rx="12" ry="13" fill="white" />
      <circle cx="42" cy="51" r="3.6" fill="#202024" />
      <circle cx="78" cy="51" r="3.6" fill="#202024" />
    </svg>
  );
}

export function MagicaMark({ className }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M1.2 10.5V3.4C1.2 2.3 2 1.7 2.9 2C3.2 1.1 4.3.9 5 1.6C5.8.9 7.1 1.3 7.1 2.4C7.9 2.45 8.4 3.1 8.25 3.9C8.15 4.5 7.8 4.85 7.5 5.1V10.5C7.5 11.2 7.05 11.5 6.55 11.5C6 11.5 5.6 11.1 5.6 10.5V7.4L5.2 8.1C4.9 8.7 4.3 8.7 4 8.1L3.6 7.4V10.5C3.6 11.2 3.15 11.5 2.4 11.5C1.7 11.5 1.2 11.1 1.2 10.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function MagicaWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("text-[18px] font-semibold leading-5 tracking-[-0.03em] text-[#1b1b1b]", className)}>
      Magica
    </span>
  );
}

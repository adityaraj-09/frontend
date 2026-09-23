"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  BookOpen,
  Brain,
  Building2,
  ChevronRight,
  CircleHelp,
  CreditCard,
  ExternalLink,
  KeyRound,
  Keyboard,
  LifeBuoy,
  Plug,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UserRound,
  Video,
  X,
} from "lucide-react";
import { useClerk, useUser } from "@/lib/clerk";
import { useMeQuery } from "@/hooks/use-queries";
import { formatCredits } from "@/lib/format";
import { useSettingsStore, type DefaultModel, type ReplyLanguage } from "@/stores/settings";
import { useThemeStore, type ThemeChoice } from "@/stores/theme";
import { useUiStore } from "@/stores/ui";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { KeysManageDialog } from "./keys-manage-dialog";

const NAV = [
  { id: "account", label: "Account", icon: UserRound },
  { id: "general", label: "General", icon: Settings },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
  { id: "personalization", label: "Personalization", icon: Sparkles },
  { id: "memory", label: "Memory", icon: Brain },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "api-keys", label: "API Keys", icon: KeyRound },
  { id: "resources", label: "Resources", icon: CircleHelp },
  { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
] as const;

export function SettingsDialog() {
  const open = useUiStore((s) => s.settingsOpen);
  const tab = useUiStore((s) => s.settingsTab);
  const setOpen = useUiStore((s) => s.setSettingsOpen);
  const setTab = useUiStore((s) => s.setSettingsTab);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[min(720px,88vh)] w-[min(920px,94vw)] max-w-none flex-col gap-0 overflow-hidden rounded-[28px] bg-background p-0 text-foreground sm:max-w-none"
      >
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <div className="flex min-h-0 flex-1">
          <aside className="flex w-[220px] shrink-0 flex-col border-r border-border px-3 py-3">
            <button
              type="button"
              aria-label="Close settings"
              className="mb-3 flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </button>
            <nav className="flex flex-col gap-0.5">
              {NAV.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-full px-3 text-left text-[13px] font-semibold text-muted-foreground",
                    tab === item.id
                      ? "bg-muted text-foreground"
                      : "hover:bg-muted/70 hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4" strokeWidth={1.75} />
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>
          <div className="relative flex min-w-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
              {tab === "account" ? <AccountPanel /> : null}
              {tab === "general" ? <GeneralPanel /> : null}
              {tab === "billing" ? <BillingPanel /> : null}
              {tab === "preferences" ? <PreferencesPanel /> : null}
              {tab === "personalization" ? <PersonalizationPanel /> : null}
              {tab === "memory" ? <MemoryPanel /> : null}
              {tab === "integrations" ? <IntegrationsPanel /> : null}
              {tab === "api-keys" ? <ApiKeysPanel /> : null}
              {tab === "resources" ? <ResourcesPanel /> : null}
              {tab === "shortcuts" ? <ShortcutsPanel /> : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AccountPanel() {
  const router = useRouter();
  const { user } = useUser();
  const { openUserProfile, signOut } = useClerk();
  const email = user?.primaryEmailAddress?.emailAddress ?? "—";

  return (
    <div>
      <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Account</h2>
      <Row
        title="Profile and security"
        body="Manage your profile, sign-in methods, and two-step verification"
        action={
          <span className="inline-flex items-center gap-1.5">
            Open profile
            <ExternalLink className="size-3.5" />
          </span>
        }
        onClick={() => openUserProfile?.()}
      />
      <Row title="Email" action={<span className="text-[13px] font-medium">{email}</span>} />
      <Row
        title="Subscription"
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[12px] font-semibold">
            <span className="size-1.5 rounded-full bg-[#22c55e]" />
            Active
          </span>
        }
      />
      <Row
        title="Create Organization"
        body="Start collaborating with your team"
        action={
          <span className="inline-flex items-center gap-1.5">
            Create
            <Building2 className="size-3.5" />
          </span>
        }
      />
      <h3 className="mt-8 text-[13px] font-semibold text-muted-foreground">Account Actions</h3>
      <Row
        title="Password"
        body="Change your account password"
        action={
          <span className="inline-flex items-center gap-1.5">
            Change
            <KeyRound className="size-3.5" />
          </span>
        }
        onClick={() => openUserProfile?.()}
      />
      <Row
        title="Sign Out"
        body="Sign out of your account"
        action={
          <span className="inline-flex items-center gap-1.5">
            Sign out
            <ExternalLink className="size-3.5" />
          </span>
        }
        onClick={() => {
          void signOut({ redirectUrl: "/" });
          router.push("/");
        }}
      />
      <Row
        title="Permanently delete account"
        body="Revoke access and stop eligible web billing"
        danger
        action={
          <span className="inline-flex items-center gap-1.5">
            Delete
            <Trash2 className="size-3.5" />
          </span>
        }
        onClick={() => {
          if (!user || !window.confirm("Permanently delete this account?")) return;
          void user.delete().then(() => router.push("/"));
        }}
        filledDanger
      />
    </div>
  );
}

function GeneralPanel() {
  const savedModel = useSettingsStore((s) => s.defaultModel);
  const savedLanguage = useSettingsStore((s) => s.language);
  const setGeneral = useSettingsStore((s) => s.setGeneral);
  const [model, setModel] = useState<DefaultModel>(savedModel);
  const [language, setLanguage] = useState<ReplyLanguage>(savedLanguage);

  useEffect(() => {
    setModel(savedModel);
    setLanguage(savedLanguage);
  }, [savedModel, savedLanguage]);

  return (
    <div className="flex min-h-full flex-col">
      <h2 className="text-[22px] font-semibold tracking-[-0.03em]">General</h2>
      <div className="flex-1">
        <Field
          title="Default AI Model"
          body="This model will be used for all new tasks"
          control={
            <Select value={model} onChange={(value) => setModel(value as DefaultModel)}>
              <option value="magica-auto">Magica Auto</option>
            </Select>
          }
        />
        <Field
          title="Language"
          body="This language will be preferred by the model when responding to you"
          control={
            <Select value={language} onChange={(value) => setLanguage(value as ReplyLanguage)}>
              <option value="auto">Auto-detect</option>
              <option value="en">English</option>
            </Select>
          }
        />
      </div>
      <div className="flex justify-end gap-2 pt-8">
        <button
          type="button"
          className="inline-flex h-9 items-center rounded-full border border-border px-4 text-[13px] font-semibold"
          onClick={() => {
            setModel(savedModel);
            setLanguage(savedLanguage);
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          className="inline-flex h-9 items-center rounded-full bg-foreground px-4 text-[13px] font-semibold text-background"
          onClick={() => setGeneral({ defaultModel: model, language })}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}

function BillingPanel() {
  const { data: me } = useMeQuery();
  return (
    <div>
      <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Billing</h2>
      <Row title="Available credits" action={formatCredits(me?.creditBalance ?? "0")} />
      <Row
        title="Subscription"
        body="OpenRouter Free · Magica tools settle once"
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[12px] font-semibold">
            <span className="size-1.5 rounded-full bg-[#22c55e]" />
            Active
          </span>
        }
      />
    </div>
  );
}

function PreferencesPanel() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  return (
    <div>
      <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Preferences</h2>
      <h3 className="mt-6 text-[13px] font-semibold text-muted-foreground">General Preferences</h3>
      <Row
        title="Theme"
        action={
          <Select value={theme} onChange={(value) => setTheme(value as ThemeChoice)}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </Select>
        }
      />
      <Row title="Language" action={<span className="text-[13px] font-medium text-muted-foreground">Coming soon</span>} />
      <Row
        title="Mobile App"
        body="Access Magica on your mobile device"
        action={
          <span className="inline-flex items-center gap-1.5">
            Download
            <ExternalLink className="size-3.5" />
          </span>
        }
        href="https://magica.com"
      />
    </div>
  );
}

function PersonalizationPanel() {
  return (
    <div>
      <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Personalization</h2>
      <p className="mt-6 text-[14px] font-medium leading-6 text-muted-foreground">
        Custom instructions for how Magica should reply live on each project. Open a project to add
        them there.
      </p>
    </div>
  );
}

function MemoryPanel() {
  return (
    <div>
      <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Memory</h2>
      <p className="mt-6 text-[14px] font-medium leading-6 text-muted-foreground">
        Project memory stays on the project. Turn it on when you create or open a workspace so later
        chats can reuse that context.
      </p>
    </div>
  );
}

function IntegrationsPanel() {
  return (
    <div>
      <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Integrations</h2>
      <Row
        title="API / MCP"
        body="Public REST routes and the MCP server use the same API keys"
        action={
          <span className="inline-flex items-center gap-1.5">
            Open
            <ChevronRight className="size-3.5" />
          </span>
        }
        href="/api-docs"
      />
    </div>
  );
}

function ApiKeysPanel() {
  const [manageOpen, setManageOpen] = useState(false);
  return (
    <div>
      <h2 className="text-[22px] font-semibold tracking-[-0.03em]">API Keys</h2>
      <Row
        title="Generate, label, and revoke API keys for programmatic access to your account. Use these keys with the public REST API or MCP server."
        action={
          <span className="inline-flex items-center gap-1.5">
            <KeyRound className="size-3.5" />
            Manage
            <ChevronRight className="size-3.5" />
          </span>
        }
        onClick={() => setManageOpen(true)}
      />
      <Row
        title="API documentation"
        body="Review REST API and MCP usage before creating production keys."
        icon={<BookOpen className="size-4 text-muted-foreground" />}
        action={
          <span className="inline-flex items-center gap-1.5">
            View
            <ExternalLink className="size-3.5" />
          </span>
        }
        href="/api-docs"
      />
      <KeysManageDialog open={manageOpen} onOpenChange={setManageOpen} />
    </div>
  );
}

function ResourcesPanel() {
  return (
    <div>
      <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Resources</h2>
      <h3 className="mt-6 text-[13px] font-semibold text-muted-foreground">Help & Support</h3>
      <Row
        title="Help Center"
        body="Browse FAQs and documentation"
        action={
          <span className="inline-flex items-center gap-1.5">
            Visit
            <ExternalLink className="size-3.5" />
          </span>
        }
        href="/help"
      />
      <Row
        title="Video Tutorials"
        body="Watch step-by-step guides on YouTube"
        action={
          <span className="inline-flex items-center gap-1.5">
            Watch
            <Video className="size-3.5" />
          </span>
        }
        href="https://www.youtube.com/results?search_query=magica+ai"
      />
      <Row
        title="Contact Support"
        body="Get help from our support team"
        action={
          <span className="inline-flex items-center gap-1.5">
            Contact
            <LifeBuoy className="size-3.5" />
          </span>
        }
        href="mailto:support@magica.com"
      />
      <h3 className="mt-8 text-[13px] font-semibold text-muted-foreground">Community</h3>
      <Row
        title="Feature Requests"
        body="Suggest new features and vote on ideas"
        action="Submit"
        href="https://help.magica.com"
      />
      <Row
        title="Community Forum"
        body="Connect with other Magica users"
        action={<span className="text-[13px] font-medium text-muted-foreground">Coming Soon</span>}
      />
    </div>
  );
}

function ShortcutsPanel() {
  return (
    <div>
      <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Shortcuts</h2>
      <Row title="New task" action={<Kbd>N</Kbd>} />
      <Row title="Search tasks" action={<Kbd>/</Kbd>} />
      <Row title="Send message" action={<Kbd>Enter</Kbd>} />
      <Row title="New line" action={<Kbd>Shift + Enter</Kbd>} />
    </div>
  );
}

function Row({
  title,
  body,
  action,
  onClick,
  href,
  icon,
  danger,
  filledDanger,
}: {
  title: string;
  body?: string;
  action: ReactNode;
  onClick?: () => void;
  href?: string;
  icon?: ReactNode;
  danger?: boolean;
  filledDanger?: boolean;
}) {
  const pill = (
    <span
      className={cn(
        "inline-flex h-8 shrink-0 items-center rounded-full border border-border bg-background px-3 text-[13px] font-semibold",
        filledDanger && "border-transparent bg-[#e11d48] text-white",
      )}
    >
      {action}
    </span>
  );

  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/70 py-4">
      <div className="flex min-w-0 items-start gap-2">
        {icon}
        <div>
          <p className={cn("text-[14px] font-semibold", danger && "text-[#e11d48]")}>{title}</p>
          {body ? <p className="mt-0.5 text-[13px] font-medium text-muted-foreground">{body}</p> : null}
        </div>
      </div>
      {href ? (
        <Link href={href} className="shrink-0" target={href.startsWith("http") || href.startsWith("mailto:") ? "_blank" : undefined}>
          {pill}
        </Link>
      ) : onClick ? (
        <button type="button" className="shrink-0" onClick={onClick}>
          {pill}
        </button>
      ) : (
        <span className="shrink-0">{typeof action === "string" ? pill : action}</span>
      )}
    </div>
  );
}

function Field({
  title,
  body,
  control,
}: {
  title: string;
  body: string;
  control: ReactNode;
}) {
  return (
    <div className="border-b border-border/70 py-5">
      <p className="text-[14px] font-semibold">{title}</p>
      <div className="mt-3">{control}</div>
      <p className="mt-2 text-[13px] font-medium text-muted-foreground">{body}</p>
    </div>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 w-full rounded-full border border-border bg-muted/40 px-4 text-[13px] font-semibold outline-none"
    >
      {children}
    </select>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-8 items-center rounded-full border border-border px-3 text-[12px] font-semibold">
      {children}
    </span>
  );
}

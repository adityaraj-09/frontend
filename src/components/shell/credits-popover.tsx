"use client";

import { useQuery } from "@tanstack/react-query";
import { meApi } from "@/lib/api/services";
import { queryKeys } from "@/lib/query/keys";
import { Sparkle } from "lucide-react";
import { formatCredits } from "@/lib/format";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function CreditsBadge({ balance }: { balance: string }) {
  return (
    <span className="inline-flex h-8 items-center gap-2 rounded-full border border-[#ededed] bg-[#fafafa] px-3 py-1 text-[14px] font-normal leading-5 text-[#1b1b1b]">
      <Sparkle className="size-3.5 shrink-0 text-[#343434]" strokeWidth={1.75} aria-hidden />
      {formatCredits(balance)}
    </span>
  );
}

export function CreditsPopover({ balance }: { balance: string }) {
  const ledger = useQuery({
    queryKey: queryKeys.ledger(),
    queryFn: () => meApi.ledger({ limit: 12 }),
    enabled: false,
  });

  return (
    <Popover>
      <PopoverTrigger
        className="outline-none"
        onClick={() => {
          void ledger.refetch();
        }}
      >
        <CreditsBadge balance={balance} />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-[#ededed] px-3 py-2 text-[13px] font-medium">
          Balance {formatCredits(ledger.data?.creditBalance ?? balance)}
        </div>
        <ul className="max-h-72 overflow-y-auto py-1">
          {(ledger.data?.items ?? []).map((entry) => (
            <li key={entry.id} className="flex items-start justify-between gap-3 px-3 py-2 text-[12px]">
              <div>
                <div className="text-[#1b1b1b]">{entry.reason}</div>
                <div className="text-[#a1a1aa]">{entry.type}</div>
              </div>
              <div className="tabular-nums text-[#1b1b1b]">{entry.amount}</div>
            </li>
          ))}
          {!ledger.data?.items.length ? (
            <li className="px-3 py-4 text-[12px] text-[#a1a1aa]">No ledger entries yet.</li>
          ) : null}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { waitpointApi } from "@/lib/api/services";
import type { WaitpointOverlay } from "@/lib/api/schemas";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { useState } from "react";

export function WaitpointCard({
  chatId,
  waitpoint,
}: {
  chatId: string;
  waitpoint: WaitpointOverlay;
}) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = copyFor(waitpoint);

  async function decide(decision: "approved" | "rejected") {
    setBusy(true);
    setError(null);
    try {
      await waitpointApi.complete(chatId, waitpoint.waitpointId, decision);
      await queryClient.invalidateQueries({ queryKey: ["run", chatId] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.messages(chatId) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit this decision.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#ededed] bg-[#fafafa] p-4">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-[#404040]">{copy.kicker}</p>
      <p className="mt-1 text-[14px] font-medium text-[#1b1b1b]">{copy.body}</p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" disabled={busy} onClick={() => void decide("approved")}>
          {copy.approve}
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void decide("rejected")}>
          {copy.reject}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-[12px] text-[#b42318]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function copyFor(waitpoint: WaitpointOverlay) {
  switch (waitpoint.type) {
    case "PLAN":
      return {
        kicker: "Plan",
        body: "Approve this plan to continue, or reject it to stop here.",
        approve: "Approve plan",
        reject: "Reject",
      };
    case "CREDIT":
      return {
        kicker: "Credits",
        body: "This turn needs additional credits. Continue to settle overage, or stop and keep partial work.",
        approve: "Continue",
        reject: "Stop",
      };
    case "MEDIA":
      return {
        kicker: "Media",
        body: "Approve the generated media to keep it in the thread.",
        approve: "Keep media",
        reject: "Discard",
      };
    default:
      return {
        kicker: "Approval",
        body: "Choose how to continue this task.",
        approve: "Approve",
        reject: "Reject",
      };
  }
}

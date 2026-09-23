export default function HelpPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="w-full px-6 pb-16 pt-5">
        <h1 className="text-[32px] font-semibold tracking-[-0.03em]">Help & Support</h1>
        <p className="mt-2 text-[14px] font-medium leading-6 text-[#8a8a8a]">
          Every failed turn should be explainable from the chat: status, a safe error, tool outcomes, partial output, and a retry path.
        </p>
        <dl className="mt-8 space-y-6 text-[14px] font-medium leading-6 text-[#1b1b1b]">
          <Item title="One run at a time">
            Each chat has one active turn. If send is blocked, stop the current run or wait for it to finish.
          </Item>
          <Item title="Reload and reconnect">
            Refresh or switch chats and the active run resumes from PostgreSQL. Realtime reconnects with a REST fallback if the stream drops.
          </Item>
          <Item title="Credits">
            OpenRouter Free records tokens at 0 application credits. Magica tools settle once. If a turn needs more credits, approve the credit waitpoint or stop and keep partial work.
          </Item>
          <Item title="Approvals">
            Plan mode pauses before tools. Unanswered waitpoints expire safely — send another message to continue later.
          </Item>
          <Item title="Uploads">
            Files go through Transloadit (5 GB / month, 0.5 GB per file). Failed or interrupted uploads can be retried from the composer chip.
          </Item>
          <Item title="Models and tools">
            The agent uses OpenRouter Free with no paid fallback, plus Crop Image, GPT Image 2, and Merge Videos on Magica. Temporary 429s and empty streams fail the turn with a visible error.
          </Item>
        </dl>
      </div>
    </div>
  );
}

function Item({ title, children }: { title: string; children: string }) {
  return (
    <div>
      <dt className="font-semibold">{title}</dt>
      <dd className="mt-1 text-[#404040]">{children}</dd>
    </div>
  );
}

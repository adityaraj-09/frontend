import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import { ChatImage } from "./chat-image";

const components: Components = {
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  h1: ({ children }) => <h2 className="mb-2 text-[16px] font-bold leading-6">{children}</h2>,
  h2: ({ children }) => <h2 className="mb-2 text-[16px] font-bold leading-6">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 text-[14px] font-bold leading-6">{children}</h3>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  a: ({ href, children }) => (
    <a href={href} className="text-[#2563eb] underline" target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-xl bg-[#f3f3f5] p-3 text-[13px] leading-5 last:mb-0">{children}</pre>
  ),
  code: ({ children }) => <code className="rounded bg-[#f3f3f5] px-1 text-[13px]">{children}</code>,
  img: ({ src, alt }) => (
    <ChatImage
      src={typeof src === "string" ? src : undefined}
      alt={alt}
      className="my-2 h-auto w-auto max-h-[220px] max-w-[240px] rounded-xl object-contain"
    />
  ),
};

export function MarkdownText({ text }: { text: string }) {
  return (
    <div className="text-[14px] font-medium leading-6 text-[#1b1b1b]">
      <ReactMarkdown components={components}>{text}</ReactMarkdown>
    </div>
  );
}

/** Persisted assistant text and the live token buffer are the same string once a turn is saved. */
export function mergeAssistantText(persisted: string, stream: string, live: boolean): string {
  if (!live || !stream) return persisted;
  if (!persisted) return stream;
  if (stream.startsWith(persisted)) return stream;
  if (persisted.startsWith(stream) || persisted.includes(stream)) return persisted;
  return persisted + stream;
}

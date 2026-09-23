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

export function MarkdownText({
  text,
  skipImages,
}: {
  text: string;
  skipImages?: Set<string>;
}) {
  const cleaned = skipImages?.size ? stripKnownMarkdownImages(text, skipImages) : text;
  if (!cleaned.trim()) return null;
  return (
    <div className="text-[14px] font-medium leading-6 text-[#1b1b1b]">
      <ReactMarkdown
        components={{
          ...components,
          img: ({ src, alt }) => {
            if (typeof src === "string" && skipImages?.has(normalizeMediaUrl(src))) return null;
            return (
              <ChatImage
                src={typeof src === "string" ? src : undefined}
                alt={alt}
                className="my-2 h-auto w-auto max-h-[220px] max-w-[240px] rounded-xl object-contain"
              />
            );
          },
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}

export function normalizeMediaUrl(url: string): string {
  return url.trim().split("?")[0] ?? url;
}

export function stripKnownMarkdownImages(text: string, urls: Set<string>): string {
  let next = text;
  for (const url of urls) {
    const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    next = next.replace(new RegExp(`!\\[[^\\]]*\\]\\(${escaped}[^)]*\\)`, "gi"), "");
    next = next.replace(new RegExp(`(?:^|\\n)\\s*${escaped}\\s*(?=\\n|$)`, "gi"), "\n");
  }
  return next.replace(/\n{3,}/g, "\n\n").trim();
}

/** Persisted assistant text and the live token buffer are the same string once a turn is saved. */
export function mergeAssistantText(persisted: string, stream: string, live: boolean): string {
  if (!live || !stream) return persisted;
  if (!persisted) return stream;
  if (stream.startsWith(persisted)) return stream;
  if (persisted.startsWith(stream) || persisted.includes(stream)) return persisted;
  return persisted + stream;
}

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";
import { applyLiveAssistant } from "@/hooks/use-messages";
import { MessageList } from "./message-list";
import type { Message } from "@/lib/api/schemas";

beforeAll(() => {
  for (const [prop, value] of [
    ["offsetHeight", 640],
    ["offsetWidth", 760],
    ["clientHeight", 640],
    ["clientWidth", 760],
  ] as const) {
    Object.defineProperty(HTMLElement.prototype, prop, {
      configurable: true,
      get() {
        return value;
      },
    });
  }
});

function msg(id: string, role: "USER" | "ASSISTANT", text: string): Message {
  return {
    id,
    chatId: "11111111-1111-1111-1111-111111111111",
    role,
    status: "COMPLETED",
    contentBlocks: [{ type: "text", text }],
    createdAt: "2026-09-21T10:00:00.000Z",
    errorCode: null,
    errorMessage: null,
    attachments: [],
  };
}

describe("MessageList", () => {
  it("virtualizes turns so the latest messages still render", () => {
    const messages = Array.from({ length: 40 }, (_, index) =>
      msg(
        `${index.toString().padStart(8, "0")}-1111-1111-1111-111111111111`,
        index % 2 === 0 ? "USER" : "ASSISTANT",
        `Turn ${index}`,
      ),
    );
    render(
      <div style={{ height: 640 }}>
        <MessageList messages={messages} streamText="" hasEarlier />
      </div>,
    );
    expect(screen.getByRole("button", { name: "Load earlier messages" })).toBeInTheDocument();
    expect(screen.getByText("Turn 0")).toBeInTheDocument();
    expect(screen.queryByText("Turn 39")).not.toBeInTheDocument();
  });

  it("renders assistant markdown once when the stream repeats the saved text", () => {
    const text = "1. **Analyze the image**";
    render(
      <div style={{ height: 640 }}>
        <MessageList
          messages={[msg("aaaaaaaa-1111-1111-1111-111111111111", "ASSISTANT", text)]}
          streamText={text}
          snapshot={{ assistantMessageId: "aaaaaaaa-1111-1111-1111-111111111111", status: "COMPLETE" }}
        />
      </div>,
    );
    expect(screen.getAllByText("Analyze the image")).toHaveLength(1);
    expect(screen.getByText("Analyze the image").tagName).toBe("STRONG");
  });

  it("shows turn cost and token usage on a finished reply", () => {
    const message = msg("aaaaaaaa-1111-1111-1111-111111111111", "ASSISTANT", "Done");
    message.usage = {
      promptTokens: 12,
      completionTokens: 8,
      credits: "0",
      model: "deepseek/deepseek-r1:free",
      durationMs: 2400,
    };
    render(
      <div style={{ height: 640 }}>
        <MessageList messages={[message]} streamText="" />
      </div>,
    );
    expect(screen.getByText("2.4s · 20 tokens · 0 credits · deepseek-r1")).toBeInTheDocument();
  });

  it("shows the uploaded image inside the user bubble", () => {
    const message = msg("bbbbbbbb-1111-1111-1111-111111111111", "USER", "crop the right part of the image");
    message.attachments = [
      {
        id: "cccccccc-1111-1111-1111-111111111111",
        filename: "shot.png",
        mimeType: "image/png",
        url: "https://cdn.example/shot.png",
        status: "COMPLETE",
      },
    ];
    render(
      <div style={{ height: 640 }}>
        <MessageList messages={[message]} streamText="" />
      </div>,
    );
    const image = screen.getByRole("img", { name: "shot.png" });
    expect(image).toHaveAttribute("src", "https://cdn.example/shot.png");
    expect(screen.getByText("crop the right part of the image")).toBeInTheDocument();
  });

  it("shows a generated image only once when the reply embeds the same URL", async () => {
    const url = "https://cdn.example/out.png";
    const message = msg("aaaaaaaa-1111-1111-1111-111111111111", "ASSISTANT", "");
    message.contentBlocks = [
      {
        type: "tool_use",
        toolCallId: "call_1",
        toolName: "gpt_image_2",
        input: { prompt: "a mountain" },
      },
      {
        type: "tool_result",
        toolCallId: "call_1",
        toolName: "gpt_image_2",
        output: { image_url: url },
      },
      { type: "asset", url, mimeType: "image/png", filename: "out.png" },
      {
        type: "text",
        text: `Here's a mountain landscape:\n\n![](${url})\n\nSnowy peaks and a lake.`,
      },
    ];
    render(
      <div style={{ height: 640 }}>
        <MessageList messages={[message]} streamText="" />
      </div>,
    );
    expect(screen.getByText("Output Image")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Output Image" })).toHaveAttribute("src", url);
    const image = screen.getByRole("img", { name: "out.png" });
    const caption = screen.getByText("Here's a mountain landscape:");
    expect(image.compareDocumentPosition(caption) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    expect(screen.getByText("Snowy peaks and a lake.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Preview out.png" }));
    const dialog = screen.getByRole("dialog", { name: "Image Preview" });
    expect(within(dialog).getByText("a mountain")).toBeInTheDocument();
    expect(within(dialog).queryByText("Here's a mountain landscape:")).not.toBeInTheDocument();
    expect(within(dialog).getByRole("img", { name: "out.png" })).toHaveClass("max-w-full");
    expect(within(dialog).getByRole("img", { name: "out.png" })).not.toHaveClass("max-w-[280px]");
  });

  it("shows generated image and URL from live snapshot blocks without a refresh", () => {
    const message = msg("aaaaaaaa-1111-1111-1111-111111111111", "ASSISTANT", "");
    message.status = "STREAMING";
    message.contentBlocks = [];
    const live = applyLiveAssistant([message], {
      chatId: message.chatId,
      assistant: {
        id: message.id,
        status: "STREAMING",
        contentBlocks: [
          { type: "text", text: "Here is the crop." },
          { type: "asset", url: "https://cdn.example/out.png", mimeType: "image/png", filename: "out.png" },
        ],
      },
    });
    render(
      <div style={{ height: 640 }}>
        <MessageList
          messages={live}
          streamText=""
          snapshot={{ assistantMessageId: message.id, status: "WORKING" }}
        />
      </div>,
    );
    expect(screen.getByText("Here is the crop.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "out.png" })).toHaveAttribute("src", "https://cdn.example/out.png");
    expect(screen.queryByText("https://cdn.example/out.png")).not.toBeInTheDocument();
    expect(screen.queryByText("Keep media")).not.toBeInTheDocument();
  });

  it("shows Thinking… while the model is working and no text has arrived", () => {
    const message = msg("aaaaaaaa-1111-1111-1111-111111111111", "ASSISTANT", "");
    message.status = "STREAMING";
    message.contentBlocks = [];
    render(
      <div style={{ height: 640 }}>
        <MessageList
          messages={[message]}
          streamText=""
          snapshot={{ assistantMessageId: message.id, status: "THINKING", currentStep: "llm:1" }}
        />
      </div>,
    );
    expect(screen.getByText("Thinking…")).toBeInTheDocument();
    expect(screen.queryByText("llm:1")).not.toBeInTheDocument();
  });

  it("hides leftover Keep media cards and renders crop steps as they arrive", () => {
    const message = msg("aaaaaaaa-1111-1111-1111-111111111111", "ASSISTANT", "I will crop first.");
    message.status = "STREAMING";
    message.contentBlocks = [
      { type: "text", text: "I will crop first." },
      {
        type: "tool_use",
        toolCallId: "call_1",
        toolName: "crop_image",
        input: { image_url: "https://cdn.example/in.png" },
      },
      {
        type: "asset",
        url: "https://cdn.example/out.png",
        mimeType: "image/png",
        filename: "out.png",
      },
    ];
    render(
      <div style={{ height: 640 }}>
        <MessageList
          messages={[message]}
          streamText=""
          snapshot={{
            chatId: message.chatId,
            assistantMessageId: message.id,
            status: "WAITING",
            currentStep: "wait:media",
            waitpoint: {
              waitpointId: "dddddddd-1111-1111-1111-111111111111",
              type: "MEDIA",
              status: "WAITING",
              triggerWaitpointId: "tok",
              publicAccessToken: null,
              timeoutAt: "2099-01-01T00:00:00.000Z",
              payload: {},
            },
          }}
        />
      </div>,
    );
    expect(screen.getByText("I will crop first.")).toBeInTheDocument();
    expect(screen.getByText("Crop image")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "out.png" })).toBeInTheDocument();
    expect(screen.queryByText("Keep media")).not.toBeInTheDocument();
  });
});

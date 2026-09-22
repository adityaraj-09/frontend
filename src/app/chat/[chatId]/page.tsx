import { ChatThread } from "@/components/chat/chat-thread";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;
  return <ChatThread chatId={chatId} />;
}

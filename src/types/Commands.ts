import { ChatClient } from "@twurple/chat";
import { ApiClient } from "@twurple/api";
import { ChatMessage } from "@twurple/chat";

export interface CommandContext {
  chatClient: ChatClient;
  apiClient: ApiClient;
  channel: string;
  user: string;
  args: string[];
  msg: ChatMessage;
}

export interface Command {
  name: string;
  description?: string;
  adminOnly?: boolean;
  execute: (ctx: CommandContext) => Promise<void>;
}

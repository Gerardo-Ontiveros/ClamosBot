import { Command } from "../../types/Commands";

export const Ping: Command = {
  name: "ping",
  description: "measures latency",
  execute: async ({ chatClient, channel, user }) => {
    await chatClient.say(channel, `🏓Pong ${user}`);
  },
};

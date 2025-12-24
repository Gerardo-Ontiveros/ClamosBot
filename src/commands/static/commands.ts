import { Command } from "../../types/Commands";

export const Commands: Command = {
  name: "commands",
  description: "measures latency",
  execute: async ({ chatClient, channel, user }) => {
    await chatClient.say(
      channel,
      `Ve la lista de comandos de este canal https://clamosbot.reexxy.com/${channel}`
    );
  },
};

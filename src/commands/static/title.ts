import { Command } from "../../types/Commands";

export const Title: Command = {
  name: "settitle",
  description: "change title of stream",
  adminOnly: true,
  execute: async ({ apiClient, chatClient, channel, msg, args }) => {
    const newTitle = args.join(" ");
    if (!newTitle) {
      return;
    }
    try {
      const channelName = channel.replace("#", "");
      const broadcaster = await apiClient.users.getUserByName(channelName);

      if (!broadcaster) {
        return;
      }

      await apiClient.asUser(broadcaster.id, async (ctx) => {
        await ctx.channels.updateChannelInfo(broadcaster.id, {
          title: newTitle,
        });

        await chatClient.say(
          channel,
          `Título actualizado correctamente. NOTED`
        );
      });
    } catch (error) {
      console.error(error);
      await chatClient.say(
        channel,
        "❌ Error: ¿El streamer está registrado en el bot?"
      );
    }
  },
};

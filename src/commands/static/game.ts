import { Command } from "../../types/Commands";

export const Game: Command = {
  name: "setgame",
  description: "Cambiar la categoria del stream.",
  adminOnly: true,
  execute: async ({ apiClient, chatClient, channel, msg, args }) => {
    const gameQuery = args.join(" ");
    if (!gameQuery) {
      await chatClient.say(channel, "❌ Debes escribir el nombre del juego.");
      return;
    }
    try {
      const channelName = channel.replace("#", "");
      const broadcaster = await apiClient.users.getUserByName(channelName);

      if (!broadcaster) {
        return;
      }

      const game = await apiClient.games.getGameByName(gameQuery);

      if (!game) {
        await chatClient.say(
          channel,
          `⚠️ No encontré el juego "${gameQuery}". Revisa que esté escrito igual que en Twitch.`
        );
        return;
      }

      await apiClient.channels.updateChannelInfo(broadcaster.id, {
        gameId: game.id,
      });

      await chatClient.say(
        channel,
        `Categoria actualizada correctamente NOTED`
      );
    } catch (error) {
      console.error(error);
      await chatClient.say(
        channel,
        "Error: No tengo permisos (¿Te logueaste con tu cuenta personal en el bot?)"
      );
    }
  },
};

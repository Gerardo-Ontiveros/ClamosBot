import { Command } from "../../types/Commands";

export const Timeout: Command = {
  name: "timeout",
  adminOnly: true,
  description: "Aplica un timeout de duración aleatoria a un usuario",
  execute: async ({ chatClient, apiClient, channel, user, msg, args }) => {
    if (!args || args.length === 0) {
      await chatClient.say(
        channel,
        `@${user}, debes mencionar a alguien. Uso: -timeout @usuario`
      );
      return;
    }

    const targetName = args[0].replace("@", "");

    try {
      const targetUser = await apiClient.users.getUserByName(targetName);
      const broadcaster = await apiClient.users.getUserByName(
        channel.replace("#", "")
      );

      if (!targetUser) {
        await chatClient.say(channel, `No encontré al usuario ${targetName}.`);
        return;
      }

      if (!broadcaster) {
        console.error("No se pudo obtener la ID del canal.");
        return;
      }

      const minSeconds = 1;
      const maxSeconds = 60;
      const duration = Math.floor(
        Math.random() * (maxSeconds - minSeconds + 1) + minSeconds
      );

      await apiClient.moderation.banUser(broadcaster.id, {
        user: targetUser.id,
        duration: duration,
        reason: `Timeout random ejecutado por ${user}`,
      });

      await chatClient.say(
        channel,
        `🕒 @${targetName} se va al rincón por ${duration} segundos CatLaugh`
      );
    } catch (error) {
      console.error("Error en comando timeout:", error);
    }
  },
};

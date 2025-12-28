import { Command } from "../../types/Commands";
import { apiClient } from "../../config/ApiClient";

export const Ruleta: Command = {
  name: "ruleta",
  description: "Los usuario se juegan un timeout a si mismos",
  execute: async ({ chatClient, channel, user, args, msg }) => {
    try {
      const channelName = channel.replace("#", "");

      if (msg.userInfo.isMod || msg.userInfo.isBroadcaster) {
        await chatClient.say(channel, `🛡️ @${user} Eres mod madgeCat.`);
        return;
      }

      const minSeconds = 0;
      const maxSeconds = 60;
      const randomDuration =
        Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds;

      const broadcaster = await apiClient.users.getUserByName(channelName);

      if (!broadcaster) return;
      const botId = 1371906002;
      if (randomDuration === 0) {
        await chatClient.say(
          channel,
          `@${user} no se baño hoy tuvo suerte y no le toco timeout.`
        );
      } else {
        await apiClient.asUser(botId, async (ctx) => {
          await ctx.moderation.banUser(broadcaster.id, {
            user: msg.userInfo.userId,
            duration: randomDuration,
            reason: `${user} Jugo a la ruleta  y le tocaron  ${randomDuration} catLaugh`,
          });
        });

        await chatClient.say(
          channel,
          `@${user} se hizo el valiente y lo durmieron ${randomDuration} segundos catLaugh`
        );
      }
    } catch (error: any) {
      console.error("Error al dar timeout:", error);
      if (
        error.message.includes("permission") ||
        error.message.includes("missing scope") ||
        error.message.includes("forbidden")
      ) {
        await chatClient.say(channel, `🛡️ @${user} eres mod madgeCat`);
      } else {
        console.error("Error al dar timeout:", error);
        await chatClient.say(
          channel,
          "Te salvaste no pude calcular tu castigo."
        );
      }
    }
  },
};

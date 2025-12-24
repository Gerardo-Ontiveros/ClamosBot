import { Command } from "../../types/Commands";

export const Prediction: Command = {
  name: "pred",
  adminOnly: true,
  execute: async ({ apiClient, chatClient, channel, args, user }) => {
    if (args.length < 2) {
      await chatClient.say(
        channel,
        `Uso: !prediccion <segundos> <título> [/ Opción1 / Opción2]`
      );
      return;
    }

    const timeWindow = parseInt(args[0]);
    if (isNaN(timeWindow) || timeWindow < 30 || timeWindow > 1800) {
      await chatClient.say(
        channel,
        `El tiempo debe ser entre 30 y 1800 segundos`
      );
      return;
    }

    const rawText = args.slice(1).join(" ");
    const parts = rawText
      .split("/")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const title = parts[0];
    let outcomes = parts.slice(1);

    if (outcomes.length === 0) {
      outcomes = ["Sipirili", "Noporolo"];
    }

    if (outcomes.length < 2) {
      await chatClient.say(
        channel,
        `Necesitas almenos 2 opciones para crear una prediccion`
      );
      return;
    }

    if (outcomes.length > 10) {
      await chatClient.say(channel, `Maximo 10 opciones permitidas`);
    }

    try {
      const channelName = channel.replace("#", "");
      const broadcaster = await apiClient.users.getUserByName(channelName);

      if (!broadcaster) {
        return;
      }

      await apiClient.asUser(broadcaster.id, async (ctx) => {
        await ctx.predictions.createPrediction(broadcaster.id, {
          title: title,
          outcomes: outcomes,
          autoLockAfter: timeWindow,
        });
      });

      await chatClient.say(
        channel,
        `peepoCheer PREDICCION ACTIVA "${title}" (Cierra en ${timeWindow}s)`
      );
    } catch (error) {
      console.error(error);
      await chatClient.say(channel, "Ocurrio un error al crear predicción");
    }
  },
};

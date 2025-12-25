import { HelixPrediction } from "@twurple/api";
import { Command } from "../../types/Commands";
import {
  formatStats,
  lockPrediction,
  resolvePrediction,
} from "../../utils/Predictions";

export const Prediction: Command = {
  name: "pred",
  adminOnly: true,
  execute: async ({ apiClient, chatClient, channel, args, user }) => {
    if (args.length < 2) {
      await chatClient.say(
        channel,
        `Uso: -pred <segundos> <título> / Opción1 / Opción2`
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
      let prediction: HelixPrediction | undefined;

      await apiClient.asUser(broadcaster.id, async (ctx) => {
        prediction = await ctx.predictions.createPrediction(broadcaster.id, {
          title: title,
          outcomes: outcomes,
          autoLockAfter: timeWindow,
        });
      });

      await chatClient.say(
        channel,
        `peepoCheer PREDICCION ACTIVA "${title}" (Cierra en ${timeWindow}s)`
      );

      if (prediction) {
        const predictionId = prediction.id;
        setTimeout(async () => {
          try {
            const freshPred = await apiClient.predictions.getPredictionById(
              broadcaster.id,
              predictionId
            );

            if (freshPred && freshPred.status === "LOCKED") {
              const statsMsg = formatStats(freshPred);
              chatClient.say(
                channel,
                `APUESTAS CERRADAS: ${statsMsg} peepoCheer`
              );
            }
          } catch (err) {
            console.error("Error al mostrar stats automáticos:", err);
          }
        }, (timeWindow + 2) * 1000);
      }
    } catch (error) {
      console.error(error);
      await chatClient.say(channel, "Ocurrio un error al crear predicción");
    }
  },
};

export const WinBlue: Command = {
  name: "azul",
  adminOnly: true,
  description: "La prediccion la ganan los del lado azul",
  execute: async ({ chatClient, channel }) => {
    try {
      const channelName = channel.replace("#", "");
      await resolvePrediction(channelName, "azul");

      chatClient.say(channel, "EL LADO AZUL GANA LA PREDICCION peepoCheer");
    } catch (e) {
      console.error(e);
    }
  },
};

export const WinPink: Command = {
  name: "rosa",
  adminOnly: true,
  description: "La prediccion la ganan los del lado rosa",
  execute: async ({ chatClient, channel }) => {
    try {
      const channelName = channel.replace("#", "");
      await resolvePrediction(channelName, "rosa");

      chatClient.say(channel, "EL LADO ROSA GANA LA PREDICCION peepoCheer");
    } catch (e) {
      console.error(e);
    }
  },
};

export const ClosePred: Command = {
  name: "cerrarPred",
  adminOnly: true,
  description: "Cierra las votaciones y muestra resultados",
  execute: async ({ chatClient, channel }) => {
    try {
      const channelName = channel.replace("#", "");

      const lockedPred = await lockPrediction(channelName);

      if (lockedPred) {
        const statsMsg = formatStats(lockedPred);
        chatClient.say(channel, `APUESTAS CERRADAS: ${statsMsg} peepoCheer`);
      } else {
        chatClient.say(channel, "No hay predicción activa para cerrar.");
      }
    } catch (e) {
      console.error(e);
    }
  },
};

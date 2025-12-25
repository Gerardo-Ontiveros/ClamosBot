import { HelixPrediction } from "@twurple/api/lib";
import { apiClient } from "../config/ApiClient";

export async function resolvePrediction(
  channelName: string,
  result: "azul" | "rosa"
) {
  try {
    const user = await apiClient.users.getUserByName(channelName);
    if (!user) return;

    const predictions = await apiClient.predictions.getPredictions(user.id);
    const activePrediction = predictions.data.find(
      (p) => p.status === "ACTIVE"
    );

    if (!activePrediction) {
      console.log("No hay predicciones activas para resolver.");
      return;
    }

    const winningIndex = result === "azul" ? 0 : 1;
    const winningOutcome = activePrediction.outcomes[winningIndex];

    if (!winningOutcome) {
      console.error("No se encontró el outcome ganador.");
      return;
    }

    await apiClient.predictions.resolvePrediction(
      user.id,
      activePrediction.id,
      winningOutcome.id
    );
    console.log(
      `Predicción resuelta: ${result} (Outcome: ${winningOutcome.title})`
    );
  } catch (error) {
    console.error("Error resolviendo predicción:", error);
  }
}

export async function lockPrediction(channelName: string) {
  try {
    const user = await apiClient.users.getUserByName(channelName);
    if (!user) return false;

    const predictions = await apiClient.predictions.getPredictions(user.id);
    const activePrediction = predictions.data.find(
      (p) => p.status === "ACTIVE"
    );

    if (!activePrediction) {
      return null;
    }

    const loockPred = await apiClient.predictions.lockPrediction(
      user,
      activePrediction.id
    );

    return loockPred;
  } catch (error) {
    console.error("Error cerrando predicción:", error);
    return false;
  }
}

export async function abortPrediction(channelName: string) {
  try {
    const user = await apiClient.users.getUserByName(channelName);
    if (!user) return false;

    const predictions = await apiClient.predictions.getPredictions(user.id);
    const activePrediction = predictions.data.find(
      (p) => p.status === "ACTIVE" || "LOCK"
    );

    if (!activePrediction) {
      console.log("No hay predicción activa para cerrar.");
      return false;
    }
    await apiClient.predictions.lockPrediction(user, activePrediction.id);

    return true;
  } catch (error) {
    console.error("Error cerrando predicción:", error);
    return false;
  }
}

export function formatStats(prediction: HelixPrediction) {
  const blue = prediction.outcomes[0];
  const pink = prediction.outcomes[1];

  const bluePoints = blue.totalChannelPoints;
  const pinkPoints = pink.totalChannelPoints;
  const totalPoints = bluePoints + pinkPoints;

  if (totalPoints) {
    return `${blue.title}: 0% (0) - ${pink.title}: 0% (0)`;
  }

  const bluePerc = Math.round((bluePoints / totalPoints) * 100);
  const pinkPerc = Math.round((pinkPoints / totalPoints) * 100);

  return ` ${blue.title}: ${bluePerc}% (${bluePoints}) - 🎀${pink.title}: ${pinkPerc}% (${pinkPoints}) | TOTAL DE PUNTOS: ${totalPoints}`;
}

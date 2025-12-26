import { Command } from "../../types/Commands";
import {
  startTracking,
  stopTracking,
  resetTracking,
} from "../../services/BattleTracker";

export const StartTracker: Command = {
  name: "liveon",
  adminOnly: true,
  description: "Inicia el rastreo de batallas",
  execute: async ({ chatClient, channel, user, args }) => {
    startTracking(chatClient, channel);
  },
};

export const StopTracker: Command = {
  name: "liveoff",
  adminOnly: true,
  description: "Pausa el rastreo de batallas",
  execute: async ({ chatClient, channel, user }) => {
    stopTracking(chatClient, channel);
  },
};

export const ResetTracker: Command = {
  name: "reset",
  adminOnly: true,
  description: "Reinicia el contador de victorias y derrotas",
  execute: async ({ chatClient, channel, user }) => {
    resetTracking(chatClient, channel);
  },
};

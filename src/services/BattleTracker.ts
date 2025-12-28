import axios from "axios";
import { apiUri, clashRoyaleToken } from "../config/Config";
import { db } from "../config/Firebase";

const PLAYER_TAGS = ["#P2U9G2J", "#U0UJCJUP0"];

const winsRef = db.ref("stream/stats/wins");
const losesRef = db.ref("stream/stats/loses");
const streakRef = db.ref("stream/stats/racha");

let trackerInterval: NodeJS.Timeout | null = null;
let lastCheckTime = new Date();

const parseRoyaleDate = (dateStr: string): Date => {
  const formatted = dateStr.replace(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2}).*$/,
    "$1-$2-$3T$4:$5:$6Z"
  );

  return new Date(formatted);
};

const initDbIfNeeded = async () => {
  const snapshot = await db.ref("stream/stats").once("value");
  if (!snapshot.exists()) {
    await db.ref("stream/stats").set({ wins: 0, loses: 0, racha: 0 });
    console.log("🆕 Base de datos inicializada en 0");
  }
};

export const startTracking = async (chatClient: any, channel: string) => {
  if (trackerInterval) {
    return;
  }

  await initDbIfNeeded();

  lastCheckTime = new Date();

  chatClient.say(channel, "🟢 Contador  activado. peepoCheer");

  trackerInterval = setInterval(async () => {
    try {
      let newBattlesFound = false;

      for (const tag of PLAYER_TAGS) {
        const encodedTag = tag.replace("#", "%23");

        const res = await axios.get(
          `${apiUri}/v1/players/${encodedTag}/battlelog`,
          {
            headers: {
              Authorization: `Bearer ${clashRoyaleToken}`,
            },
          }
        );

        const battles = res.data;

        const recentBattles = battles.filter((battle: any) => {
          const battleDate = parseRoyaleDate(battle.battleTime);
          return battleDate > lastCheckTime;
        });

        for (const battle of recentBattles) {
          newBattlesFound = true;

          const myCrowns = battle.team[0].crowns;
          const enemyCrowns = battle.opponent[0].crowns;

          if (myCrowns > enemyCrowns) {
            console.log(`✅ Victoria detectada (${tag})`);

            await winsRef.transaction((current) => (current || 0) + 1);
            await streakRef.transaction((current) => (current || 0) + 1);
          } else if (enemyCrowns > myCrowns) {
            console.log(`❌ Derrota detectada (${tag})`);

            await losesRef.transaction((current) => (current || 0) + 1);
            await streakRef.set(0);
          }
        }
      }

      if (newBattlesFound) {
        lastCheckTime = new Date();
        const snapshot = await db.ref("stream/stats").once("value");
        const s = snapshot.val();
        console.log(
          `📊 Stats actuales: ${s.wins}W - ${s.loses}L | Racha: ${s.racha}`
        );
      }
    } catch (error) {
      console.error("Error actualizando el contador", error);
    }
  }, 300000);
};

export const stopTracking = async (chatClient: any, channel: string) => {
  if (!trackerInterval) {
    chatClient.say(channel, "⚠️ El rastreador no está activo.");
    return;
  }
  clearInterval(trackerInterval);
  trackerInterval = null;

  chatClient.say(channel, "🔴 Contador pausado. Sadge");
};

export const resetTracking = async (chatClient: any, channel: string) => {
  await winsRef.set(0);
  await losesRef.set(0);
  await streakRef.set(0);
  chatClient.say(channel, "CONTADOR REINICIADO peepoCheer");
};

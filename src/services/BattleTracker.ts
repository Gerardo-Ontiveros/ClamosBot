import axios from "axios";
import { apiUri, clashRoyaleToken } from "../config/Config";
import { db } from "../config/Firebase";

// 1. Cada jugador ahora tiene un arreglo (array) de 'tags'
const PLAYERS = [
  { name: "Sergio", tags: ["#P2U9G2J", "#U0UJCJUP0"] },
  { name: "Arden", tags: ["#U0UJCJUP0"] },
  { name: "Anaban", tags: ["#GYUQQCLV", "#Q029J2RU"] }, 
];

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
  for (const player of PLAYERS) {
    const playerRef = db.ref(`stream/seasonFinal/${player.name}`);
    const snapshot = await playerRef.once("value");
    if (!snapshot.exists()) {
      await playerRef.set({ wins: 0, loses: 0, rank: 0 });
      console.log(`🆕 Base de datos inicializada para ${player.name}`);
    }
  }
};

export const startTracking = async (chatClient: any, channel: string) => {
  if (trackerInterval) {
    return;
  }

  await initDbIfNeeded();
  lastCheckTime = new Date();
  chatClient.say(channel, "🟢 Contador activado peepoCheer");

  trackerInterval = setInterval(async () => {
    try {
      let newBattlesFound = false;

      for (const player of PLAYERS) {
        let maxRank = 0; 

        for (const tag of player.tags) {
          const encodedTag = tag.replace("#", "%23");

          try {
            const profileRes = await axios.get(
              `${apiUri}/v1/players/${encodedTag}`,
              { headers: { Authorization: `Bearer ${clashRoyaleToken}` } }
            );
            
            const currentRank = profileRes.data.currentPathOfLegendSeasonResult?.rank || 0; 
            if (currentRank > maxRank) {
              maxRank = currentRank;
            }

            const battleRes = await axios.get(
              `${apiUri}/v1/players/${encodedTag}/battlelog`,
              { headers: { Authorization: `Bearer ${clashRoyaleToken}` } }
            );

            const battles = battleRes.data;
            const recentBattles = battles.filter((battle: any) => {
              const battleDate = parseRoyaleDate(battle.battleTime);
              return battleDate > lastCheckTime;
            });

            for (const battle of recentBattles) {
              newBattlesFound = true;

              const myCrowns = battle.team[0].crowns;
              const enemyCrowns = battle.opponent[0].crowns;

              const winsRef = db.ref(`stream/seasonFinal/${player.name}/wins`);
              const losesRef = db.ref(`stream/seasonFinal/${player.name}/loses`);

              if (myCrowns > enemyCrowns) {
                console.log(`✅ Victoria detectada (${player.name} - ${tag})`);
                await winsRef.transaction((current) => (current || 0) + 1);
              } else if (enemyCrowns > myCrowns) {
                console.log(`❌ Derrota detectada (${player.name} - ${tag})`);
                await losesRef.transaction((current) => (current || 0) + 1);
              }
            }
          } catch (err) {
            console.error(`Error procesando el tag ${tag} de ${player.name}`);
          }
        } 

        await db.ref(`stream/seasonFinal/${player.name}/rank`).set(maxRank);

      }

      if (newBattlesFound) {
        lastCheckTime = new Date();
        console.log("📊 Datos actualizados en Firebase.");
      }
    } catch (error) {
      console.error("Error en el ciclo principal del contador:", error);
    }
  }, 120000); 
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
  for (const player of PLAYERS) {
    const playerRef = db.ref(`stream/seasonFinal/${player.name}`);
    await playerRef.update({ wins: 0, loses: 0 }); 
  }
  chatClient.say(channel, "CONTADOR REINICIADO peepoCheer");
};
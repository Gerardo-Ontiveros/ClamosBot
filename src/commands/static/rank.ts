import { apiUri, clashRoyaleToken } from "../../config/Config";
import { Command } from "../../types/Commands";
import axios from "axios";

export const Rank: Command = {
  name: "rank",
  description: "",
  execute: async ({ chatClient, channel, user, args }) => {
    const defaultTag = "P2U9G2J";
    const playerName = args.slice(1).join(" ");

    try {
      let playerName = defaultTag;

      const res = await axios.get(`${apiUri}/v1/players/%23${playerName}`, {
        headers: {
          Authorization: `Bearer ${clashRoyaleToken}`,
        },
      });

      const rank = res.data.currentPathOfLegendSeasonResult.rank;
      const trophies = res.data.currentPathOfLegendSeasonResult.trophies;
      const name = res.data.name;

      await chatClient.say(
        channel,
        `@${user} ${name} esta en el top #${rank} con ${trophies} medallas 🏅`
      );
    } catch (err: any) {
      await chatClient.say(channel, `@${user} no pude obtener el rank :(`);
      console.error(err.response ? err.response.data : err.message);
    }
  },
};

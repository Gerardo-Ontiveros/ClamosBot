import { apiUri, clashRoyaleToken } from "../../config/Config";
import { Command } from "../../types/Commands";
import axios from "axios";

export const Rank: Command = {
  name: "rank",
  description: "",
  execute: async ({ chatClient, channel, user, args }) => {
    const sergioRamos = "P2U9G2J";
    const pollosHermanos = "U0UJCJUP0";

    try {
      const resSergioRamos = await axios.get(
        `${apiUri}/v1/players/%23${sergioRamos}`,
        {
          headers: {
            Authorization: `Bearer ${clashRoyaleToken}`,
          },
        }
      );

      const resPollosHemanos = await axios.get(
        `${apiUri}/v1/players/%23${pollosHermanos}`
      );

      const rankSergioRamos =
        resSergioRamos.data.currentPathOfLegendSeasonResult.rank;
      const trophiesSergioRamos =
        resSergioRamos.data.currentPathOfLegendSeasonResult.trophies;
      const nameSergioRamos = resSergioRamos.data.name;
      const rankPollosHemanos =
        resPollosHemanos.data.currentPathOfLegendSeasonResult.rank;
      const trophiesPollosHemanos =
        resPollosHemanos.data.currentPathOfLegendSeasonResult.trophies;
      const namePollosHemanos = resPollosHemanos.data.name;

      await chatClient.say(
        channel,
        `@${user} ${nameSergioRamos} esta en el top #${rankSergioRamos} con ${trophiesSergioRamos} medallas 🏅 | ${namePollosHemanos} esta en el top #${rankPollosHemanos} con ${trophiesPollosHemanos} medallas 🏅`
      );
    } catch (err: any) {
      await chatClient.say(channel, `@${user} no pude obtener el rank :(`);
      console.error(err.response ? err.response.data : err.message);
    }
  },
};

import { apiUri, clashRoyaleToken } from "../../config/Config";
import { Command } from "../../types/Commands";
import axios from "axios";

export const Deck: Command = {
  name: "deck",
  description: "",
  execute: async ({ chatClient, channel, user, args }) => {
    const defaultTag = "P2U9G2J";

    try {
      let playerName = defaultTag;

      const res = await axios.get(
        `${apiUri}/v1/players/%23${playerName}/battlelog`,
        {
          headers: {
            Authorization: `Bearer ${clashRoyaleToken}`,
          },
        }
      );

      const battles = res.data;
      const firstBattle = battles[0];
      if (!firstBattle) {
        chatClient.say(channel, `@${user} no encontré batallas recientes 😢`);
        return;
      }

      const player = firstBattle.team[0];
      const deck = player.cards.map((card: any) =>
        card.evolutionLevel === 1 ? `${card.name} (Evo)` : card.name
      );

      await chatClient.say(
        channel,
        `@${user} ${player.name} | Mazo: ${deck.join(", ")}`
      );
    } catch (err: any) {
      await chatClient.say(channel, `@${user} no pude obtener el mazo :(`);
      console.error(err);
      console.error(err.response ? err.response.data : err.message);
    }
  },
};

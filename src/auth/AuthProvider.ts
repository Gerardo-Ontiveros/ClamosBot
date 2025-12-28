import { RefreshingAuthProvider } from "@twurple/auth";
import { prisma } from "../database/prisma";
import { clientId, clientSecret, botUsername } from "../config/Config";

export const authProvider = new RefreshingAuthProvider({
  clientId,
  clientSecret,
});

authProvider.onRefresh(async (userId, newTokenData) => {
  console.log(`Refrescando token para: ${userId}`);
  await prisma.user.update({
    where: { id: userId },
    data: {
      accessToken: newTokenData.accessToken,
      refreshToken: newTokenData.refreshToken,
      expiresIn: newTokenData.expiresIn,
      obtainmentTimestamp: newTokenData.obtainmentTimestamp,
    },
  });
});

export async function loadTokensFromDB() {
  const users = await prisma.user.findMany();
  const channelsToJoin: string[] = [];

  for (const user of users) {
    const intents = ["chat"];

    await authProvider.addUser(
      user.id,
      {
        accessToken: user.accessToken,
        refreshToken: user.refreshToken,
        expiresIn: user.expiresIn || 0,
        obtainmentTimestamp: Number(user.obtainmentTimestamp) || 0,
      },
      intents
    );

    if (user.username.toLowerCase() !== botUsername?.toLowerCase()) {
      channelsToJoin.push(user.username);
    } else {
      channelsToJoin.push(user.username);
    }
  }

  return channelsToJoin;
}

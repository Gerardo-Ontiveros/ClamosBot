import express from "express";
import { clientId, clientSecret, PORT, redirectUri } from "./config/Config";
import { SCOPES } from "./constants/SCOPES";
import {
  exchangeCode,
  RefreshingAuthProvider,
  StaticAuthProvider,
} from "@twurple/auth";
import { ApiClient } from "@twurple/api";
import { prisma } from "./database/prisma";
import { ChatClient } from "@twurple/chat";

export default async function WebServer(
  mainAuthProvider: RefreshingAuthProvider,
  chatClient: ChatClient
) {
  console.log("===== ENCENDIENDO SERVIDOR OAUTH =====");

  const app = express();
  const botUser = await prisma.user.findUnique({ where: { id: "1371906002" } });

  if (botUser) {
    const initialTokenData = {
      accessToken: botUser.accessToken,
      refreshToken: botUser.refreshToken,
      expiresIn: botUser.expiresIn || 0,
      obtainmentTimestamp: botUser.obtainmentTimestamp
        ? Number(botUser.obtainmentTimestamp)
        : 0,
    };

    mainAuthProvider.addUser(botUser.id, initialTokenData, ["chat"]);

    if (!chatClient.isConnected) {
      console.log("ClamosBot conectando al chat globalmente...");
      await chatClient.connect();
    }
  }

  app.get("/", (request, response) => {
    response.status(200).send("HELLO WORLD");
  });

  app.get("/login", (request, response) => {
    const url = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${SCOPES.join(
      "+"
    )}`;
    response.redirect(url);
  });

  app.get("/callback", async (request, response) => {
    const code = request.query.code as string;
    if (!code) {
      response.status(400).send("Error: Sin código");
      return;
    }

    try {
      const tokenData = await exchangeCode(
        clientId,
        clientSecret,
        code,
        redirectUri
      );

      const tempAuthProvider = new StaticAuthProvider(
        clientId,
        tokenData.accessToken
      );
      const tempApiClient = new ApiClient({ authProvider: tempAuthProvider });
      const tokenInfo = await tempApiClient.getTokenInfo();

      if (!tokenInfo.userId) throw new Error("No userID found in token");

      const user = await tempApiClient.users.getUserById(tokenInfo.userId);
      if (!user) throw new Error("User not found");

      console.log(`Registrando nuevo streamer: ${user.name} (${user.id})`);

      await prisma.user.upsert({
        where: { id: user.id },
        update: {
          username: user.name,
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          expiresIn: tokenData.expiresIn,
          obtainmentTimestamp: tokenData.obtainmentTimestamp,
        },
        create: {
          id: user.id,
          username: user.name,
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken || null,
          expiresIn: tokenData.expiresIn || 0,
          obtainmentTimestamp: tokenData.obtainmentTimestamp,
        },
      });
      mainAuthProvider.addUser(user.id, tokenData, ["chat"]);

      if (!chatClient.isConnected) {
        console.log("Primer usuario. Conectando al sistema de chat...");
        await chatClient.connect();
        await chatClient.join(user.name);
      } else {
        console.log(`Uniendose al chat ${user.name}`);
        await chatClient.join(user.name);
      }

      response.send("<h1>BOT CONECTADO</h1>");
      response.status(200);
    } catch (error) {
      console.error("Error callback:", error);
      response.status(500).send("Error interno:" + error);
    }
  });

  app
    .listen(PORT, () => {
      console.log(` SERVER ENCENDIDO Y FUNCIONANDO: http://localhost:${PORT}`);
    })
    .on("error", (error) => {
      throw new Error(
        `Ha ocurrido un error al iniciar el servidor: ${error.message}`
      );
    });
}

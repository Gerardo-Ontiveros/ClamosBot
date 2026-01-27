import express from "express";
import axios from "axios"; // Nuevo import
import querystring from "querystring"; // Nuevo import
import { 
  clientId, 
  clientSecret, 
  PORT, 
  redirectUri,
  // Asegúrate de exportar estos desde tu Config también:
  spotifyClientId, 
  spotifyClientSecret 
} from "./config/Config";
import { SCOPES } from "./constants/SCOPES";
import {
  exchangeCode,
  RefreshingAuthProvider,
  StaticAuthProvider,
} from "@twurple/auth";
import { ApiClient } from "@twurple/api";
import { prisma } from "./database/prisma";
import { ChatClient } from "@twurple/chat";
import cors from "cors";

import { updateSpotifyStatusInDB, getCurrentSong } from "./services/spotifyService";

export default async function WebServer(
  mainAuthProvider: RefreshingAuthProvider,
  chatClient: ChatClient
) {
  console.log("===== ENCENDIENDO SERVIDOR WEB & OAUTH =====");

  const app = express();

  app.use(cors({ origin: ["*"] }));

  const SPOTIFY_REDIRECT_URI = `https://api.clamosbot.reexxy.com/auth/spotify/callback`;

  // --- Lógica de Inicio del Bot (Twitch) ---
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

  // --- RUTAS BASE ---

  app.get("/", (request, response) => {
    response.status(200).send("CLAMOSBOT SERVER RUNNING");
  });

  // ==========================================
  //      RUTAS DE TWITCH (Tu código original)
  // ==========================================

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

      console.log(`Registrando nuevo streamer en Twitch: ${user.name} (${user.id})`);

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

      response.send("<h1>BOT CONECTADO A TWITCH EXITOSAMENTE</h1>");
      response.status(200);
    } catch (error) {
      console.error("Error callback Twitch:", error);
      response.status(500).send("Error interno:" + error);
    }
  });

  // ==========================================
  //      RUTAS DE SPOTIFY 
  // ==========================================

  app.get("/auth/spotify/login", (req, res) => {
    const streamerName = req.query.streamer as string;

    if (!streamerName) {
        return res.status(400).send("Falta el parámetro '?streamer=nombre_canal'");
    }

    const scope = 'user-read-currently-playing user-read-playback-state';
    
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: spotifyClientId,
            scope: scope,
            redirect_uri: SPOTIFY_REDIRECT_URI,
            state: streamerName
        }));
  });

  app.get("/auth/spotify/callback", async (req, res) => {
    const code = req.query.code as string;
    const streamerName = req.query.state as string; 

    if (req.query.error) return res.send("Error: Acceso denegado en Spotify.");
    if (!code || !streamerName) return res.send("Error: Datos faltantes en el callback.");

    try {
        const response = await axios.post('https://accounts.spotify.com/api/token', 
            querystring.stringify({
                code: code,
                redirect_uri: SPOTIFY_REDIRECT_URI,
                grant_type: 'authorization_code'
            }), {
                headers: {
                    'Authorization': 'Basic ' + (Buffer.from(spotifyClientId + ':' + spotifyClientSecret).toString('base64')),
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

        const refreshToken = response.data.refresh_token;

        await updateSpotifyStatusInDB(streamerName, refreshToken);

        res.send(`
            <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
                <h1 style="color: #1DB954;">¡Spotify Conectado!</h1>
                <p>El canal <strong>${streamerName}</strong> ahora puede mostrar su música.</p>
                <p>Puedes cerrar esta pestaña.</p>
            </div>
        `);

    } catch (error) {
        console.error("Error conectando Spotify:", error);
        res.status(500).send("Error al obtener token de Spotify.");
    }
  });

  app.get("/api/spotify/now-playing", async (req, res) => {
    const channel = req.query.channel as string;

    res.header("Access-Control-Allow-Origin", "*"); 

    if (!channel) {
        res.status(400).json({ error: "Falta parametro channel" });
        return; 
    }

    const songData = await getCurrentSong(channel);
    res.json(songData);
  });

  // ==========================================
  //      INICIO DEL SERVIDOR
  // ==========================================

  app
    .listen(PORT, () => {
      console.log(` SERVER ENCENDIDO Y FUNCIONANDO: http://localhost:${PORT}`);
      console.log(` -> Twitch Auth: http://localhost:${PORT}/login`);
      console.log(` -> Spotify Auth: http://localhost:${PORT}/auth/spotify/login?streamer=TU_USUARIO`);
    })
    .on("error", (error) => {
      throw new Error(
        `Ha ocurrido un error al iniciar el servidor: ${error.message}`
      );
    });
}
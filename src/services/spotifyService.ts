import axios from "axios";
import querystring from "querystring";
import { spotifyClientId, spotifyClientSecret } from "../config/Config"; 
import { db } from "../config/Firebase";

const BASIC_AUTH = Buffer.from(`${spotifyClientId}:${spotifyClientSecret}`).toString("base64");
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const NOW_PLAYING_ENDPOINT = "https://api.spotify.com/v1/me/player/currently-playing";


export const getSpotifyAccessToken = async (refreshToken: string) => {
    try {
        const response = await axios.post(TOKEN_ENDPOINT, querystring.stringify({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
        }), {
            headers: {
                "Authorization": `Basic ${BASIC_AUTH}`,
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });
        return response.data.access_token;
    } catch (error) {
        console.error("Error renovando access token de Spotify:", error);
        return null;
    }
}

export const getCurrentSong = async (channelName: string) => {
    try {
        const refreshToken = await getSpotifyToken(channelName);

        if (!refreshToken) {
            return { isPlaying: false, error: "Streamer no registrado" };
        }

        const accessToken = await getSpotifyAccessToken(refreshToken);
        if (!accessToken) return { isPlaying: false, error: "Fallo de autenticación" };

        const response = await axios.get(NOW_PLAYING_ENDPOINT, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (response.status === 204 || response.status > 400) {
            return { isPlaying: false };
        }

        const song = response.data.item;
        if (!song) return { isPlaying: false };

        return {
            isPlaying: response.data.is_playing,
            title: song.name,
            artists: song.artists.map((artist: any) => artist.name).join(", "),
            album: song.album.name,
            albumImageUrl: song.album.images[0]?.url,
            songUrl: song.external_urls.spotify,
            duration: song.duration_ms,
            progress: response.data.progress_ms
        };

    } catch (error) {
        console.error(`Error obteniendo canción para ${channelName}:`, error);
        return { isPlaying: false };
    }
}


export const updateSpotifyStatusInDB = async (channelName: string, refreshToken: string) => {
    try {
        const ref = db.ref(`streamers/${channelName}`);
        
        await ref.update({
            spotifyRefreshToken: refreshToken,
            updatedAt: new Date().toISOString() 
        });
    } catch (error) {
        console.error("Error guardando en Firebase RTDB:", error);
    }
}

export const getSpotifyToken = async (channelName: string) => {
    try {
        const snapshot = await db.ref(`streamers/${channelName}/spotifyRefreshToken`).once('value');
        
        return snapshot.val() || null;
    } catch (error) {
        console.error("Error leyendo de Firebase RTDB:", error);
        return null;
    }
};
import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT;
export const clientId = process.env.CLIENT_ID!;
export const clientSecret = process.env.CLIENT_SECRET!;
export const redirectUri = process.env.REDIRECT_URI!;
export const botUsername = process.env.BOT_USERNAME;
export const apiUri = process.env.API_URI;
export const clashRoyaleToken = process.env.CLASH_ROYALE_TOKEN;

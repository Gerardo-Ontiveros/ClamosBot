import { ChatClient } from "@twurple/chat";
import { authProvider, loadTokensFromDB } from "./auth/AuthProvider";
import WebServer from "./server";
import { prisma } from "./database/prisma";
import { Command } from "./types/Commands";
import { staticCommands } from "./commands";
import { ApiClient } from "@twurple/api";
import { parseResponse } from "./utils/variableParser";

async function main() {
  console.log("==== INICIANDO BOT =====");

  const commandMap = new Map<string, Command>();
  staticCommands.forEach((cmd) => commandMap.set(cmd.name, cmd));
  console.log(
    `🛠️ Comandos estáticos cargados: ${staticCommands
      .map((c) => c.name)
      .join(", ")}`
  );

  const channelsToJoin = await loadTokensFromDB();

  const chatClient = new ChatClient({
    authProvider,
    channels: channelsToJoin,
    isAlwaysMod: true,
  });

  const apiClient = new ApiClient({ authProvider });

  chatClient.onMessage(async (channel, user, text, msg) => {
    const args = text.split(" ");
    const triggerWord = args.shift()?.toLowerCase();

    if (!triggerWord) return;

    //IS STATIC COMMAND?
    if (triggerWord.startsWith("-") && commandMap.has(triggerWord.slice(1))) {
      const commandName = triggerWord.slice(1);
      const command = commandMap.get(commandName);

      if (!command) return;

      if (
        command.adminOnly &&
        !msg.userInfo.isMod &&
        !msg.userInfo.isBroadcaster
      )
        return;

      try {
        await command.execute({
          chatClient,
          apiClient,
          channel,
          user,
          args,
          msg,
        });
      } catch (e) {
        console.error(e);
      }
      return;
    }

    // IS DYNAMIC COMMAND?
    try {
      const channelName = channel.replace("#", "");
      const channelUser = await prisma.user.findFirst({
        where: { username: channelName },
      });

      if (channelUser) {
        const dynamicCmd = await prisma.customCommand.findFirst({
          where: {
            userId: channelUser.id,
            trigger: triggerWord,
          },
        });

        if (dynamicCmd) {
          const finalResponse = parseResponse(dynamicCmd.response, user, args);
          await chatClient.say(channel, finalResponse);
        }
      }
    } catch (e) {
      console.error("Error buscando comando en DB:", e);
    }
  });

  WebServer(authProvider, chatClient);
}

main();

import { Command } from "../../types/Commands";
import { prisma } from "../../database/prisma";

export const ManageCommands: Command = {
  name: "cmd",
  description: "Manage commands (add, edit, delete)",
  adminOnly: true,
  execute: async ({ chatClient, channel, args, msg }) => {
    const action = args[0]?.toLowerCase();
    const triggerRaw = args[1];

    if (!action) {
      await chatClient.say(
        channel,
        "Uso: -cmd <add|edit|del> <comando> [respuesta]"
      );
      return;
    }

    const channelName = channel.replace("#", "");
    const channelUser = await prisma.user.findFirst({
      where: { username: channelName },
    });

    if (!channelUser) {
      return;
    }

    const trigger = triggerRaw;

    const responseText = args.slice(2).join(" ");

    try {
      switch (action) {
        case "add":
          const isModOnly = args.includes("?mod");

          const cleanArgs = args.filter((arg) => arg !== "?mod");
          const newTrigger = cleanArgs[1];
          const response = cleanArgs.slice(2).join(" ");
          await prisma.customCommand.create({
            data: {
              trigger: newTrigger.toLowerCase(),
              response: response,
              userId: channelUser.id,
              isModOnly: isModOnly,
              isEnabled: true,
            },
          });
          await chatClient.say(channel, `✅ Comando ${trigger} agregado.`);
          break;
        case "edit":
          if (!trigger || !responseText) return;
          await prisma.customCommand.update({
            where: {
              userId_trigger: {
                userId: channelUser.id,
                trigger: trigger.toLowerCase(),
              },
            },
            data: { response: responseText },
          });
          await chatClient.say(channel, `✏️ Comando ${trigger} editado.`);
          break;
        case "del":
          if (!trigger) return;
          await prisma.customCommand.delete({
            where: {
              userId_trigger: {
                userId: channelUser.id,
                trigger: trigger.toLowerCase(),
              },
            },
          });
          await chatClient.say(channel, `🗑️ Comando ${trigger} eliminado.`);
          break;
        case "enable":
          await prisma.customCommand.update({
            where: {
              userId_trigger: { userId: channelUser.id, trigger: trigger },
            },
            data: {
              isEnabled: true,
            },
          });
          await chatClient.say(channel, `Se ha activado el comando ${trigger}`);

          break;
        case "disable":
          await prisma.customCommand.update({
            where: {
              userId_trigger: { userId: channelUser.id, trigger: trigger },
            },
            data: {
              isEnabled: false,
            },
          });
          await chatClient.say(
            channel,
            `Se ha desactivado el comando ${trigger}`
          );
          break;
      }
    } catch (error: any) {
      if (error.code === "P2002") {
        await chatClient.say(
          channel,
          `⚠️ El comando ${trigger} ya existe. Usa '-cmd edit' para cambiarlo.`
        );
      } else if (error.code === "P2025") {
        await chatClient.say(channel, `⚠️ El comando ${trigger} no existe.`);
      } else {
        console.error(error);
        await chatClient.say(channel, "❌ Error en la base de datos.");
      }
    }
  },
};

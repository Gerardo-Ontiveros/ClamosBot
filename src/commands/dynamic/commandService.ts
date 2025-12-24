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
        "Uso: !cmd <add|edit|del> <comando> [respuesta]"
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
          await prisma.customCommand.create({
            data: {
              trigger: trigger.toLowerCase(),
              response: responseText,
              userId: channelUser.id,
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
      }
    } catch (error: any) {
      // Manejo de errores comunes de Prisma
      if (error.code === "P2002") {
        await chatClient.say(
          channel,
          `⚠️ El comando ${trigger} ya existe. Usa '!cmd edit' para cambiarlo.`
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

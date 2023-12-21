import { Telegraf } from "telegraf";
import { MyContext } from "../models/session";
import { seeYouTomorrowMessage } from "../messages/main";

export const channelMessagesController = (bot: Telegraf<MyContext>) => {
  bot.on("channel_post", async (ctx) => {
    const channelPost = ctx.update.channel_post;

    if (
      channelPost &&
      "text" in channelPost &&
      "message_id" in channelPost &&
      "reply_to_message" in channelPost &&
      channelPost.reply_to_message &&
      "caption" in channelPost.reply_to_message &&
      channelPost.reply_to_message.caption
    ) {
      // Парсинг текста сообщения, чтобы получить идентификатор пользователя
      const userIdMatch = /#(\d+)/.exec(channelPost.reply_to_message.caption);
      const userId = userIdMatch ? parseInt(userIdMatch[1]) : null;

      if (userId) {
        // Отправка сообщения пользователю
        const replyMessage = `
        🌟 Вам пришел ответ от нашего специалиста! 🌟
        
        "${channelPost.text}"
        `;

        // Отправка объединенного сообщения
        await ctx.telegram.sendMessage(userId, replyMessage);
        await ctx.telegram.sendMessage(userId, seeYouTomorrowMessage);
      } else {
        console.error(
          "Не удалось извлечь идентификатор пользователя из текста сообщения в канале."
        );
      }
    } else {
      console.error("Отсутствует текст или идентификатор сообщения в канале.");
    }
  });
};

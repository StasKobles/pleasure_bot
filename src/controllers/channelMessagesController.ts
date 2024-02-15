import { Telegraf } from 'telegraf';
import { MyContext } from '../models/session';
import { seeYouTomorrowMessage } from '../messages/main';
import {
  adminChatId,
  botHelpChatId,
  questHelpChatId,
  subHelpChatId,
} from '../config/config';

export const channelMessagesController = (bot: Telegraf<MyContext>) => {
  bot.on('channel_post', async (ctx) => {
    const channelPost = ctx.update.channel_post;
    const chatId = channelPost.chat.id.toString(); // Получение ID чата

    if (
      channelPost &&
      'text' in channelPost &&
      'message_id' in channelPost &&
      'reply_to_message' in channelPost &&
      channelPost.reply_to_message &&
      'caption' in channelPost.reply_to_message &&
      channelPost.reply_to_message.caption
    ) {
      // Парсинг текста сообщения, чтобы получить идентификатор пользователя
      const userIdMatch = /#(\d+)/.exec(channelPost.reply_to_message.caption);
      const userId = userIdMatch ? parseInt(userIdMatch[1]) : null;

      if (userId && chatId === adminChatId) {
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
          'Не удалось извлечь идентификатор пользователя из текста сообщения в канале.'
        );
      }
    }
    if (
      channelPost &&
      'text' in channelPost &&
      'message_id' in channelPost &&
      'reply_to_message' in channelPost &&
      channelPost.reply_to_message &&
      'text' in channelPost.reply_to_message &&
      channelPost.reply_to_message.text
    ) {
      if (
        chatId === subHelpChatId ||
        chatId === questHelpChatId ||
        chatId === botHelpChatId
      ) {
        const userIdSupport =
          channelPost.reply_to_message.text.match(/\(ID: (\d+)\)/)?.[1] || '';
        // Отправка сообщения пользователю
        const replyMessage = `
                 Вам пришел ответ от специалиста поддержки! 
                
                "${channelPost.text}"
                `;

        // Отправка объединенного сообщения
        await ctx.telegram.sendMessage(userIdSupport, replyMessage);
        await ctx.telegram.sendMessage(
          userIdSupport,
          'Если у Вас остались вопросы, то составьте повторное обращение, воспользовавшись командой /help'
        );
      }
    } else {
      console.error('Отсутствует текст или идентификатор сообщения в канале.');
    }
  });
};

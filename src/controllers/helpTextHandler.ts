import { NarrowedContext } from 'telegraf';
import { Update, Message } from 'telegraf/typings/core/types/typegram';
import { MyContext } from '../models/session';
import {
  botHelpChatId,
  questHelpChatId,
  subHelpChatId,
} from '../config/config';

export const helpTextHandler = async (
  ctx: NarrowedContext<
    MyContext,
    {
      message: Update.New & Update.NonChannel & Message.TextMessage;
      update_id: number;
    }
  >,
  direction: 'subscription' | 'bot' | 'quests'
) => {
  try {
    // Получаем текст сообщения пользователя
    const userMessage = ctx.message.text;

    // Получаем информацию о пользователе
    const userId = ctx.from.id;
    const userName = ctx.from.username || 'Без имени';

    // Формируем сообщение для админа
    const messageForAdmin = `Сообщение от пользователя @${userName} (ID: ${userId}):\n${userMessage}`;

    // Пересылка сообщения в админский чат
    if (direction == 'subscription') {
      await ctx.telegram.sendMessage(subHelpChatId, messageForAdmin);
    }
    if (direction == 'bot') {
      await ctx.telegram.sendMessage(botHelpChatId, messageForAdmin);
    }
    if (direction == 'quests') {
      await ctx.telegram.sendMessage(questHelpChatId, messageForAdmin);
    }

    // Отправляем подтверждение пользователю
    await ctx.reply('Ваше сообщение было отправлено администратору.');
    ctx.session.activeStep === undefined;
  } catch (error) {
    console.error('Ошибка при пересылке сообщения:', error);
    await ctx.reply(
      'Произошла ошибка при отправке вашего сообщения администратору.'
    );
  }
};

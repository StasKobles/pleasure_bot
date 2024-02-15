import { Markup, NarrowedContext, Telegraf } from 'telegraf';
import * as messages from '../messages/main';
import pool from '../services/sql';
import { MyContext } from '../models/session';
import { Update, Message } from 'telegraf/typings/core/types/typegram';

export const startCommand = (bot: Telegraf<MyContext>) => {
  bot.command('start', (ctx) => {
    ctx.reply(messages.startMessagePart1);
    setTimeout(() => {
      ctx.reply(
        messages.startMessagePart2,
        Markup.inlineKeyboard([
          Markup.button.callback('Начать', 'start_registration'),
        ])
      );
    }, 500);
  });

  bot.action('start_registration', async (ctx) => {
    ctx.deleteMessage(); // Удаление кнопки "Начать"
    const userId = ctx.from?.id;

    const user = await pool.query('SELECT * FROM users WHERE user_id = $1', [
      userId,
    ]);
    if (user.rows.length > 0) {
      ctx.reply(messages.knowUserText);
    } else {
      ctx.reply(
        'Выберите свой пол',
        Markup.inlineKeyboard([
          Markup.button.callback('Мужской', 'gender_male'),
          Markup.button.callback('Женский', 'gender_female'),
        ])
      );
    }
  });

  bot.action(['gender_male', 'gender_female'], async (ctx) => {
    ctx.deleteMessage();
    ctx.session.gender = ctx.match.input === 'gender_male' ? 'M' : 'Ж';
    ctx.reply('Сколько Вам лет?');
    ctx.session.activeStep = 'start';
  });
};
export const startTextHandler = async (
  ctx: NarrowedContext<
    MyContext,
    {
      message: Update.New & Update.NonChannel & Message.TextMessage;
      update_id: number;
    }
  >
) => {
  const age = parseInt(ctx.message.text);
  if (isNaN(age) || age < 16 || age > 100) {
    ctx.reply(messages.incorrectAge);
  } else {
    try {
      const userId = ctx.from.id;
      await pool.query(
        'INSERT INTO users (user_id, gender, age, subscription, active_task) VALUES ($1, $2, $3, $4, $5)',
        [userId, ctx.session.gender, age, false, 1]
      );
      await ctx.reply(messages.registrationComplete, {
        reply_markup: {
          inline_keyboard: [
            [Markup.button.callback('Перейти к подписке', 'subscribe_button')],
          ],
        },
      });
      ctx.session.activeStep = undefined;
    } catch (error) {
      console.error(error);
      ctx.reply(messages.registrationError);
    }
  }
};

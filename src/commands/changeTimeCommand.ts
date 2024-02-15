import { Telegraf } from 'telegraf';
import { timeButtons } from '../keyboards/keyboards';
import { MyContext } from '../models/session';
import pool from '../services/sql';

export const changeTimeCommand = async (bot: Telegraf<MyContext>) => {
  async function handlerChangeTime(ctx: MyContext) {
    ctx.session.activeStep = 'changeTime';

    await ctx.reply(
      'Теперь выберите время, когда вам будет удобно получать задания.\nВыберите удобное время (по МСК):',
      timeButtons
    );
  }

  bot.command('changetime', async (ctx) => {
    handlerChangeTime(ctx);
  });

  bot.action('changeTime_action', async (ctx) => {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    handlerChangeTime(ctx);
  });

  bot.action(/time_(\d{2}:\d{2})/, async (ctx) => {
    ctx.deleteMessage();
    const selectedTime = ctx.match[1];
    const userId = ctx.from?.id;

    try {
      await pool.query('UPDATE users SET quest_time = $1 WHERE user_id = $2', [
        selectedTime,
        userId,
      ]);
      ctx.reply(
        `Время успешно изменено на ${selectedTime}.\nТеперь Вы будете получать задания по этому времени.`
      );
    } catch (error) {
      console.error(error);
      ctx.reply('Произошла ошибка при изменении времени.');
    }
  });
};

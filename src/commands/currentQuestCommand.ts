import { Context, Telegraf } from 'telegraf';
import { MyContext } from '../models/session';
import pool from '../services/sql';
import {
  getDefaultTaskText,
  getUserTaskText,
} from '../services/schedule/sendDailyMessage';
import * as messages from '../messages/main';
import { Update, Message } from 'telegraf/typings/core/types/typegram';

interface CurrentQuestResponse {
  subscription: boolean;
  is_sent_today: boolean;
  is_completed_today: boolean;
  active_task: number;
}
async function getUserData(
  userId: number
): Promise<CurrentQuestResponse | null> {
  try {
    const res = await pool.query(
      'SELECT subscription, is_sent_today, is_completed_today, active_task FROM users WHERE user_id = $1',
      [userId]
    );
    if (res.rows.length > 0) {
      return res.rows[0] as CurrentQuestResponse;
    } else {
      return null; // или throw new Error('Пользователь не найден'), в зависимости от твоей логики обработки ошибок
    }
  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error);
    return null; // или throw error, если ты хочешь перенаправить ошибку
  }
}

async function sendUserTask(
  ctx: Context<{
    message: Update.New & Update.NonChannel & Message.TextMessage;
    update_id: number;
  }> &
    Omit<MyContext, keyof Context<Update>>,
  taskId: number
) {
  const taskText =
    taskId > 50
      ? await getUserTaskText(taskId)
      : await getDefaultTaskText(taskId);
  if (taskText) {
    await ctx.reply(`Ваше задание: ${taskText}`);
    await ctx.reply(messages.completionMessage, { parse_mode: 'Markdown' });
    ctx.session.activeStep = 'questAnswer';
  }
}

export const currentQuestCommand = async (bot: Telegraf<MyContext>) => {
  bot.command('currentquest', async (ctx) => {
    if (ctx.session.todayTask && ctx.session.todayTask.text) {
      await ctx.reply(`Ваше задание: ${ctx.session.todayTask.text}`);
      await ctx.reply(messages.completionMessage, { parse_mode: 'Markdown' });
      ctx.session.activeStep = 'questAnswer';
    } else {
      const res = await getUserData(ctx.from.id);
      if (!res) {
        await ctx.reply(
          'Произошла ошибка. Мы уже этим занимаемся. Повторите попытку позже'
        );
        return;
      }

      if (!res.subscription) {
        await ctx.reply(
          'У вас не оплачена подписка. Пожалуйста, оплатите доступ'
        );
        return;
      }

      if (!res.is_sent_today) {
        await ctx.reply(
          'Вы еще не получили ежедневное задание. Пожалуйста, дождитесь нашего сообщения'
        );
        return;
      }

      if (res.is_completed_today) {
        await ctx.reply(
          'Вы уже выполнили сегодняшнее задание. Вернемся к Вам завтра)'
        );
        return;
      }

      await sendUserTask(ctx, res.active_task);
    }
  });
};

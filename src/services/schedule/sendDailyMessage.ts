import { Markup, Telegraf } from 'telegraf';
import { MyContext } from '../../models/session';
import * as messages from '../../messages/main';
import pool from '../sql';

interface UserTaskInfo {
  user_id: number;
  quest_time: string; // Предполагая, что время задается в виде строки, например "10:00"
  task_days: number;
}

async function getUsersAndTheirTimes(): Promise<UserTaskInfo[]> {
  try {
    const res = await pool.query(`
      SELECT u.user_id, u.quest_time, u.task_days
      FROM users u
      WHERE u.quest_time IS NOT NULL
      AND u.subscription = TRUE
      AND u.is_sent_today = FALSE
    `);
    return res.rows as UserTaskInfo[];
  } catch (error) {
    console.error('Ошибка при получении данных из базы:', error);
    return [];
  }
}

export async function getDefaultTaskText(taskId: number) {
  try {
    const taskRes = await pool.query(
      'SELECT quest_text FROM default_tasks WHERE task_id = $1',
      [taskId]
    );
    return taskRes.rows[0]?.quest_text || '';
  } catch (error) {
    console.error('Ошибка при получении текста задания из базы:', error);
    return '';
  }
}

export async function sendDailyMessage(bot: Telegraf<MyContext>) {
  const users = await getUsersAndTheirTimes();
  const currentTime = new Date();
  const localTime = new Date(currentTime.getTime());

  // Отправка заданий
  for (const user of users) {
    const [hours, minutes] = user.quest_time.split(':').map(Number);
    const userTime = new Date(currentTime.setHours(hours, minutes, 0, 0));

    if (
      localTime.getHours() === userTime.getHours() &&
      localTime.getMinutes() === userTime.getMinutes()
    ) {
      try {
        // Получение активного задания пользователя
        const activeTaskRes = await pool.query(
          'SELECT active_task, task_days FROM users WHERE user_id = $1',
          [user.user_id]
        );
        let { active_task, task_days } = activeTaskRes.rows[0];

        task_days++;

        // Проверка, достиг ли пользователь 12 дней
        if (task_days > 12) {
          task_days = 1;
          active_task++;
          // Дополнительные действия при смене active_task, если необходимо
        }

        // Обновление активного задания пользователя, task_days и отправка сообщения
        await pool.query(
          'UPDATE users SET active_task = $1, is_sent_today = TRUE, task_days = $2 WHERE user_id = $3',
          [active_task, task_days, user.user_id]
        );

        // Получение текста задания
        const taskText = await getDefaultTaskText(active_task);

        // Обновление активного задания пользователя, task_days и отправка сообщения
        await pool.query(
          'UPDATE users SET active_task = $1, is_sent_today = TRUE, task_days = $2 WHERE user_id = $3',
          [active_task, task_days, user.user_id]
        );
        const activeTaskId = activeTaskRes.rows[0]?.active_task;

        // Получение текста задания

        // Обновление активного задания пользователя и отправка сообщения
        try {
          await pool.query(
            'UPDATE users SET active_task = $1, is_sent_today = TRUE, task_days = task_days + 1 WHERE user_id = $2',
            [activeTaskId, user.user_id]
          );
          if (task_days === 1) {
            if (activeTaskId === 1) {
              await bot.telegram.sendMessage(
                user.user_id,
                messages.firstStageIntroduction
              );
            }
            if (activeTaskId === 2) {
              await bot.telegram.sendMessage(
                user.user_id,
                messages.secondStageIntroduction
              );
            }
            if (activeTaskId === 3) {
              await bot.telegram.sendMessage(
                user.user_id,
                messages.thirdStageIntroduction
              );
            }
          }
          // Отправка текста задания пользователю
          await bot.telegram.sendMessage(
            user.user_id,
            `Ваше задание: ${taskText}`,
            Markup.inlineKeyboard([
              Markup.button.callback(
                'Приступить к выполнению',
                `accept_task_${activeTaskId}`
              ),
            ])
          );
        } catch (error) {
          console.error('Ошибка при обновлении задания пользователя:', error);
        }
      } catch (error) {
        console.error('Ошибка при отправке задания:', error);
      }
    }
  }
  bot.action(/accept_task_(\d+)/, async (ctx) => {
    // Обработка принятия задания
    const taskId = parseInt(ctx.match[1]);

    // Удаление кнопок
    ctx.deleteMessage();

    // Отправка текста задания без кнопок
    const taskText = await getDefaultTaskText(taskId);
    ctx.session.todayTask = { taskId: taskId, text: taskText };
    if (taskId === 1) {
      await ctx.reply(messages.firstCompletionInstructions, {
        parse_mode: 'Markdown',
      });
    }
    if (taskId === 2) {
      await ctx.reply(messages.secondCompletionInstructions, {
        parse_mode: 'Markdown',
      });
    }
    if (taskId === 3) {
      await ctx.reply(messages.thirdCompletionInstructions, {
        parse_mode: 'Markdown',
      });
    }
    ctx.session.isTaskChanged = false;
    ctx.session.activeStep = 'questAnswer';
  });
}

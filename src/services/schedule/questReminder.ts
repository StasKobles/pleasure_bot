import { Telegraf } from 'telegraf';
import { MyContext } from '../../models/session';
import pool from '../sql';
import { getRandomReminder } from '../../messages/reminders';

export async function sendReminder(bot: Telegraf<MyContext>) {
  try {
    const users = await getUsersForReminder();
    for (const user of users) {
      // Отправка напоминания
      const reminderText = getRandomReminder();

      // Отправка напоминания
      await bot.telegram.sendMessage(user.user_id, reminderText);

      // Обновление флага напоминания в БД
      await pool.query(
        'UPDATE users SET is_reminder_sent = TRUE WHERE user_id = $1',
        [user.user_id]
      );
    }
  } catch (error) {
    console.error('Ошибка при отправке напоминаний:', error);
  }
}

async function getUsersForReminder() {
  const currentTime = new Date();
  const reminderTime = new Date(currentTime.getTime() - 2 * 60 * 60 * 1000); // На 2 часа раньше
  try {
    const res = await pool.query(
      `
        SELECT u.user_id
        FROM users u
        WHERE u.quest_time <= $1
        AND u.is_sent_today = TRUE
        AND u.is_completed_today = FALSE
        AND u.is_reminder_sent = FALSE
      `,
      [reminderTime.toISOString().slice(0, 19).replace('T', ' ')]
    ); // Форматирование для совместимости с SQL
    return res.rows;
  } catch (error) {
    console.error('Ошибка при получении пользователей для напоминаний:', error);
    return [];
  }
}

import { Telegraf } from "telegraf";
import { questConfirmButtons } from "../../keyboards/keyboards";
import { MyContext } from "../../models/session";
import * as messages from "../../messages/main";
import pool from "../sql";

async function getUsersAndTheirTimes() {
  try {
    // Замените 'pool' на ваше соединение с базой данных
    const res = await pool.query(`
      SELECT u.user_id, u.quest_time
      FROM users u
      WHERE u.quest_time IS NOT NULL
      AND u.subscription = TRUE
      AND u.is_sent_today = FALSE
    `);
    return res.rows;
  } catch (error) {
    console.error("Ошибка при получении данных из базы:", error);
    return [];
  }
}

// Функция для получения случайного задания
async function getRandomTask(userId: number, excludeTaskId: number) {
  try {
    // Получаем тексты 50 заданий из default_tasks
    const defaultTasksRes = await pool.query(
      "SELECT task_id, quest_text FROM default_tasks"
    );
    const defaultTasks = defaultTasksRes.rows;

    let userTasks: any[] = [];

    if (excludeTaskId > 50) {
      // Получаем задания текущего пользователя
      const userTasksRes = await pool.query(
        "SELECT task_id, quest_text FROM tasks WHERE user_id = $1 AND is_completed = FALSE AND task_id != $2",
        [userId, excludeTaskId]
      );
      userTasks = userTasksRes.rows;
    }

    // Фильтруем default_tasks, исключая те, которые уже есть у пользователя
    const availableTasks = defaultTasks.filter(
      (task) =>
        !userTasks.some((userTask) => userTask.quest_text === task.quest_text)
    );

    if (availableTasks.length > 0) {
      // Выбираем случайное задание из доступных
      const randomTask: { quest_text: string; task_id: number } =
        availableTasks[Math.floor(Math.random() * availableTasks.length)];
      return randomTask;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Ошибка при получении случайного задания из базы:", error);
    return null;
  }
}

async function getUserTaskText(taskId: number) {
  try {
    const taskRes = await pool.query(
      "SELECT quest_text FROM tasks WHERE task_id = $1",
      [taskId]
    );
    return taskRes.rows[0]?.quest_text || "";
  } catch (error) {
    console.error("Ошибка при получении текста задания из базы:", error);
    return "";
  }
}

async function getDefaultTaskText(taskId: number) {
  try {
    const taskRes = await pool.query(
      "SELECT quest_text FROM default_tasks WHERE task_id = $1",
      [taskId]
    );
    return taskRes.rows[0]?.quest_text || "";
  } catch (error) {
    console.error("Ошибка при получении текста задания из базы:", error);
    return "";
  }
}

export async function sendDailyMessage(bot: Telegraf<MyContext>) {
  const users = await getUsersAndTheirTimes();
  const currentTime = new Date();
  const localTime = new Date(currentTime.getTime());
  // Отправка заданий
  for (const user of users) {
    // Определение времени отправки задания
    // ...

    const [hours, minutes] = user.quest_time.split(":").map(Number);
    const userTime = new Date(currentTime.setHours(hours, minutes, 0, 0));

    if (
      localTime.getHours() === userTime.getHours() &&
      localTime.getMinutes() === userTime.getMinutes()
    ) {
      try {
        // Получение активного задания пользователя
        const activeTaskRes = await pool.query(
          "SELECT active_task FROM users WHERE user_id = $1",
          [user.user_id]
        );
        const activeTaskId = activeTaskRes.rows[0]?.active_task;

        // Получение случайного задания
        const randomTask = await getRandomTask(user.user_id, activeTaskId);

        if (randomTask) {
          await bot.telegram.sendMessage(
            user.user_id,
            `Ваше задание: ${randomTask.quest_text}`,
            questConfirmButtons(randomTask.task_id)
          );

          // Обновление активного задания пользователя
          try {
            await pool.query(
              "UPDATE users SET active_task = $1, is_sent_today = TRUE WHERE user_id = $2",
              [randomTask.task_id, user.user_id]
            );
          } catch (error) {
            console.error("Ошибка при получение задания:", error);
          }
        }
      } catch (error) {
        console.error("Ошибка при отправке задания:", error);
      }
    }
  }
  bot.action(/replace_task_(\d+)/, async (ctx) => {
    ctx.deleteMessage();
    const taskId = parseInt(ctx.match[1]);
    const userId = ctx.from?.id;

    // Получение и отправка нового задания
    const newTask = await getRandomTask(userId || 0, taskId);
    if (newTask) {
      await ctx.reply(
        `Ваше новое задание: ${newTask.quest_text}`,
        questConfirmButtons(newTask.task_id)
      );
      await pool.query("UPDATE users SET active_task = $1 WHERE user_id = $2", [
        newTask.task_id,
        userId,
      ]);
    } else {
      await ctx.reply("Больше нет доступных заданий.");
    }
  });
  bot.action(/accept_task_(\d+)/, async (ctx) => {
    // Обработка принятия задания
    const taskId = parseInt(ctx.match[1]);
    const userId = ctx.from?.id;

    // Удаление кнопок
    ctx.deleteMessage();

    // Отправка текста задания без кнопок
    const taskText =
      taskId > 50
        ? await getUserTaskText(taskId)
        : await getDefaultTaskText(taskId);
    if (taskText) {
      await ctx.reply(`Ваше задание: ${taskText}`);
    }
    await ctx.reply(messages.completionMessage);
    ctx.session.activeStep = "questAnswer";
  });
}

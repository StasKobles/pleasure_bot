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

async function getRandomTask(userId: number, excludeTaskId: number) {
  try {
    // Получаем список выполненных заданий пользователя
    const completedTasksRes = await pool.query(
      "SELECT completed_tasks FROM users WHERE user_id = $1",
      [userId]
    );
    const completedTasks = completedTasksRes.rows[0]?.completed_tasks || [];

    // Получаем список всех заданий по умолчанию
    const defaultTasksRes = await pool.query(
      "SELECT task_id, quest_text FROM default_tasks"
    );
    const defaultTasks = defaultTasksRes.rows;

    // Получаем список незавершенных заданий пользователя, исключая текущее активное задание
    const userTasksRes = await pool.query(
      "SELECT task_id, quest_text FROM tasks WHERE user_id = $1 AND is_completed = FALSE AND task_id != $2",
      [userId, excludeTaskId]
    );
    const userTasks = userTasksRes.rows;

    // Фильтруем список заданий по умолчанию и пользовательских заданий, исключая те, которые уже выполнены
    const filteredDefaultTasks = defaultTasks.filter(
      (task) => !completedTasks.includes(task.task_id)
    );
    const filteredUserTasks = userTasks.filter(
      (task) => !completedTasks.includes(task.task_id)
    );

    // Вероятность выбора задания из списка пользователя
    const userTaskProbability = 0.7;
    let randomTask;

    // Пытаемся выбрать задание из списка пользователя с определенной вероятностью
    if (filteredUserTasks.length > 0 && Math.random() < userTaskProbability) {
      randomTask = filteredUserTasks[Math.floor(Math.random() * filteredUserTasks.length)];
    } else {
      // Если задание из списка пользователя не выбрано, используем взвешенный выбор
      const tasksWithWeights = [
        ...filteredUserTasks.map((task) => ({ item: task, weight: 2 })), // Пользовательские задания имеют больший вес
        ...filteredDefaultTasks.map((task) => ({ item: task, weight: 1 })), // Задания по умолчанию имеют стандартный вес
      ];

      randomTask = weightedRandomSelect(tasksWithWeights);
    }

    return randomTask || null;
  } catch (error) {
    console.error("Ошибка при получении случайного задания из базы:", error);
    return null;
  }
}


// Функция для взвешенного случайного выбора
function weightedRandomSelect<T>(items: Array<{ item: T; weight: number }>): T {
  const totalWeight = items.reduce((sum, { weight }) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (const { item, weight } of items) {
    if (random < weight) return item;
    random -= weight;
  }
  return items[items.length - 1].item; // На случай числовой погрешности
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
    ctx.session.todayTask = { taskId: taskId, text: taskText };
    await ctx.reply(messages.completionMessage);
    ctx.session.activeStep = "questAnswer";
  });
}

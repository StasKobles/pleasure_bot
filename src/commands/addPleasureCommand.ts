import { Markup, NarrowedContext, Telegraf } from "telegraf";
import pool from "../services/sql";
import { MyContext } from "../models/session";
import { Update, Message } from "telegraf/typings/core/types/typegram";

// export const pleasureListCommand = (bot: Telegraf<MyContext>) => {
//   async function handlePleasureList(ctx: MyContext) {
//     const userId = ctx.from?.id;
//     ctx.session.activeStep = "pleasureList";
//     try {
//       // Использование сессии для отслеживания количества заданий
//       const res = await pool.query(
//         "SELECT COUNT(*) FROM tasks WHERE user_id = $1",
//         [userId]
//       );
//       const taskCount = parseInt(res.rows[0].count);
//       ctx.session.taskCount = taskCount;
//       if (taskCount >= 33) {
//         ctx.reply("Вы уже ввели все 33 задания!");
//         ctx.session.activeStep = undefined;
//       }
//       if (taskCount === 0) {
//         ctx.reply(
//           `Отправьте мне свое первое задание, чтобы начать свой список удовольствий`
//         );
//       } else {
//         ctx.reply(
//           `У вас уже есть ${taskCount} заданий. Введите задание номер ${
//             taskCount + 1
//           }.`
//         );
//       }
//     } catch (error) {
//       console.error(error);
//       ctx.reply("Произошла ошибка при проверке ваших заданий.");
//       ctx.session.activeStep = undefined;
//     }
//   }

//   bot.command("pleasureList", async (ctx) => {
//     handlePleasureList(ctx);
//   });

//   bot.action("pleasure_button", async (ctx) => {
//     await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
//     handlePleasureList(ctx);
//   });
// };
export const addPleasureCommand = (bot: Telegraf<MyContext>) => {
  async function addPleasure(ctx: MyContext, type: "registration" | "command") {
    ctx.session.activeStep =
      type === "registration" ? "pleasureList" : "addPleasure";
    try {
      ctx.reply(
        `Ваш список заданий готов! Хотите добавить свои дополнительные задания?`,
        Markup.inlineKeyboard([
          Markup.button.callback(
            "Да, добавить свое задание",
            "addPleasureTextInput_action"
          ),
          Markup.button.callback("Далее", "changeTime_action"),
        ])
      );
    } catch (error) {
      console.error(error);
      ctx.reply("Произошла ошибка при проверке ваших заданий.");
      ctx.session.activeStep = undefined;
    }
  }

  bot.command("addpleasure", async (ctx) => {
    addPleasure(ctx, "command");
  });

  bot.action("addPleasure_action", async (ctx) => {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    addPleasure(ctx, "registration");
  });

  bot.action("addPleasureTextInput_action", async (ctx) => {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.reply("Введите свое задание!");
  });

  bot.action("resetButton_action", async (ctx) => {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.reply('Ваши задания добавлены в Вашу персональную базу!')
  });
};
// export const pleasureListTextHandler = async (
//   ctx: NarrowedContext<
//     MyContext,
//     {
//       message: Update.New & Update.NonChannel & Message.TextMessage;
//       update_id: number;
//     }
//   >
// ) => {
//   const userId = ctx.from.id;
//   // Используем сессию для проверки состояния задачи
//   if (ctx.session.taskCount !== undefined && ctx.session.taskCount < 33) {
//     const taskText = ctx.message.text;

//     if (taskText.length < 3 || taskText.length > 200) {
//       ctx.reply("Введите корректное описание задания (от 3 до 200 символов)");
//     } else {
//       await pool.query(
//         "INSERT INTO tasks (user_id, quest_text) VALUES ($1, $2)",
//         [userId, taskText]
//       );
//       ctx.session.taskCount++;

//       if (ctx.session.taskCount < 33) {
//         ctx.reply(
//           `Задание ${ctx.session.taskCount} сохранено. Введите задание номер ${
//             ctx.session.taskCount + 1
//           }.`
//         );
//       } else {
//         ctx.session.activeStep = undefined;
//         ctx.reply(
//           "Отлично, Вы ввели все 33 задания! Осталось только",
//           Markup.inlineKeyboard([
//             Markup.button.callback("Выбрать время", "changeTime_action"),
//           ])
//         );
//       }
//     }
//   }
// };
export const addPleasureTextHandler = async (
  ctx: NarrowedContext<
    MyContext,
    {
      message: Update.New & Update.NonChannel & Message.TextMessage;
      update_id: number;
    }
  >,
  type: "registration" | "command"
) => {
  const userId = ctx.from.id;
  const taskText = ctx.message.text;

  if (taskText.length < 3 || taskText.length > 200) {
    ctx.reply("Введите корректное описание задания (от 3 до 200 символов)");
  } else {
    await pool.query(
      "INSERT INTO tasks (user_id, quest_text) VALUES ($1, $2)",
      [userId, taskText]
    );
    ctx.reply(
      `Задание добавлено. Хотите добавить еще?`,
      Markup.inlineKeyboard([
        Markup.button.callback(
          "Да, добавить еще",
          "addPleasureTextInput_action"
        ),
        Markup.button.callback(
          "Далее",
          type === "registration" ? "changeTime_action" : "resetButton_action"
        ),
      ])
    );
  }
};

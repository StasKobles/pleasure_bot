import { Telegraf } from "telegraf";
import { addPleasureTextHandler } from "../commands/addPleasureCommand";
import { startTextHandler } from "../commands/startCommand";
import { MyContext } from "../models/session";
import { currentQuestTaskHandler } from "./currentQuestTaskHandler";
import pool from "../services/sql";
import { adminChatId } from "../config/config";
import { helpTextHandler } from "./helpTextHandler";

export const textController = (bot: Telegraf<MyContext>) => {
  bot.on("text", async (ctx) => {
    if (ctx.session.activeStep === "start") {
      startTextHandler(ctx);
    }
    if (ctx.session.activeStep === "pleasureList") {
      addPleasureTextHandler(ctx, "registration");
    }
    if (ctx.session.activeStep === "addPleasure") {
      addPleasureTextHandler(ctx, "command");
    }
    if (ctx.session.activeStep === "questAnswer") {
      currentQuestTaskHandler(ctx);
    }
    if (ctx.session.activeStep === "questHelp") {
      helpTextHandler(ctx, "quests");
    }
    if (ctx.session.activeStep === "botHelp") {
      helpTextHandler(ctx, "bot");
    }
    if (ctx.session.activeStep === "subHelp") {
      helpTextHandler(ctx, "subscription");
    }
  });
  bot.on("photo", async (ctx) => {
    if (ctx.session.activeStep === "questAnswer") {
      const userId = ctx.from?.id;
      if (userId) {
        if (ctx.message.caption) {
          const userRes = await pool.query(
            "SELECT active_task, subscription FROM users WHERE user_id = $1",
            [userId]
          );
          const userRecord = userRes.rows[0];

          if (userRecord) {
            const { active_task, subscription } = userRecord;

            if (active_task && subscription) {
              // Если сообщение начинается с "/", предложим отправить отчет

              // Благодарность за отчет и пересылка сообщения в админский канал
              await ctx.reply("Спасибо за отчет! Мы скоро свяжемся с вами. 🌟");
              ctx.session.activeStep === undefined;

              // Получение пользователя
              const user = ctx.from;

              // Полная информация о сообщении пользователя
              const userMessage = ctx.message;

              // Формирование сообщения для админского канала
              const adminMessage = `#${user.id}
              Задание: ${ctx.session.todayTask?.text}
              ${userMessage.caption}`;

              await pool.query(
                "UPDATE users SET is_completed_today = TRUE, completed_tasks = array_append(completed_tasks, $1) WHERE user_id = $2",
                [active_task, userId]
              );

              // Пересылка сообщения в админский канал
              await ctx.telegram.sendPhoto(
                adminChatId,
                userMessage.photo[0].file_id,
                {
                  caption: adminMessage,
                }
              );
              ctx.session.activeStep = undefined;
            }
          }
        } else {
          await ctx.reply(
            "Пожалуйста, отправьте свой отчет заново и ОБЯЗАТЕЛЬНО прикрепите описание"
          );
        }
      }
    }
  });
};

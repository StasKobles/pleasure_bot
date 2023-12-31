import { Markup, Telegraf } from "telegraf";
import { MyContext } from "../models/session";
<<<<<<< HEAD
import * as messages from "../messages/main";

export const helpCommand = (bot: Telegraf<MyContext>) => {
  bot.help(async (ctx) => {
    const helpMessage =
      "Какую помощь вы ищете? Выберите один из вариантов ниже:";
    await ctx.reply(
      helpMessage,
      Markup.inlineKeyboard([
        Markup.button.callback("Подписка", "help_subscription"),
        Markup.button.callback("Работа бота", "help_bot_functionality"),
        Markup.button.callback("Задания", "help_tasks"),
      ])
    );
  });

  // Обработчики для каждой кнопки
  bot.action("help_subscription", async (ctx) => {
    ctx.session.activeStep === "subHelp";
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    // Логика обработки запроса помощи по подписке
    await ctx.reply(messages.preHelpText);
  });

  bot.action("help_bot_functionality", async (ctx) => {
    ctx.session.activeStep === "botHelp";

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    // Логика обработки запроса помощи по работе бота
    await ctx.reply(messages.preHelpText);
  });

  bot.action("help_tasks", async (ctx) => {
    ctx.session.activeStep === "subHelp";

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    // Логика обработки запроса помощи по заданиям
    await ctx.reply(messages.preHelpText);
  });
};
=======
import * as messages from '../messages/main'

export const helpCommand = (bot: Telegraf<MyContext>) => {
    bot.help(async (ctx) => {
        const helpMessage = "Какую помощь вы ищете? Выберите один из вариантов ниже:";
        await ctx.reply(helpMessage, Markup.inlineKeyboard([
            Markup.button.callback('Подписка', 'help_subscription'),
            Markup.button.callback('Работа бота', 'help_bot_functionality'),
            Markup.button.callback('Задания', 'help_tasks')
        ]));
    });

    // Обработчики для каждой кнопки
    bot.action('help_subscription', async (ctx) => {
        // Логика обработки запроса помощи по подписке
        await ctx.reply(messages.preHelpText);
    });

    bot.action('help_bot_functionality', async (ctx) => {
        // Логика обработки запроса помощи по работе бота
        await ctx.reply(messages.preHelpText);

    });

    bot.action('help_tasks', async (ctx) => {
        // Логика обработки запроса помощи по заданиям
        await ctx.reply(messages.preHelpText);

    });
};
>>>>>>> 06bfd3420e67c7f267885c2454175c0abfb8751c

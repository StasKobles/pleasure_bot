import { Markup, Telegraf } from "telegraf";
import * as messages from "../messages/main";
import { yooKassaApiKey } from "../config/config";
import pool from "../services/sql";
import { MyContext } from "../models/session";

export const subscriptionCommand = async (bot: Telegraf<MyContext>) => {
  bot.command("subscribe", async (ctx) => {
    const userId = ctx.from?.id;

    try {
      // Получение информации о подписке пользователя
      const result = await pool.query(
        "SELECT subscription FROM users WHERE user_id = $1",
        [userId]
      );

      // Проверка наличия подписки у пользователя
      const isSubscribed = result.rows[0]?.subscription || false;

      if (isSubscribed) {
        await ctx.reply("Вы уже подписаны.");
      } else {
        await ctx.reply(
          messages.preSubscriptionText,
          Markup.inlineKeyboard([
            Markup.button.callback("Оформить подписку", "subscribe_button"),
          ])
        );
      }
    } catch (error) {
      console.error("Ошибка при проверке подписки пользователя:", error);
      await ctx.reply("Произошла ошибка при проверке подписки.");
    }
  });
  bot.action("subscribe_button", async (ctx) => {
    try {
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
      await ctx.reply(messages.subscriptionWelcomeMessage);

      await ctx.replyWithInvoice({
        provider_token: yooKassaApiKey,
        start_parameter: "get_subscription", // Уникальный параметр
        title: 'Подписка на бот "33 удовольствия"',
        description: 'Оплата подписки на бот "33 удовольствия"',
        currency: "RUB",
        prices: [{ label: "Подписка", amount: 29900 }], // Цена в копейках
        payload: `${ctx.from?.id}_${Date.now()}`,
      });
    } catch (error) {
      console.error(error);
    }
  });

  bot.on("pre_checkout_query", async (ctx) => {
    await ctx.answerPreCheckoutQuery(true);
  });

  bot.on("successful_payment", async (ctx) => {
    const userId = ctx.from.id;

    try {
      // Обновление статуса подписки в базе данных
      await pool.query(
        "UPDATE users SET subscription = TRUE WHERE user_id = $1",
        [userId]
      );
      const res = await pool.query(
        "SELECT COUNT(*) FROM tasks WHERE user_id = $1",
        [userId]
      );
      const taskCount = parseInt(res.rows[0].count);
      // Отправка сообщения об успешной оплате
      await ctx.reply(
        messages.successfulSubscriptionMessage,
        taskCount === 33
          ? undefined
          : Markup.inlineKeyboard([
              Markup.button.callback(
                "Перейти к заданиям",
                "addPleasure_action"
              ),
            ])
      );
    } catch (error) {
      console.error(error);
      ctx.reply(messages.paymentError);
    }
  });
};


// import { Markup, Telegraf } from "telegraf";
// import * as messages from "../messages/main";
// import {
//   robokassaPassword1,
//   robokassaPassword2,
//   shopId,
//   subscriptionPrice,
//   yooKassaApiKey,
// } from "../config/config";
// import pool from "../services/sql";
// import { MD5 } from "crypto-js";
// import { MyContext } from "../models/session";

// export const subscriptionCommand = async (bot: Telegraf<MyContext>) => {
//   bot.command("subscribe", async (ctx) => {
//     const userId = ctx.from?.id;

//     try {
//       // Получение информации о подписке пользователя
//       const result = await pool.query(
//         "SELECT subscription FROM users WHERE user_id = $1",
//         [userId]
//       );

//       // Проверка наличия подписки у пользователя
//       const isSubscribed = result.rows[0]?.subscription || false;

//       if (isSubscribed) {
//         await ctx.reply("Вы уже подписаны.");
//       } else {
//         const signatureValue1 = MD5(
//           `${shopId}:${subscriptionPrice}:${userId}:${robokassaPassword1}`
//         ).toString();
//         const keyboard = Markup.inlineKeyboard([
//           Markup.button.url(
//             messages.preSubscriptionText,
//             `https://auth.robokassa.ru/Merchant/Index.aspx?MerchantLogin=${shopId}&OutSum=${subscriptionPrice}&InvoiceID=${userId}&Description=Test&SignatureValue=${signatureValue1}&istest=1`
//           ),
//         ]);

//         await ctx.reply("Ссылка на оплату", {
//           reply_markup: keyboard.reply_markup,
//         });
//         const signatureValue2 = MD5(
//           `${shopId}:${userId}:${robokassaPassword2}`
//         ).toString();
//         await ctx.reply("Проверить оплату", {
//           reply_markup: Markup.inlineKeyboard([
//             Markup.button.url(
//               "Проверить оплату",
//               `https://auth.robokassa.ru/Merchant/WebService/Service.asmx/OpStateExt?MerchantLogin=${shopId}&InvoiceID=${userId}&Signature=${signatureValue2}&istest=1`
//             ),
//           ]).reply_markup,
//         });
//       }
//     } catch (error) {
//       console.error("Ошибка при проверке подписки пользователя:", error);
//       await ctx.reply("Произошла ошибка при проверке подписки.");
//     }
//   });
//   bot.action("subscribe_button", async (ctx) => {
//     try {
//       await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
//       await ctx.reply(messages.subscriptionWelcomeMessage);

//       await ctx.replyWithInvoice({
//         provider_token: yooKassaApiKey,
//         start_parameter: "get_subscription", // Уникальный параметр
//         title: 'Подписка на бот "33 удовольствия"',
//         description: 'Оплата подписки на бот "33 удовольствия"',
//         currency: "RUB",
//         prices: [{ label: "Подписка", amount: 29900 }], // Цена в копейках
//         payload: `${ctx.from?.id}_${Date.now()}`,
//       });
//     } catch (error) {
//       console.error(error);
//     }
//   });

//   bot.on("pre_checkout_query", async (ctx) => {
//     await ctx.answerPreCheckoutQuery(true);
//   });

//   bot.on("successful_payment", async (ctx) => {
//     const userId = ctx.from.id;

//     try {
//       // Обновление статуса подписки в базе данных
//       await pool.query(
//         "UPDATE users SET subscription = TRUE WHERE user_id = $1",
//         [userId]
//       );
//       const res = await pool.query(
//         "SELECT COUNT(*) FROM tasks WHERE user_id = $1",
//         [userId]
//       );
//       const taskCount = parseInt(res.rows[0].count);
//       // Отправка сообщения об успешной оплате
//       await ctx.reply(
//         messages.successfulSubscriptionMessage,
//         taskCount === 33
//           ? undefined
//           : Markup.inlineKeyboard([
//               Markup.button.callback(
//                 "Перейти к заданиям",
//                 "addPleasure_action"
//               ),
//             ])
//       );
//     } catch (error) {
//       console.error(error);
//       ctx.reply(messages.paymentError);
//     }
//   });
// };

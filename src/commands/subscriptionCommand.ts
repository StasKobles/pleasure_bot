import { Markup, NarrowedContext, Telegraf } from "telegraf";
import { Message, Update } from "telegraf/typings/core/types/typegram";
import * as messages from "../messages/main";
import { MyContext } from "../models/session";
import pool from "../services/sql";
import { isValidEmail } from "../utils/isValidEmail";

export const subscriptionTextHandler = async (
  ctx: NarrowedContext<
    MyContext,
    {
      message: Update.New & Update.NonChannel & Message.TextMessage;
      update_id: number;
    }
  >
) => {
  const email = ctx.message.text;

  // Проверка валидности email
  if (!isValidEmail(email)) {
    ctx.reply("Неверный формат email. Пожалуйста, введите корректный email.");
    return;
  }

  // Запрос в базу данных
  try {
    const result = await pool.query(
      "SELECT * FROM emails WHERE email = $1 AND user_id = 1",
      [email]
    );

    if (result.rowCount && result.rowCount > 0) {
      try {
        const updateResult = await pool.query(
          "UPDATE users SET subscription = true, email = $1 WHERE user_id = $2",
          [email, ctx.from.id]
        );

        if (updateResult.rowCount && updateResult.rowCount > 0) {
          try {
            // Обновление user_id в таблице emails
            const updateEmailResult = await pool.query(
              "UPDATE emails SET user_id = $1 WHERE email = $2",
              [ctx.from.id, email]
            );

            if (updateEmailResult.rowCount && updateEmailResult.rowCount > 0) {
              console.log(
                `Email обновлён для пользователя с ID: ${ctx.from.id}`
              );
            } else {
              console.log("Email не был обновлен в базе данных.");
            }

            ctx.session.activeStep = undefined;
            ctx.reply(messages.successfulSubscriptionMessage);
            // Отправка уведомления пользователю, если необходимо
          } catch (error) {
            console.error(
              "Ошибка при обновлении email пользователя в базе данных:",
              error
            );
            // Отправка сообщения об ошибке пользователю, если необходимо
          }
          // Дополнительная логика при необходимости
        } else {
          ctx.reply(
            "Совпадений не найдено. Проверьте данные и отправьте снова."
          );
        }
      } catch (error) {
        console.error(
          "Ошибка при обновлении пользователя в базе данных:",
          error
        );
        // Отправка сообщения об ошибке пользователю, если необходимо
      }
      // Дополнительная логика при необходимости
    } else {
      ctx.reply("Совпадений не найдено. Проверьте данные и отправьте снова.");
    }
  } catch (error) {
    console.error("Ошибка при запросе к базе данных:", error);
    ctx.reply("Произошла ошибка при обработке вашего запроса.");
  }
};
export const subscriptionCommand = async (bot: Telegraf<MyContext>) => {
  const subscribe = async (ctx: MyContext) => {
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
        // const invoiceId = 1000;
        // const signatureValue1 = MD5(
        //   `${shopId}:${subscriptionPrice}:${invoiceId}:${robokassaPassword1}`
        // ).toString();
        // const keyboard = Markup.inlineKeyboard([
        //   Markup.button.url(
        //     messages.preSubscriptionText,
        //     `https://auth.robokassa.ru/Merchant/Index.aspx?MerchantLogin=${shopId}&OutSum=${subscriptionPrice}&InvoiceID=${invoiceId}&Description=Test&SignatureValue=${signatureValue1}&Recurring=true`
        //   ),
        // ]);
        const keyboard = Markup.inlineKeyboard([
          Markup.button.url(
            messages.preSubscriptionText,
            `https://auth.robokassa.ru/RecurringSubscriptionPage/Subscription/Subscribe?SubscriptionId=0a1bf99b-968f-485c-9fb4-587268ebab49`
          ),
        ]);

        await ctx.reply("Ссылка на оплату", {
          reply_markup: keyboard.reply_markup,
        });
        // const signatureValue2 = MD5(
        //   `${shopId}:${userId}:${robokassaPassword2}`
        // ).toString();
        // await ctx.reply("Проверить оплату", {
        //   reply_markup: Markup.inlineKeyboard([
        //     Markup.button.url(
        //       "Проверить оплату",
        //       `https://auth.robokassa.ru/Merchant/WebService/Service.asmx/OpStateExt?MerchantLogin=${shopId}&InvoiceID=${invoiceId}&Signature=${signatureValue2}&istest=1`
        //     ),
        //   ]).reply_markup,
        // });

        setTimeout(() => {
          ctx.reply(
            "Для проверки подписки введите свой Email, введенный Вами в форме оплаты:"
          );
          ctx.session.activeStep = "subscribe";
        }, 5000);
      }
    } catch (error) {
      console.error("Ошибка при проверке подписки пользователя:", error);
      await ctx.reply("Произошла ошибка при проверке подписки.");
    }
  };
  bot.command("subscribe", async (ctx) => {
    await subscribe(ctx);
  });
  bot.action("subscribe_button", async (ctx) => {
    try {
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
      await ctx.reply(messages.subscriptionWelcomeMessage);

      await subscribe(ctx);

      // await ctx.replyWithInvoice({
      //   provider_token: yooKassaApiKey,
      //   start_parameter: "get_subscription", // Уникальный параметр
      //   title: 'Подписка на бот "33 удовольствия"',
      //   description: 'Оплата подписки на бот "33 удовольствия"',
      //   currency: "RUB",
      //   prices: [{ label: "Подписка", amount: 29900 }], // Цена в копейках
      //   payload: `${ctx.from?.id}_${Date.now()}`,
      // });
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
// import { yooKassaApiKey } from "../config/config";
// import pool from "../services/sql";
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
//         await ctx.reply(
//           messages.preSubscriptionText,
//           Markup.inlineKeyboard([
//             Markup.button.callback("Оформить подписку", "subscribe_button"),
//           ])
//         );
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
//         start_parameter: `INV-${ctx.from?.id}-${Date.now()}`, // Уникальный параметр
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

import { NarrowedContext } from 'telegraf';
import { Message, Update } from 'telegraf/typings/core/types/typegram';
import { MyContext } from '../models/session';

export const currentQuestTaskHandler = async (
  ctx: NarrowedContext<
    MyContext,
    {
      message: Update.New & Update.NonChannel & Message.TextMessage;
      update_id: number;
    }
  >
) => {
  if (ctx.message?.text?.startsWith('/')) {
    await ctx.reply(
      'Пожалуйста, сначала отправьте отчет о выполнении задания.'
    );
    return;
  } else {
    await ctx.reply(
      'Пожалуйста, отправьте свое сообщение ЕЩЕ РАЗ и приложите к нему фото выполненного задания'
    );
  }
};

// export const currentQuestCommand = async (bot: Telegraf<MyContext>) => {
//   bot.command("currentQuest", async (ctx) => {
//     console.log("1");
//     const userId = ctx.from?.id;
//     if (userId) {
//       const userRes = await pool.query(
//         "SELECT active_task, subscription FROM users WHERE user_id = $1",
//         [userId]
//       );
//       const userRecord = userRes.rows[0];

//       if (userRecord) {
//         const { active_task, subscription } = userRecord;

//         if (subscription) {
//           if (active_task) {
//             const taskRes = await pool.query(
//               "SELECT quest_text FROM tasks WHERE task_id = $1",
//               [active_task]
//             );
//             const taskText = taskRes.rows[0]?.quest_text || "";
//             console.log(active_task);
//             await ctx.reply(taskText, questConfirmButtons(active_task.task_id));
//           } else {
//             await ctx.reply("У вас в данный момент нет активного задания. 🤔");
//           }
//         } else {
//           await ctx.reply(
//             "У вас не оплачена подписка. Пожалуйста, оплатите подписку."
//           );
//         }
//       } else {
//         await ctx.reply("Произошла ошибка при получении данных пользователя.");
//       }
//     }
//   });
// };

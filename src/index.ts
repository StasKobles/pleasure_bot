import cron from "node-cron";
import { Telegraf, session } from "telegraf";
import { setupSession } from "./bot/setupSession";
import { changeTimeCommand } from "./commands/changeTimeCommand";
import { addPleasureCommand } from "./commands/addPleasureCommand";
import { startCommand } from "./commands/startCommand";
import { subscriptionCommand } from "./commands/subscriptionCommand";
import { botToken } from "./config/config";
import { textController } from "./controllers/textController";
import { MyContext } from "./models/session";
import { resetIsSentToday } from "./services/schedule/resetIsSentToday";
import { sendDailyMessage } from "./services/schedule/sendDailyMessage";
import { channelMessagesController } from "./controllers/channelMessagesController";
import { sendReminder } from "./services/schedule/questReminder";
import { currentQuestCommand } from "./commands/currentQuestCommand";
import { helpCommand } from "./commands/helpCommand";
import { restApi } from "./utils/restApi/restApi";

const bot = new Telegraf<MyContext>(botToken);

bot.use(session());
bot.use(setupSession);

startCommand(bot);

subscriptionCommand(bot);

addPleasureCommand(bot);

changeTimeCommand(bot);

currentQuestCommand(bot);

helpCommand(bot);

textController(bot);

channelMessagesController(bot);

// Запуск планировщика для регулярной отправки сообщений
cron.schedule("* * * * *", () => sendDailyMessage(bot));
// Напоминалка о том, что надо выполнить задание
cron.schedule("* * * * *", () => sendReminder(bot));
// Запуск функции resetIsSentToday каждый день в 0:00
cron.schedule("0 0 * * *", resetIsSentToday);

restApi();

bot.launch();

import { Markup } from "telegraf";

export const timeButtons = Markup.inlineKeyboard([
  [
    Markup.button.callback("07:00", "time_07:00"),
    Markup.button.callback("09:00", "time_09:00"),
    Markup.button.callback("12:00", "time_12:00"),
  ],
  [
    Markup.button.callback("15:00", "time_15:00"),
    Markup.button.callback("18:00", "time_18:00"),
    Markup.button.callback("21:00", "time_21:00"),
  ],
]);

export const questConfirmButtons = (task_id: any, includeReplaceButton: boolean) =>
  Markup.inlineKeyboard([
    ...(includeReplaceButton ? [Markup.button.callback("Заменить задание", `replace_task_${task_id}`)] : []),
    Markup.button.callback("Принять задание", `accept_task_${task_id}`),
  ]);

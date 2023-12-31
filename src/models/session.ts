import { Context } from "telegraf";

export interface MyContext extends Context {
  session: {
    taskCount: number;
    gender: "M" | "Ж";
    activeStep:
      | "start"
      | "subscribe"
      | "pleasureList"
      | "addPleasure"
      | "getQuest"
      | "changeTime"
      | "questAnswer"
      | 'subHelp'
      | 'botHelp'
      | 'questHelp'
      | undefined;
    todayTask: { taskId: number; text: string } | undefined;
    isTaskChanged: boolean;
    activeRegistration: boolean;
  };
}

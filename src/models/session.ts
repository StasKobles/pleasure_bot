import { Context } from "telegraf";

export interface MyContext extends Context {
  session: {
    taskCount: number;
    gender: "M" | "Ж";
    activeStep:
      | "start"
      | "subscribe"
      | "pleasureList"
      | 'addPleasure'
      | "getQuest"
      | "changeTime"
      | 'questAnswer'
      | undefined;
    todayTask: string;
    activeRegistration: boolean;
  };
}

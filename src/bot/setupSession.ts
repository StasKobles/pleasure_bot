import { Middleware } from 'telegraf';
import { MyContext } from '../models/session';

export const setupSession: Middleware<MyContext> = (ctx, next) => {
  if (!ctx.session) {
    ctx.session = {
      taskCount: 0,
      gender: 'Ж',
      activeStep: undefined,
      activeRegistration: false,
      todayTask: undefined,
      isTaskChanged: false,
    };
  }

  return next();
};

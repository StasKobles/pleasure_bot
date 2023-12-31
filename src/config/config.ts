import "dotenv/config";
export const botToken = process.env.BOT_TOKEN || "";
export const sqlUrl = process.env.SQL_URL || "";
export const yooKassaApiKey = process.env.YOO_KASSA_API_KEY || "";
export const adminChatId = process.env.ADMIN_CHAT_ID || "";
export const robokassaPassword1 = process.env.ROBOKASSA_PASSWORD_1 || "";
export const robokassaPassword2 = process.env.ROBOKASSA_PASSWORD_2 || "";
export const shopId = process.env.SHOP_ID || "";
export const subscriptionPrice = process.env.SUBSCRIPTION_PRICE || "";

export const subHelpChatId = process.env.HELP_SUB_CHAT || "";
export const questHelpChatId = process.env.HELP_QUEST_CHAT || "";
export const botHelpChatId = process.env.HELP_BOT_CHAT || "";

import express, { Request, Response } from "express";
import pool from "../../services/sql";

export async function restApi() {
  const app = express();
  const port = 3000; // Вы можете выбрать любой другой порт

  app.use(express.json()); // Для разбора JSON в запросах

  // Эмуляция функции updateSubscription
  const updateSubscription = (userId: string) => {
    console.log(`Обновление подписки для пользователя с ID: ${userId}`);
    // Здесь будет логика для обновления подписки в БД
  };

  // Обработчик POST запроса
  app.post("/update-subscription", async (req: Request, res: Response) => {
    console.log("Запрос на обновление подписки получен", req.body);

    res.send(`Запрос на обновление подписки для пользователя получен`);
  });

  // Запуск сервера
  app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
  });
}

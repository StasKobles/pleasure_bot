import express, { Request, Response } from 'express';
import pool from '../../services/sql';
import { SubscriptionUpdateRequest } from '../../config/types';

export async function restApi() {
  const app = express();
  const port = 3000; // Вы можете выбрать любой другой порт

  app.use(express.json()); // Для разбора JSON в запросах
  app.use(express.urlencoded({ extended: true })); // Для разбора URL-encoded данных

  // Эмуляция функции updateSubscription
  // const updateSubscription = (userId: string) => {
  //   console.log(`Обновление подписки для пользователя с ID: ${userId}`);
  //   // Здесь будет логика для обновления подписки в БД
  // };

  // Обработчик POST запроса
  app.post('/update-subscription', async (req: Request, res: Response) => {
    const data = req.body as SubscriptionUpdateRequest;

    try {
      // Логика для проверки и обновления/добавления email в базу данных
      const email = data.EMail;
      const existingEmail = await pool.query(
        'SELECT * FROM emails WHERE email = $1',
        [email]
      );

      if (existingEmail.rowCount && existingEmail.rowCount > 0) {
        // Email уже существует, обновляем запись
        await pool.query('UPDATE emails SET isActive = true WHERE email = $1', [
          email,
        ]);
      } else {
        // Email не существует, добавляем новую запись
        await pool.query(
          'INSERT INTO emails (email, isActive, user_id) VALUES ($1, true, 1)',
          [email]
        );
      }

      res.send('Обновление подписки выполнено');
    } catch (error) {
      console.error(error);
      res.status(500).send('Ошибка при обновлении подписки');
    }
  });

  // Запуск сервера
  app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
  });
}

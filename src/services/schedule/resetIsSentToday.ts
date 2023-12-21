import pool from "../sql";

export async function resetIsSentToday() {
    try {
      // Обновление is_sent_today у всех пользователей на false
      await pool.query("UPDATE users SET is_sent_today = FALSE");
  
      console.log("Поле is_sent_today успешно обновлено.");
    } catch (error) {
      console.error("Ошибка при обновлении поля is_sent_today:", error);
    }
  }
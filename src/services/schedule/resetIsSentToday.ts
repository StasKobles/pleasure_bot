import pool from "../sql";

export async function resetIsSentToday() {
    try {
      // Обновление is_sent_today и is_completed_today у всех пользователей на false
      await pool.query("UPDATE users SET is_sent_today = FALSE, is_completed_today = FALSE, is_reminder_sent = FALSE");
  
      console.log("Поля is_sent_today и is_completed_today успешно обновлены.");
    } catch (error) {
      console.error("Ошибка при обновлении полей is_sent_today и is_completed_today:", error);
    }
}

import pool from "../sql";

export async function getActiveTask(userId: number) {
  try {
    const activeTaskRes = await pool.query(
      "SELECT active_task FROM users WHERE user_id = $1",
      [userId]
    );
    const activeTaskId = activeTaskRes.rows[0]?.active_task;

    if (activeTaskId) {
      const taskRes = await pool.query(
        "SELECT quest_text FROM tasks WHERE task_id = $1",
        [activeTaskId]
      );
      const taskText = taskRes.rows[0]?.quest_text || "";
      return taskText;
    } else {
      return "У вас в данный момент нет активного задания. 🤔";
    }
  } catch (error) {
    console.error("Ошибка при получении активного задания из базы:", error);
    return "Что-то пошло не так. Попробуйте позже. 😕";
  }
}

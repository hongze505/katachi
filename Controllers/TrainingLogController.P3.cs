using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace katachi.Controllers
{
    public partial class TrainingLogController
    {
        [HttpGet]
        public IActionResult GetP3Data(string month)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            var dt = DateTime.ParseExact(month + "-01", "yyyy-MM-dd", null);
            var firstDay = dt.ToString("yyyy-MM-dd");
            var lastDay = new DateTime(dt.Year, dt.Month, DateTime.DaysInMonth(dt.Year, dt.Month)).ToString("yyyy-MM-dd");

            var weighted = new List<object>();
            using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = @"
                    SELECT p.group_key, ROUND(SUM(CAST(s.is_done AS INT) * p.pct / 100.0), 2) AS val
                    FROM training_sessions ts
                    JOIN training_items ti ON ti.session_id = ts.session_id
                    JOIN training_sets s ON s.item_id = ti.item_id
                    JOIN exercise_group_pct p ON p.ex_key = ti.ex_key
                    WHERE ts.user_id = 1 AND ti.is_deleted = 0
                      AND ts.session_date BETWEEN @f AND @l
                    GROUP BY p.group_key";
                cmd.Parameters.AddWithValue("@f", firstDay);
                cmd.Parameters.AddWithValue("@l", lastDay);
                using var r = cmd.ExecuteReader();
                while (r.Read())
                    weighted.Add(new { groupKey = r["group_key"].ToString(), value = Convert.ToDouble(r["val"]) });
            }

            var primary = new List<object>();
            using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = @"
                    SELECT pg.group_key, SUM(CAST(s.is_done AS INT)) AS val
                    FROM training_sessions ts
                    JOIN training_items ti ON ti.session_id = ts.session_id
                    JOIN training_sets s ON s.item_id = ti.item_id
                    JOIN (
                        SELECT p1.ex_key, p1.group_key FROM exercise_group_pct p1
                        WHERE p1.pct = (SELECT MAX(p2.pct) FROM exercise_group_pct p2 WHERE p2.ex_key = p1.ex_key)
                    ) pg ON pg.ex_key = ti.ex_key
                    WHERE ts.user_id = 1 AND ti.is_deleted = 0
                      AND ts.session_date BETWEEN @f AND @l
                    GROUP BY pg.group_key";
                cmd.Parameters.AddWithValue("@f", firstDay);
                cmd.Parameters.AddWithValue("@l", lastDay);
                using var r = cmd.ExecuteReader();
                while (r.Read())
                    primary.Add(new { groupKey = r["group_key"].ToString(), value = Convert.ToDouble(r["val"]) });
            }

            var goals = new List<object>();
            using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = "SELECT group_key, monthly_target FROM user_goals WHERE user_id = 1 AND month = @mon";
                cmd.Parameters.AddWithValue("@mon", month);
                using var r = cmd.ExecuteReader();
                while (r.Read())
                    goals.Add(new { groupKey = r["group_key"].ToString(), target = Convert.ToInt32(r["monthly_target"]) });
            }
            if (!goals.Any())
            {
                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"
                    SELECT group_key, monthly_target FROM user_goals
                    WHERE user_id = 1 AND month = (SELECT MAX(month) FROM user_goals WHERE user_id = 1)";
                using var r = cmd.ExecuteReader();
                while (r.Read())
                    goals.Add(new { groupKey = r["group_key"].ToString(), target = Convert.ToInt32(r["monthly_target"]) });
            }

            int missed;
            using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = @"
                    SELECT COUNT(*) FROM training_sessions ts
                    WHERE ts.user_id = 1
                      AND ts.session_date BETWEEN @f AND @l
                      AND ts.session_date <= CAST(GETDATE() AS DATE)
                      AND NOT EXISTS (
                        SELECT 1 FROM training_items ti
                        JOIN training_sets s ON s.item_id = ti.item_id
                        WHERE ti.session_id = ts.session_id AND s.is_done = 1 AND ti.is_deleted = 0
                      )";
                cmd.Parameters.AddWithValue("@f", firstDay);
                cmd.Parameters.AddWithValue("@l", lastDay);
                missed = Convert.ToInt32(cmd.ExecuteScalar());
            }

            return Json(new { weighted, primary, goals, missed });
        }
    }
}

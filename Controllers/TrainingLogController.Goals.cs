using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace katachi.Controllers
{
    public partial class TrainingLogController
    {
        [HttpGet]
        public IActionResult GetGoals()
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            var sql = @"
                SELECT group_key, monthly_target FROM user_goals
                WHERE user_id = 1 AND month = (SELECT MAX(month) FROM user_goals WHERE user_id = 1)";
            using var cmd = new SqlCommand(sql, conn);
            var result = new Dictionary<string, int>();
            using var r = cmd.ExecuteReader();
            while (r.Read())
                result[r["group_key"].ToString()!] = Convert.ToInt32(r["monthly_target"]);
            return Json(result);
        }

        [HttpPost]
        public IActionResult SaveGoals([FromBody] Dictionary<string, int> goals)
        {
            var month = DateTime.Now.ToString("yyyy-MM");
            using var conn = _db.CreateConnection();
            conn.Open();
            foreach (var (groupKey, target) in goals)
            {
                using var cmd = new SqlCommand(@"
                    MERGE user_goals AS t
                    USING (VALUES (@uid,@gk,@mon,@tgt)) AS s(user_id,group_key,month,monthly_target)
                    ON t.user_id=s.user_id AND t.group_key=s.group_key AND t.month=s.month
                    WHEN MATCHED THEN UPDATE SET monthly_target=s.monthly_target
                    WHEN NOT MATCHED THEN INSERT (user_id,group_key,month,monthly_target)
                        VALUES (s.user_id,s.group_key,s.month,s.monthly_target);", conn);
                cmd.Parameters.AddWithValue("@uid", 1);
                cmd.Parameters.AddWithValue("@gk", groupKey);
                cmd.Parameters.AddWithValue("@mon", month);
                cmd.Parameters.AddWithValue("@tgt", target);
                cmd.ExecuteNonQuery();
            }
            return Json(new { ok = true });
        }
    }
}

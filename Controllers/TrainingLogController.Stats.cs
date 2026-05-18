using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace katachi.Controllers
{
    public partial class TrainingLogController
    {
        [HttpGet]
        public IActionResult GetMonData(string month, string exKey, string metric)
        {
            if (string.IsNullOrEmpty(month) || string.IsNullOrEmpty(exKey))
                return Json(new { labels = new List<string>(), vals = new List<decimal?>() });

            using var conn = _db.CreateConnection();
            conn.Open();
            var sql = @"
                WITH item_stats AS (
                    SELECT ti.session_id,
                           MAX(ti.weight_kg) AS weight,
                           MAX(CASE WHEN ti.weight_kg > 0
                               THEN ROUND(ti.weight_kg * (1.0 + CAST(ti.reps AS FLOAT) / 30.0), 1)
                               ELSE CAST(ti.reps AS FLOAT) END) AS rm,
                           SUM(CASE WHEN ti.weight_kg > 0
                               THEN ti.weight_kg * ti.reps * s.done_sets
                               ELSE ti.reps * s.done_sets END) AS volume,
                           MAX(s.done_sets) AS max_done
                    FROM training_items ti
                    JOIN (
                        SELECT item_id, SUM(CAST(is_done AS INT)) AS done_sets
                        FROM training_sets GROUP BY item_id
                    ) s ON s.item_id = ti.item_id
                    WHERE ti.ex_key = @ex AND ti.is_deleted = 0
                    GROUP BY ti.session_id
                )
                SELECT ts.session_date,
                       CASE WHEN ist.max_done > 0 THEN ist.weight ELSE NULL END AS weight,
                       CASE WHEN ist.max_done > 0 THEN ist.rm     ELSE NULL END AS rm,
                       CASE WHEN ist.max_done > 0 THEN ist.volume ELSE NULL END AS volume
                FROM training_sessions ts
                JOIN item_stats ist ON ist.session_id = ts.session_id
                WHERE ts.user_id = @uid
                  AND FORMAT(ts.session_date, 'yyyy-MM') = @month
                ORDER BY ts.session_date";

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@uid", CurrentUserId);
            cmd.Parameters.AddWithValue("@ex", exKey);
            cmd.Parameters.AddWithValue("@month", month);
            var labels = new List<string>();
            var vals = new List<decimal?>();
            using var r = cmd.ExecuteReader();
            while (r.Read())
            {
                var d = (DateTime)r["session_date"];
                labels.Add($"{d.Month}/{d.Day}");
                var col = metric switch { "rm" => "rm", "volume" => "volume", _ => "weight" };
                vals.Add(r[col] == DBNull.Value ? null : Convert.ToDecimal(r[col]));
            }
            return Json(new { labels, vals });
        }

        [HttpGet]
        public IActionResult GetYrData(int year, string exKey, string metric)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            var sql = @"
                SELECT MONTH(ts.session_date) AS mon,
                    MAX(ti.weight_kg) AS weight,
                    MAX(CASE WHEN ti.weight_kg > 0
                        THEN ROUND(ti.weight_kg * (1.0 + CAST(ti.reps AS FLOAT) / 30.0), 1)
                        ELSE CAST(ti.reps AS FLOAT) END) AS rm,
                    SUM(CASE WHEN ti.weight_kg > 0
                        THEN ti.weight_kg * ti.reps * s.done_sets
                        ELSE ti.reps * s.done_sets END) AS volume
                FROM training_sessions ts
                JOIN training_items ti ON ti.session_id = ts.session_id
                JOIN (
                    SELECT item_id, SUM(CAST(is_done AS INT)) AS done_sets
                    FROM training_sets GROUP BY item_id
                ) s ON s.item_id = ti.item_id
                WHERE ts.user_id = @uid
                    AND ti.ex_key = @ex
                    AND ti.is_deleted = 0
                    AND s.done_sets > 0
                    AND YEAR(ts.session_date) = @year
                GROUP BY MONTH(ts.session_date)
                ORDER BY MONTH(ts.session_date)";

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@uid", CurrentUserId);
            cmd.Parameters.AddWithValue("@ex", exKey);
            cmd.Parameters.AddWithValue("@year", year);
            var labels = new List<string>();
            var vals = new List<decimal>();
            using var r = cmd.ExecuteReader();
            while (r.Read())
            {
                labels.Add($"{r["mon"]}月");
                vals.Add(metric switch
                {
                    "rm" => Convert.ToDecimal(r["rm"]),
                    "volume" => Convert.ToDecimal(r["volume"]),
                    _ => (decimal)r["weight"]
                });
            }
            return Json(new { labels, vals });
        }

        [HttpGet]
        public IActionResult GetSummary(string left, string right, string metric, string mode)
        {
            if (string.IsNullOrEmpty(left) || string.IsNullOrEmpty(right))
                return Json(new List<object>());

            using var conn = _db.CreateConnection();
            conn.Open();

            string rowMetric = metric switch
            {
                "rm" => "CAST(CASE WHEN ti.weight_kg > 0 THEN ROUND(ti.weight_kg * (1.0 + CAST(ti.reps AS FLOAT) / 30.0), 1) ELSE CAST(ti.reps AS FLOAT) END AS FLOAT)",
                "volume" => "CAST(CASE WHEN ti.weight_kg > 0 THEN ti.weight_kg * ti.reps * s.done_sets ELSE ti.reps * s.done_sets END AS FLOAT)",
                _ => "CAST(ti.weight_kg AS FLOAT)"
            };
            string dayAgg = metric == "volume" ? "SUM" : "MAX";
            string periodAgg = metric == "volume" ? "SUM" : "MAX";
            string periodExpr = mode == "month"
                ? "FORMAT(ts.session_date,'yyyy-MM')"
                : "CAST(YEAR(ts.session_date) AS VARCHAR(4))";

            var sql = $@"
                WITH sa AS (
                    SELECT item_id, SUM(CAST(is_done AS INT)) AS done_sets
                    FROM training_sets GROUP BY item_id
                ),
                im AS (
                    SELECT ti.ex_key, ts.session_date,
                           {periodExpr} AS period,
                           {rowMetric} AS mval
                    FROM training_sessions ts
                    JOIN training_items ti ON ti.session_id = ts.session_id
                    JOIN sa s ON s.item_id = ti.item_id
                    WHERE ts.user_id = @uid AND ti.is_deleted = 0 AND s.done_sets > 0
                ),
                dm AS (
                    SELECT ex_key, session_date, period,
                           {dayAgg}(mval) AS day_m
                    FROM im
                    GROUP BY ex_key, session_date, period
                )
                SELECT ex_key,
                       {periodAgg}(CASE WHEN period = @right THEN day_m END) AS cur_max,
                       {periodAgg}(CASE WHEN period = @left  THEN day_m END) AS prev_max,
                       MAX(day_m) AS pr_max
                FROM dm
                GROUP BY ex_key";

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@uid", CurrentUserId);
            cmd.Parameters.AddWithValue("@left", left);
            cmd.Parameters.AddWithValue("@right", right);

            var result = new List<object>();
            using var r = cmd.ExecuteReader();
            while (r.Read())
                result.Add(new
                {
                    exKey = r["ex_key"].ToString(),
                    curMax = r["cur_max"] == DBNull.Value ? 0 : Convert.ToDouble(r["cur_max"]),
                    prevMax = r["prev_max"] == DBNull.Value ? 0 : Convert.ToDouble(r["prev_max"]),
                    prMax = r["pr_max"] == DBNull.Value ? 0 : Convert.ToDouble(r["pr_max"])
                });
            return Json(result);
        }
    }
}

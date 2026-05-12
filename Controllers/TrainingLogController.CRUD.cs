using katachi.Models.Training;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace katachi.Controllers
{
    public partial class TrainingLogController
    {
        [HttpPost]
        public IActionResult UpdateSet([FromBody] UpdateSetRequest req)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            using var cmd = new SqlCommand(
                "UPDATE training_sets SET is_done = @done WHERE item_id = @itemId AND set_index = @idx",
                conn);
            cmd.Parameters.AddWithValue("@done", req.IsDone ? 1 : 0);
            cmd.Parameters.AddWithValue("@itemId", req.ItemId);
            cmd.Parameters.AddWithValue("@idx", req.SetIndex);
            cmd.ExecuteNonQuery();
            return Json(new { ok = true });
        }

        [HttpPost]
        public IActionResult DeleteItem([FromBody] DeleteItemRequest req)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            using var cmd = new SqlCommand(
                "UPDATE training_items SET is_deleted = 1 WHERE item_id = @itemId", conn);
            cmd.Parameters.AddWithValue("@itemId", req.ItemId);
            cmd.ExecuteNonQuery();
            return Json(new { ok = true });
        }

        [HttpPost]
        public IActionResult AddItem([FromBody] AddItemRequest req)
        {
            using var conn = _db.CreateConnection();
            conn.Open();

            // 找或建 session
            int sessionId;
            using (var cmd = new SqlCommand(
                "SELECT session_id FROM training_sessions WHERE user_id = @uid AND session_date = @date", conn))
            {
                cmd.Parameters.AddWithValue("@uid", 1);
                cmd.Parameters.AddWithValue("@date", req.SessionDate);
                var result = cmd.ExecuteScalar();
                if (result != null)
                {
                    sessionId = Convert.ToInt32(result);
                }
                else
                {
                    using var ins = new SqlCommand(
                        "INSERT INTO training_sessions (user_id, session_date) OUTPUT INSERTED.session_id VALUES (@uid, @date)", conn);
                    ins.Parameters.AddWithValue("@uid", 1);
                    ins.Parameters.AddWithValue("@date", req.SessionDate);
                    sessionId = Convert.ToInt32(ins.ExecuteScalar());
                }
            }

            // 取目前最大 sort_order
            int sortOrder;
            using (var cmd = new SqlCommand(
                "SELECT ISNULL(MAX(sort_order), 0) + 1 FROM training_items WHERE session_id = @sid AND is_deleted = 0", conn))
            {
                cmd.Parameters.AddWithValue("@sid", sessionId);
                sortOrder = Convert.ToInt32(cmd.ExecuteScalar());
            }

            // INSERT training_items
            int itemId;
            using (var cmd = new SqlCommand(
                "INSERT INTO training_items (session_id, ex_key, weight_kg, sets, reps, sort_order) OUTPUT INSERTED.item_id VALUES (@sid, @ex, @w, @s, @r, @so)", conn))
            {
                cmd.Parameters.AddWithValue("@sid", sessionId);
                cmd.Parameters.AddWithValue("@ex", req.ExKey);
                cmd.Parameters.AddWithValue("@w", req.WeightKg);
                cmd.Parameters.AddWithValue("@s", req.Sets);
                cmd.Parameters.AddWithValue("@r", req.Reps);
                cmd.Parameters.AddWithValue("@so", sortOrder);
                itemId = Convert.ToInt32(cmd.ExecuteScalar());
            }

            // INSERT training_sets
            for (int i = 1; i <= req.Sets; i++)
            {
                using var cmd = new SqlCommand(
                    "INSERT INTO training_sets (item_id, set_index, is_done) VALUES (@iid, @idx, 0)", conn);
                cmd.Parameters.AddWithValue("@iid", itemId);
                cmd.Parameters.AddWithValue("@idx", i);
                cmd.ExecuteNonQuery();
            }

            return Json(new { ok = true, itemId });
        }

        [HttpGet]
        public IActionResult GetLastWeight(string exKey)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            var sql = @"
                SELECT TOP 1 ti.weight_kg
                FROM training_sessions ts
                JOIN training_items ti ON ti.session_id = ts.session_id
                WHERE ts.user_id = 1 AND ti.ex_key = @ex AND ti.is_deleted = 0
                ORDER BY ts.session_date DESC";
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@ex", exKey);
            var result = cmd.ExecuteScalar();
            return Json(new { weight = result != null ? (double?)(decimal)result : (double?)null });
        }

        [HttpGet]
        public IActionResult GetMonthData(string month)
        {
            using var conn = _db.CreateConnection();
            conn.Open();
            var dt = DateTime.ParseExact(month + "-01", "yyyy-MM-dd", null);
            var firstDay = dt.ToString("yyyy-MM-dd");
            var lastDay = new DateTime(dt.Year, dt.Month, DateTime.DaysInMonth(dt.Year, dt.Month)).ToString("yyyy-MM-dd");

            var sql = @"
                SELECT ts.session_date, ti.item_id, ti.ex_key, ti.weight_kg, ti.sets, ti.reps, ti.sort_order,
                       CAST(s.is_done AS INT) AS is_done
                FROM training_sessions ts
                JOIN training_items ti ON ti.session_id = ts.session_id
                JOIN training_sets s ON s.item_id = ti.item_id
                WHERE ts.user_id = 1
                    AND ti.is_deleted = 0
                    AND ts.session_date BETWEEN @f AND @l
                ORDER BY ts.session_date, ti.sort_order, s.set_index";

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@f", firstDay);
            cmd.Parameters.AddWithValue("@l", lastDay);

            var tmpItems = new Dictionary<string, Dictionary<int, TrainingItem>>();
            var tmpOrder = new Dictionary<string, List<int>>();
            using var r = cmd.ExecuteReader();
            while (r.Read())
            {
                var dateKey = ((DateTime)r["session_date"]).ToString("yyyy-MM-dd");
                var itemId = Convert.ToInt32(r["item_id"]);
                if (!tmpItems.ContainsKey(dateKey)) { tmpItems[dateKey] = new(); tmpOrder[dateKey] = new(); }
                if (!tmpItems[dateKey].ContainsKey(itemId))
                {
                    tmpItems[dateKey][itemId] = new TrainingItem
                    {
                        ItemId = itemId,
                        ExKey = r["ex_key"].ToString()!,
                        Weight = (decimal)r["weight_kg"],
                        Sets = Convert.ToInt32(r["sets"]),
                        Reps = Convert.ToInt32(r["reps"]),
                        Done = new List<int>()
                    };
                    tmpOrder[dateKey].Add(itemId);
                }
                tmpItems[dateKey][itemId].Done.Add(Convert.ToInt32(r["is_done"]));
            }

            var result = new Dictionary<string, object>();
            foreach (var dk2 in tmpItems.Keys)
                result[dk2] = tmpOrder[dk2].Select(id => new
                {
                    itemId = tmpItems[dk2][id].ItemId,
                    ex = tmpItems[dk2][id].ExKey,
                    w = (double)tmpItems[dk2][id].Weight,
                    s = tmpItems[dk2][id].Sets,
                    r = tmpItems[dk2][id].Reps,
                    d = tmpItems[dk2][id].Done
                }).ToList();

            return Json(result);
        }
    }

    public class UpdateSetRequest
    {
        public int ItemId { get; set; }
        public int SetIndex { get; set; }
        public bool IsDone { get; set; }
    }

    public class DeleteItemRequest
    {
        public int ItemId { get; set; }
    }

    public class AddItemRequest
    {
        public string SessionDate { get; set; } = "";
        public string ExKey { get; set; } = "";
        public decimal WeightKg { get; set; }
        public int Sets { get; set; }
        public int Reps { get; set; }
    }
}

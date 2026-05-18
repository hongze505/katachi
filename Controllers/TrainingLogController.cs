using katachi.Helpers;
using katachi.Models.Records;
using katachi.Models.Stats;
using katachi.Models.Training;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Security.Claims;

namespace katachi.Controllers
{
    [Authorize]
    public partial class TrainingLogController : Controller
    {
        private readonly DbHelper _db;
        private int CurrentUserId => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        public TrainingLogController(DbHelper db)
        {
            _db = db;
        }

        public IActionResult Index()
        {
            var vm = new TrainingLogViewModel();

            using var conn = _db.CreateConnection();
            conn.Open();

            // PR
            var prSql = @"
                WITH ranked AS (
                    SELECT ti.ex_key, e.name_zh, ti.weight_kg,
                        ROW_NUMBER() OVER (PARTITION BY ti.ex_key ORDER BY ti.weight_kg DESC) AS rn
                    FROM training_sessions ts
                    JOIN training_items ti ON ti.session_id = ts.session_id
                    JOIN exercises e ON e.ex_key = ti.ex_key
                    WHERE ts.user_id = @uid AND ti.is_deleted = 0 AND ti.ex_key IN ('bench-bar','squat-bar','row-bar')
                )
                SELECT ex_key, name_zh, weight_kg FROM ranked WHERE rn = 1";

            using (var cmd = new SqlCommand(prSql, conn))
            {
                cmd.Parameters.AddWithValue("@uid", CurrentUserId);
                using var r = cmd.ExecuteReader();
                while (r.Read())
                    vm.PrList.Add(new PrRecord
                    {
                        ExKey = r["ex_key"].ToString()!,
                        NameZh = r["name_zh"].ToString()!,
                        PrWeight = (decimal)r["weight_kg"]
                    });
            }

            // RM
            var rmSql = @"
                WITH ranked AS (
                    SELECT ti.ex_key, e.name_zh, ti.reps, ti.weight_kg,
                        ROW_NUMBER() OVER (PARTITION BY ti.ex_key ORDER BY ti.reps DESC, ti.weight_kg DESC) AS rn
                    FROM training_sessions ts
                    JOIN training_items ti ON ti.session_id = ts.session_id
                    JOIN exercises e ON e.ex_key = ti.ex_key
                    WHERE ts.user_id = @uid AND ti.is_deleted = 0 AND ti.ex_key IN ('bench-bar','squat-bar','row-bar')
                )
                SELECT ex_key, name_zh, reps, weight_kg FROM ranked WHERE rn = 1";

            using (var cmd = new SqlCommand(rmSql, conn))
            {
                cmd.Parameters.AddWithValue("@uid", CurrentUserId);
                using var r = cmd.ExecuteReader();
                while (r.Read())
                    vm.RmList.Add(new RmRecord
                    {
                        ExKey = r["ex_key"].ToString()!,
                        NameZh = r["name_zh"].ToString()!,
                        RmReps = Convert.ToInt32(r["reps"]),
                        RmWeight = (decimal)r["weight_kg"]
                    });
            }

            var now = DateTime.Now;
            var firstDay = new DateTime(now.Year, now.Month, 1).ToString("yyyy-MM-dd");
            var lastDay = new DateTime(now.Year, now.Month, DateTime.DaysInMonth(now.Year, now.Month)).ToString("yyyy-MM-dd");

            // 活躍度
            var avgSql = @"
                SELECT ROUND(AVG(CAST(cnt AS FLOAT)), 1) AS avg
                FROM (
                    SELECT FORMAT(session_date,'yyyy-MM') AS mon, COUNT(*) AS cnt
                    FROM training_sessions WHERE user_id = @uid
                    GROUP BY FORMAT(session_date,'yyyy-MM')
                ) m";

            using (var cmd = new SqlCommand(avgSql, conn))
            {
                cmd.Parameters.AddWithValue("@uid", CurrentUserId);
                var avg = cmd.ExecuteScalar();
                vm.Activity.MonthlyAvg = avg == null || avg is DBNull ? 0 : Convert.ToDouble(avg);
            }

            var lastSql = @"
                SELECT TOP 1 DATEDIFF(DAY, session_date, CAST(GETDATE() AS DATE)) AS days
                FROM training_sessions
                WHERE user_id = @uid AND session_date <= CAST(GETDATE() AS DATE)
                ORDER BY session_date DESC";

            using (var cmd = new SqlCommand(lastSql, conn))
            {
                cmd.Parameters.AddWithValue("@uid", CurrentUserId);
                var val = cmd.ExecuteScalar();
                vm.Activity.DaysSinceLast = val != null ? Convert.ToInt32(val) : -1;
            }

            var nextSql = @"
                SELECT TOP 1 DATEDIFF(DAY, CAST(GETDATE() AS DATE), session_date) AS days
                FROM training_sessions
                WHERE user_id = @uid AND session_date > CAST(GETDATE() AS DATE)
                ORDER BY session_date ASC";

            using (var cmd = new SqlCommand(nextSql, conn))
            {
                cmd.Parameters.AddWithValue("@uid", CurrentUserId);
                var val = cmd.ExecuteScalar();
                vm.Activity.DaysUntilNext = val != null ? Convert.ToInt32(val) : -1;
            }

            // 本月完成組數
            var totalSetsSql = @"
                SELECT ISNULL(SUM(CASE WHEN s.is_done = 1 THEN 1 ELSE 0 END), 0)
                FROM training_sessions ts
                JOIN training_items ti ON ti.session_id = ts.session_id AND ti.is_deleted = 0
                JOIN training_sets s ON s.item_id = ti.item_id
                WHERE ts.user_id = @uid
                AND FORMAT(ts.session_date,'yyyy-MM') = FORMAT(GETDATE(),'yyyy-MM')";

            using (var cmd = new SqlCommand(totalSetsSql, conn))
            {
                cmd.Parameters.AddWithValue("@uid", CurrentUserId);
                vm.Activity.TotalSets = Convert.ToInt32(cmd.ExecuteScalar());
            }

            // 本月休息天數（不含當日）
            var restDaysSql = @"
                SELECT DATEDIFF(DAY, DATEFROMPARTS(YEAR(GETDATE()),MONTH(GETDATE()),1), CAST(GETDATE() AS DATE))
                     - COUNT(DISTINCT session_date)
                FROM training_sessions
                WHERE user_id = @uid
                AND FORMAT(session_date,'yyyy-MM') = FORMAT(GETDATE(),'yyyy-MM')
                AND session_date < CAST(GETDATE() AS DATE)";

            using (var cmd = new SqlCommand(restDaysSql, conn))
            {
                cmd.Parameters.AddWithValue("@uid", CurrentUserId);
                vm.Activity.RestDays = Convert.ToInt32(cmd.ExecuteScalar());
            }

            // 連續訓練週數（C# 計算）
            var streakSql = @"
                SELECT DISTINCT ts.session_date
                FROM training_sessions ts
                JOIN training_items ti ON ti.session_id = ts.session_id
                JOIN training_sets s ON s.item_id = ti.item_id
                WHERE ts.user_id = @uid AND ti.is_deleted = 0 AND s.is_done = 1
                AND ts.session_date <= CAST(GETDATE() AS DATE)";

            var trainingDates = new HashSet<DateTime>();
            using (var cmd = new SqlCommand(streakSql, conn))
            {
                cmd.Parameters.AddWithValue("@uid", CurrentUserId);
                using var r = cmd.ExecuteReader();
                while (r.Read()) trainingDates.Add((DateTime)r["session_date"]);
            }

            var today2 = DateTime.Today;
            var dow = ((int)today2.DayOfWeek + 6) % 7;
            var checkMon = today2.AddDays(-dow);
            // 本週尚未訓練時從上週開始算，避免週一早上未訓練就歸零
            if (!trainingDates.Any(d => d >= checkMon && d <= checkMon.AddDays(6)))
                checkMon = checkMon.AddDays(-7);
            int streak = 0;
            while (streak < 104)
            {
                var checkSun = checkMon.AddDays(6);
                if (!trainingDates.Any(d => d >= checkMon && d <= checkSun)) break;
                streak++;
                checkMon = checkMon.AddDays(-7);
            }
            vm.Activity.WeekStreak = streak;

            var monthDataSql = @"
                SELECT ts.session_date, ti.item_id, ti.ex_key, ti.weight_kg, ti.sets, ti.reps, ti.sort_order,
                       CAST(s.is_done AS INT) AS is_done
                FROM training_sessions ts
                JOIN training_items ti ON ti.session_id = ts.session_id
                JOIN training_sets s ON s.item_id = ti.item_id
                WHERE ts.user_id = @uid
                    AND ti.is_deleted = 0
                    AND ts.session_date BETWEEN @f AND @l
                ORDER BY ts.session_date, ti.sort_order, s.set_index";

            using (var cmd = new SqlCommand(monthDataSql, conn))
            {
                cmd.Parameters.AddWithValue("@uid", CurrentUserId);
                cmd.Parameters.AddWithValue("@f", firstDay);
                cmd.Parameters.AddWithValue("@l", lastDay);
                using (var r = cmd.ExecuteReader())
                {
                    var tmpItems = new Dictionary<string, Dictionary<int, TrainingItem>>();
                    var tmpOrder = new Dictionary<string, List<int>>();
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
                    foreach (var dk2 in tmpItems.Keys)
                        vm.MonthlyData[dk2] = tmpOrder[dk2].Select(id => tmpItems[dk2][id]).ToList();
                }
            }

            // 可用月份清單（P2/P3 下拉選單）
            var monthsSql = @"
                SELECT DISTINCT FORMAT(session_date, 'yyyy-MM') AS month
                FROM training_sessions WHERE user_id = @uid
                ORDER BY month DESC";

            using (var cmd = new SqlCommand(monthsSql, conn))
            {
                cmd.Parameters.AddWithValue("@uid", CurrentUserId);
                using var r = cmd.ExecuteReader();
                while (r.Read())
                    vm.AvailableMonths.Add(r["month"].ToString()!);
            }

            vm.AvailableYears = vm.AvailableMonths
                .Select(m => int.Parse(m.Substring(0, 4)))
                .Distinct()
                .OrderByDescending(y => y)
                .ToList();

            // WeightedData（加權肌群訓練量）
            using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = @"
                    SELECT p.group_key, ROUND(SUM(CAST(s.is_done AS INT) * p.pct / 100.0), 2) AS val
                    FROM training_sessions ts
                    JOIN training_items ti    ON ti.session_id = ts.session_id
                    JOIN training_sets  s     ON s.item_id = ti.item_id
                    JOIN exercise_group_pct p ON p.ex_key = ti.ex_key
                    WHERE ts.user_id = @uid
                        AND ti.is_deleted = 0
                        AND ts.session_date BETWEEN @f AND @l
                    GROUP BY p.group_key";
                cmd.Parameters.AddWithValue("@uid", CurrentUserId);
                cmd.Parameters.AddWithValue("@f", firstDay);
                cmd.Parameters.AddWithValue("@l", lastDay);
                using var r = cmd.ExecuteReader();
                while (r.Read())
                    vm.WeightedData.Add(new MuscleGroupStat
                    {
                        GroupKey = r["group_key"].ToString()!,
                        Value = Convert.ToDouble(r["val"])
                    });
            }

            // PrimaryData（主計群完成組數）
            using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = @"
                    SELECT pg.group_key, SUM(CAST(s.is_done AS INT)) AS val
                    FROM training_sessions ts
                    JOIN training_items ti ON ti.session_id = ts.session_id
                    JOIN training_sets  s  ON s.item_id = ti.item_id
                    JOIN (
                        SELECT p1.ex_key, p1.group_key
                        FROM exercise_group_pct p1
                        WHERE p1.pct = (SELECT MAX(p2.pct) FROM exercise_group_pct p2 WHERE p2.ex_key = p1.ex_key)
                    ) pg ON pg.ex_key = ti.ex_key
                    WHERE ts.user_id = @uid
                        AND ti.is_deleted = 0
                        AND ts.session_date BETWEEN @f AND @l
                    GROUP BY pg.group_key";
                cmd.Parameters.AddWithValue("@uid", CurrentUserId);
                cmd.Parameters.AddWithValue("@f", firstDay);
                cmd.Parameters.AddWithValue("@l", lastDay);
                using var r = cmd.ExecuteReader();
                while (r.Read())
                    vm.PrimaryData.Add(new MuscleGroupStat
                    {
                        GroupKey = r["group_key"].ToString()!,
                        Value = Convert.ToDouble(r["val"])
                    });
            }

            return View(vm);
        }
    }
}

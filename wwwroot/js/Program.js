
    /* ════════ NAV ════════ */
    const byobu = document.getElementById("byobu");
    const menuContent = document.getElementById("menu-content");
    function openMenu() {
        byobu.style.pointerEvents = "all";
    byobu.classList.remove("closing");
    byobu.classList.add("open");
      setTimeout(() => menuContent.classList.add("open"), 400);
    document.body.style.overflow = "hidden";
    }
    function closeMenu() {
      const closeBtn = document.querySelector(".mc-close");
    if (closeBtn) {
        closeBtn.classList.add("spinning");
        setTimeout(() => closeBtn.classList.remove("spinning"), 400);
      }
    menuContent.classList.remove("open");
    byobu.classList.remove("open");
    byobu.classList.add("closing");
      setTimeout(() => {
        byobu.style.pointerEvents = "none";
    byobu.classList.remove("closing");
    document.body.style.overflow = "";
      }, 800);
    }
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
    const navbar = document.getElementById("nav");
    window.addEventListener("scroll", () => {
        navbar.classList.toggle("shrink", window.scrollY > 50);
    });

    /* ════════ 表單狀態 ════════ */
    const form = {
        goal: "hypertrophy",
    level: "beginner",
    days: 4,
    duration: 60,
    equipment: ["barbell", "dumbbell"],
    };

    function selectCard(type, el) {
        el.closest(".field-cards")
            .querySelectorAll(".field-card")
            .forEach((c) => c.classList.remove("active"));
    el.classList.add("active");
    form[type] = el.dataset.val;
    }

    function selectChip(type, el) {
        el.closest(".field-chips")
            .querySelectorAll(".chip")
            .forEach((c) => c.classList.remove("active"));
    el.classList.add("active");
    form[type] = parseInt(el.dataset.val);
    }

    function toggleEquip(el) {
      const val = el.dataset.val;
    el.classList.toggle("active");
    if (el.classList.contains("active")) {
        form.equipment.push(val);
      } else {
        form.equipment = form.equipment.filter((e) => e !== val);
      }
    }

    const stepperMin = {days: 2 };
    const stepperMax = {days: 6 };
    function stepperChange(key, delta) {
        form[key] = Math.min(
            stepperMax[key],
            Math.max(stepperMin[key], form[key] + delta),
        );
    document.getElementById(`${key}-val`).textContent = form[key];
    }

    /* ════════════════════════════════════════
 假資料庫
 TODO: 替換為 fetch('/api/exercises?equipment=...&muscle=...')
════════════════════════════════════════ */
    const EXERCISE_DB = {
        chest: {
        barbell: ["槓鈴臥推", "上斜槓鈴臥推"],
    dumbbell: ["啞鈴臥推", "啞鈴飛鳥"],
    machine: ["蝴蝶機夾胸", "史密斯臥推"],
    bodyweight: ["伏地挺身", "寬距伏地挺身"],
      },
    back: {
        barbell: ["槓鈴硬拉", "槓鈴划船"],
    dumbbell: ["啞鈴單臂划船", "啞鈴直腿硬拉"],
    machine: ["滑輪下拉", "坐姿划船機"],
    bodyweight: ["引體向上", "反手引體向上"],
      },
    legs: {
        barbell: ["槓鈴深蹲", "前蹲舉"],
    dumbbell: ["啞鈴弓步", "啞鈴羅馬尼亞硬拉"],
    machine: ["腿推機", "腿伸屈機"],
    bodyweight: ["徒手深蹲", "保加利亞分腿蹲"],
      },
    shoulders: {
        barbell: ["槓鈴肩推", "直立划船"],
    dumbbell: ["啞鈴側平舉", "啞鈴肩推"],
    machine: ["機械肩推", "機械側平舉"],
    bodyweight: ["倒立伏地挺身", "前平舉"],
      },
    arms: {
        barbell: ["槓鈴彎舉", "槓鈴三頭下壓"],
    dumbbell: ["啞鈴彎舉", "啞鈴錘式彎舉"],
    machine: ["滑輪彎舉", "繩索三頭下壓"],
    bodyweight: ["窄距伏地挺身", "反向彎舉"],
      },
    core: {
        barbell: ["槓片仰臥起坐"],
    dumbbell: ["啞鈴側彎"],
    machine: ["繩索捲腹"],
    bodyweight: ["捲腹", "棒式", "俄羅斯轉體"],
      },
    };

    // 依目標決定組數/次數
    const PRESCRIPTION = {
        hypertrophy: {
        sets: 4,
    reps: "8–12",
    rest: "60–90 秒",
    intensity: "中等重量",
      },
    strength: {
        sets: 5,
    reps: "3–5",
    rest: "3–5 分鐘",
    intensity: "大重量",
      },
    fatloss: {
        sets: 3,
    reps: "15–20",
    rest: "30–45 秒",
    intensity: "輕重量",
      },
    };

    // 依天數決定分化方式
    const SPLITS = {
        1: ["頭"],
    2: ["全身 A", "全身 B"],
    3: ["推 (胸/肩/三頭)", "拉 (背/二頭)", "腿"],
    4: ["上肢推", "下肢", "上肢拉", "下肢 + 核心"],
    5: ["胸", "背", "腿", "肩 + 手臂", "全身 / 弱點"],
    6: ["胸", "背", "腿", "肩", "手臂", "全身 / 弱點"],
    };

    // 每個分化對應的肌群
    const SPLIT_MUSCLES = {
        "全身 A": ["chest", "back", "legs", "core"],
    "全身 B": ["shoulders", "back", "legs", "arms"],
    "推 (胸/肩/三頭)": ["chest", "shoulders", "arms"],
    "拉 (背/二頭)": ["back", "arms"],
    腿: ["legs", "core"],
    上肢推: ["chest", "shoulders", "arms"],
    下肢: ["legs"],
    上肢拉: ["back", "arms"],
    "下肢 + 核心": ["legs", "core"],
    胸: ["chest"],
    背: ["back"],
    肩: ["shoulders"],
    "肩 + 手臂": ["shoulders", "arms"],
    手臂: ["arms"],
    "全身 / 弱點": ["chest", "back", "legs"],
    };

    function getExercises(muscle, equipment) {
      const pool = [];
      equipment.forEach((eq) => {
        if (EXERCISE_DB[muscle]?.[eq]) pool.push(...EXERCISE_DB[muscle][eq]);
      });
    // 去重後隨機取最多 2 個
    const unique = [...new Set(pool)];
      return unique.sort(() => Math.random() - 0.5).slice(0, 2);
    }

    /* ════════ 產生計畫 ════════ */
async function generatePlan() {
    if (form.equipment.length === 0) {
        showToast("請至少選擇一種器材");
        return;
    }

    try {
        const res = await fetch('/Program/Generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                goal: form.goal,
                days: form.days,
                equipment: form.equipment
            })
        });

        if (!res.ok) {
            showToast("產生失敗，請稍後再試");
            return;
        }

        const data = await res.json();

        // 後端回傳的 weekDays 需要加上休息天補足 7 天
        const days = ["一", "二", "三", "四", "五", "六", "日"];
        const fullWeek = [];
        let dayIdx = 0;

        for (let i = 0; i < 7; i++) {
            if (dayIdx < data.weekDays.length) {
                fullWeek.push({
                    day: days[i],
                    label: `週${days[i]}`,
                    split: data.weekDays[dayIdx].dayName,
                    exercises: data.weekDays[dayIdx].exercises,
                    isRest: false
                });
                dayIdx++;
            } else {
                fullWeek.push({
                    day: days[i],
                    label: `週${days[i]}`,
                    split: "休息",
                    exercises: [],
                    isRest: true
                });
            }
        }

        renderResult(fullWeek, data.prescription);

    } catch (err) {
        console.error(err);
        showToast("網路錯誤");
    }
}

    /* ════════ 渲染結果 ════════ */
    function renderResult(weekDays, pres) {
      const goalMap = {
        hypertrophy: "增肌計畫",
    strength: "增力計畫",
    fatloss: "減脂計畫",
      };
    const levelMap = {
        beginner: "初學者",
    intermediate: "中階",
    advanced: "進階",
      };
    const equipMap = {
        barbell: "槓鈴",
    dumbbell: "啞鈴",
    machine: "機械式",
    bodyweight: "徒手",
      };

    document.getElementById("result-eyebrow").textContent =
    `${levelMap[form.level]} · Personal Program`;
    document.getElementById("result-title").textContent =
    goalMap[form.goal];
    document.getElementById("result-meta").innerHTML = `
    <div class="meta-tag">${form.days} 天 / 週</div>
    <div class="meta-tag">${form.duration} 分鐘</div>
    <div class="meta-tag">${pres.sets} 組 × ${pres.reps} 次</div>
    <div class="meta-tag">${form.equipment.map((e) => equipMap[e]).join(" · ")}</div>
    `;

    // 週課表
    document.getElementById("week-schedule").innerHTML = weekDays
    .map(
          (d, i) => `
    <div class="week-card ${d.isRest ? " rest" : ""}" onclick="${d.isRest ? "" : `scrollToDay(${i})`}">
    <span class="week-card-label">${d.label}</span>
    <span class="week-card-split">${d.split}</span>
    ${!d.isRest ? `<span class="week-card-count">${d.exercises.length} 個動作</span>` : ""}
</div>
`,
        )
        .join("");

      // 每日動作明細
      const activeDays = weekDays.filter((d) => !d.isRest);
      document.getElementById("daily-detail").innerHTML = activeDays
        .map(
          (d, i) => `
    < div class="day-detail" id = "day-detail-${i}" >
      <div class="day-detail-header">
        <div>
          <span class="day-detail-label">週${d.day}</span>
          <h3 class="day-detail-split">${d.split}</h3>
        </div>
        <span class="day-detail-count">${d.exercises.length} 個動作 · ${pres.rest || data?.prescription?.rest || ''} 休息</span>
      </div>
      <div class="exercise-list">
        ${d.exercises
              .map(
                (ex, j) => `
          <div class="exercise-row">
            <span class="ex-num">${String(j + 1).padStart(2, "0")}</span>
            <div class="ex-info">
              <span class="ex-name">${ex.name}</span>
             <span class="ex-muscle">${ex.muscleGroup || muscleZH(ex.muscle)}</span>
            </div>
            <div class="ex-scheme">
              <span class="ex-sets">${ex.sets}</span>
              <span class="ex-x">×</span>
              <span class="ex-reps">${ex.reps}</span>
            </div>
          </div>
        `,
              )
              .join("")}
      </div>
    </div >
    `,
        )
        .join("");

      // 顯示結果區
      document.getElementById("sec-result").classList.remove("hidden");
      document
        .getElementById("sec-result")
        .scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function muscleZH(key) {
      const map = {
        chest: "胸",
        back: "背",
        legs: "腿",
        shoulders: "肩",
        arms: "手臂",
        core: "核心",
      };
      return map[key] || key;
    }

    function scrollToDay(i) {
        const el = document.getElementById(`day-detail-${i}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function resetPlan() {
      document.getElementById("sec-result").classList.add("hidden");
      document
        .getElementById("sec-form")
        .scrollIntoView({ behavior: "smooth", block: "start" });
    }

    /* ════════ Toast ════════ */
    function showToast(msg) {
      let t = document.getElementById("toast");
      if (!t) {
        t = document.createElement("div");
        t.id = "toast";
        document.body.appendChild(t);
      }
      t.textContent = msg;
      t.classList.add("show");
      setTimeout(() => t.classList.remove("show"), 2400);
    }

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
    days: 4,
    equipment: ["槓鈴", "啞鈴"],
};

function selectCard(type, el) {
    el.closest(".field-cards")
        .querySelectorAll(".field-card")
        .forEach((c) => c.classList.remove("active"));
    el.classList.add("active");
    form[type] = el.dataset.val;
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

const stepperMin = { days: 2 };
const stepperMax = { days: 6 };
function stepperChange(key, delta) {
    form[key] = Math.min(
        stepperMax[key],
        Math.max(stepperMin[key], form[key] + delta),
    );
    document.getElementById(`${key}-val`).textContent = form[key];
}

/* ════════ 產生計畫 ════════ */
async function generatePlan() {
    if (form.equipment.length === 0) {
        showToast("請至少選擇一種器材");
        return;
    }

    try {
        const res = await fetch('/Plan/Generate', {
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

        const dayLabels = ["一", "二", "三", "四", "五", "六", "日"];
        const fullWeek = [];
        let dayIdx = 0;

        for (let i = 0; i < 7; i++) {
            if (dayIdx < data.weekDays.length) {
                fullWeek.push({
                    day: dayLabels[i],
                    label: `週${dayLabels[i]}`,
                    split: data.weekDays[dayIdx].dayName,
                    exercises: data.weekDays[dayIdx].exercises,
                    isRest: false
                });
                dayIdx++;
            } else {
                fullWeek.push({
                    day: dayLabels[i],
                    label: `週${dayLabels[i]}`,
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
    const equipMap = {
        槓鈴: "槓鈴",
        啞鈴: "啞鈴",
        機械式: "機械式",
        徒手: "徒手",
    };

    document.getElementById("result-eyebrow").textContent = "Personal Program";
    document.getElementById("result-title").textContent = goalMap[form.goal];
    document.getElementById("result-meta").innerHTML = `
        <div class="meta-tag">${form.days} 天 / 週</div>
        <div class="meta-tag">${pres.sets} 組 × ${pres.reps} 次</div>
        <div class="meta-tag">${form.equipment.map((e) => equipMap[e] || e).join(" · ")}</div>
    `;

    // 週課表
    document.getElementById("week-schedule").innerHTML = weekDays
        .map((d, i) => `
            <div class="week-card${d.isRest ? " rest" : ""}" onclick="${d.isRest ? "" : `scrollToDay(${i})`}">
                <span class="week-card-label">${d.label}</span>
                <span class="week-card-split">${d.split}</span>
                ${!d.isRest ? `<span class="week-card-count">${d.exercises.length} 個動作</span>` : ""}
            </div>
        `)
        .join("");

    // 每日動作明細
    const activeDays = weekDays.filter((d) => !d.isRest);
    document.getElementById("daily-detail").innerHTML = activeDays
        .map((d, i) => `
            <div class="day-detail" id="day-detail-${i}">
                <div class="day-detail-header">
                    <div>
                        <span class="day-detail-label">週${d.day}</span>
                        <h3 class="day-detail-split">${d.split}</h3>
                    </div>
                    <span class="day-detail-count">${d.exercises.length} 個動作 · ${pres.rest} 休息</span>
                </div>
                <div class="exercise-list">
                    ${d.exercises.map((ex, j) => `
                        <div class="exercise-row">
                            <span class="ex-num">${String(j + 1).padStart(2, "0")}</span>
                            <div class="ex-info">
                                <span class="ex-name">${ex.name}</span>
                                <span class="ex-muscle">${ex.muscleGroup}</span>
                            </div>
                            <div class="ex-scheme">
                                <span class="ex-sets">${ex.sets}</span>
                                <span class="ex-x">×</span>
                                <span class="ex-reps">${ex.reps}</span>
                            </div>
                        </div>
                    `).join("")}
                </div>
            </div>
        `)
        .join("");

    document.getElementById("sec-result").classList.remove("hidden");
    document.getElementById("sec-result").scrollIntoView({ behavior: "smooth", block: "start" });
}

function scrollToDay(i) {
    const el = document.getElementById(`day-detail-${i}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetPlan() {
    document.getElementById("sec-result").classList.add("hidden");
    document.getElementById("sec-form").scrollIntoView({ behavior: "smooth", block: "start" });
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
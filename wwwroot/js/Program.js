

/* ════════ 表單狀態 ════════ */
const form = {
    goal: "hypertrophy",
    days: 4,
    equipment: ["槓鈴", "啞鈴"],
};

/* ════════ URL 參數預選目標 ════════ */
document.addEventListener('DOMContentLoaded', () => {
    const goalParam = new URLSearchParams(window.location.search).get('goal');
    if (goalParam && ['hypertrophy', 'strength', 'fatloss'].includes(goalParam)) {
        form.goal = goalParam;
        const cards = document.querySelectorAll('#goal-cards .field-card');
        cards.forEach(c => c.classList.remove('active'));
        const target = document.querySelector(`#goal-cards [data-val="${goalParam}"]`);
        if (target) target.classList.add('active');
    }
});

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
            const message = await res.text();
            showToast(message || "產生失敗，請稍後再試");
            return;
        }

        const data = await res.json();

        if (!Array.isArray(data.weekDays) || data.weekDays.length === 0) {
            showToast("目前資料庫沒有符合條件的訓練模板");
            return;
        }

        const totalExercises = data.weekDays.reduce((sum, day) => sum + (day.exercises?.length || 0), 0);
        if (totalExercises === 0) {
            showToast("目前沒有符合器材與目標的動作，請增加器材或更換目標");
            return;
        }

        const dayLabels = ["一", "二", "三", "四", "五", "六", "日"];
        const trainingPositions = getTrainingPositions(data.weekDays.length);
        const fullWeek = dayLabels.map((day, index) => {
            const trainingIndex = trainingPositions.indexOf(index);

            if (trainingIndex >= 0) {
                const trainingDay = data.weekDays[trainingIndex];
                return {
                    day,
                    label: `週${day}`,
                    split: trainingDay.dayName,
                    exercises: trainingDay.exercises,
                    isRest: false
                };
            }

            return {
                day,
                label: `週${day}`,
                split: "休息",
                exercises: [],
                isRest: true
            };
        });

        renderResult(fullWeek, data.prescription);

    } catch (err) {
        console.error(err);
        showToast("網路錯誤");
    }
}

function normalizeText(value) {
    return String(value || "").replace(/\s+/g, "").trim();
}

function toExerciseEquipmentKey(equipment) {
    const map = {
        "槓鈴": "barbell",
        "啞鈴": "dumbbell",
        "徒手": "bodyweight",
        "徒手訓練": "bodyweight",
        "自體重量": "bodyweight"
    };

    return map[equipment] || equipment || "";
}

function findExerciseDetail(exercise) {
    if (typeof EXERCISES === "undefined" || !EXERCISES || !exercise?.name) return null;

    const targetName = normalizeText(exercise.name);
    for (const [muscleKey, exerciseList] of Object.entries(EXERCISES)) {
        const matched = (exerciseList || []).find(item => normalizeText(item.name) === targetName);
        if (matched) {
            return {
                muscle: muscleKey,
                equipment: matched.equipment || toExerciseEquipmentKey(exercise.equipment),
                name: matched.name
            };
        }
    }

    return null;
}

function getExerciseDetailUrl(exercise) {
    if (exercise?.exKey) {
        const params = new URLSearchParams({
            key: exercise.exKey,
            name: exercise.name || ""
        });

        return `/MuscleMap/Exercise?${params.toString()}`;
    }

    const detail = findExerciseDetail(exercise);
    if (!detail) return "";

    const params = new URLSearchParams({
        muscle: detail.muscle,
        equipment: detail.equipment,
        name: detail.name
    });

    return `/MuscleMap/Exercise?${params.toString()}`;
}

function renderExerciseRow(exercise, index) {
    const url = getExerciseDetailUrl(exercise);
    const tagName = url ? "a" : "div";
    const href = url ? ` href="${url}" title="查看${exercise.name}動作說明"` : "";
    const extraClass = url ? " exercise-row--link" : "";

    return `
        <${tagName} class="exercise-row${extraClass}"${href}>
            <span class="ex-num">${String(index + 1).padStart(2, "0")}</span>
            <div class="ex-info">
                <span class="ex-name">${exercise.name}</span>
                <span class="ex-muscle">${exercise.muscleGroup}</span>
            </div>
            <div class="ex-scheme">
                <span class="ex-sets">${exercise.sets}</span>
                <span class="ex-x">×</span>
                <span class="ex-reps">${exercise.reps}</span>
            </div>
        </${tagName}>
    `;
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
                    ${d.exercises.map((ex, j) => renderExerciseRow(ex, j)).join("")}
                </div>
            </div>
        `)
        .join("");

    document.getElementById("sec-result").classList.remove("hidden");
    document.getElementById("sec-result").scrollIntoView({ behavior: "smooth", block: "start" });
}

function getTrainingPositions(trainingDayCount) {
    const scheduleMap = {
        1: [0],
        2: [0, 3],
        3: [0, 2, 4],
        4: [0, 1, 3, 5],
        5: [0, 1, 3, 4, 6],
        6: [0, 1, 2, 4, 5, 6],
        7: [0, 1, 2, 3, 4, 5, 6]
    };

    return scheduleMap[trainingDayCount] || Array.from({ length: Math.min(trainingDayCount, 7) }, (_, index) => index);
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




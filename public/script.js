const tasksDOM = document.querySelector(".tasks");
const formAlertDOM = document.querySelector(".form-alert");
const formDOM = document.querySelector(".task_form");
const taskInputDOM = document.querySelector(".task_input");
const dueInputDOM = document.querySelector(".task_due");
const pagerDOM = document.getElementById("pagination");

const PAGE_SIZE = 15;
let currentPage = 1;
let totalPages = 1;

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};


const daysLeft = (iso) => {
  if (!iso) return null;
  const due = new Date(iso);
  const dueLocal = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const now = new Date();
  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const MS = 24 * 60 * 60 * 1000;
  return Math.round((dueLocal - todayLocal) / MS);
};

const badgeHTML = (iso) => {
  if (!iso) return `<span class="badge badge--none">期限未設定</span>`;
  const left = daysLeft(iso);
  if (left < 0) return `<span class="badge badge--overdue">期限切れ</span>`;
  if (left === 0) return `<span class="badge badge--today">今日締切</span>`;
  if (left === 1) return `<span class="badge badge--soon">あと1日</span>`;
  return `<span class="badge badge--due">${left}日後</span>`;
};

const renderTasks = (items) => {
  if (!items || items.length === 0) {
    tasksDOM.innerHTML = `<p class="error tasks_empty">タスクはありません</p>`;
    return;
  }
  const html = items.map(({ completed, name, _id, dueDate }) => `
<li class="task">
  <div class="task_check ${completed ? "completed" : ""}">
    <i class="fa-solid fa-check" aria-label="Done"></i>
  </div>
  <div class="task_main">
    <span class="task_title ${completed ? "completed" : ""}">${name}</span>
    <div class="task_meta">
      ${
        dueDate
          ? `<i class="fa-regular fa-calendar"></i><span class="meta_date">${formatDate(dueDate)}</span>`
          : `<i class="fa-regular fa-calendar"></i><span class="meta_date muted">期限未設定</span>`
      }
      ${badgeHTML(dueDate)}
    </div>
  </div>
  <div class="task_links">
    <a href="./edit.html?id=${_id}" class="edit_link" aria-label="Edit task"><i class="fa-solid fa-pen-to-square"></i></a>
    <button type="button" class="delete_btn" data-id="${_id}" aria-label="Delete task"><i class="fa-solid fa-trash-can"></i></button>
  </div>
</li>`).join("");
  tasksDOM.innerHTML = html;
};

const renderPager = (meta) => {
  if (!pagerDOM) return;
  const { page, totalPages: tp } = meta;
  totalPages = tp;
  currentPage = page;

  if (tp <= 1) {
    pagerDOM.innerHTML = "";
    return;
  }

  const pageBtn = (p, label = p, disabled = false, active = false) => {
    return `<button class="page-btn${active ? " is-active" : ""}" data-page="${p}" ${disabled ? "disabled" : ""}>${label}</button>`;
  };

  const prev = pageBtn(Math.max(1, page - 1), "« 前へ", page === 1);
  const next = pageBtn(Math.min(tp, page + 1), "次へ »", page === tp);

  const start = Math.max(1, page - 2);
  const end = Math.min(tp, page + 2);
  let nums = "";
  for (let i = start; i <= end; i++) {
    nums += pageBtn(i, String(i), false, i === page);
  }

  pagerDOM.innerHTML = `
    <div class="pager-inner">
      ${prev}
      ${start > 1 ? pageBtn(1, "1") + (start > 2 ? `<span class="page-ellipsis">…</span>` : "") : ""}
      ${nums}
      ${end < tp ? (end < tp - 1 ? `<span class="page-ellipsis">…</span>` : "") + pageBtn(tp, String(tp)) : ""}
      ${next}
    </div>
  `;


  pagerDOM.querySelectorAll(".page-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const p = Number(e.currentTarget.getAttribute("data-page"));
      if (!Number.isNaN(p) && p !== currentPage) {
        loadPage(p);
      }
    });
  });
};

const loadPage = async (page = 1) => {
  try {
    const { data } = await axios.get(`/api/tasks?page=${page}&limit=${PAGE_SIZE}`);
    renderTasks(data.items);
    renderPager(data.meta);
  } catch (err) {
    console.log(err);
  }
};


loadPage(1);


formDOM.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const payload = {
      name: taskInputDOM.value,
      completed: false,
      dueDate: dueInputDOM?.value || "",
    };
    await axios.post("/api/tasks", payload);


    await loadPage(currentPage);

    taskInputDOM.value = "";
    if (dueInputDOM) dueInputDOM.value = "";

    formAlertDOM.textContent = "タスクを追加しました";
    formAlertDOM.style.display = "block";
    formAlertDOM.classList.remove("error");
    formAlertDOM.classList.add("success");
    setTimeout(() => {
      formAlertDOM.style.display = "none";
      formAlertDOM.textContent = "";
      formAlertDOM.classList.remove("success");
    }, 2000);
  } catch (err) {
    console.log(err);
    formAlertDOM.style.display = "block";
    formAlertDOM.classList.remove("success");
    formAlertDOM.classList.add("error");
    formAlertDOM.textContent = "1~20文字で登録してください。";
    setTimeout(() => {
      formAlertDOM.style.display = "none";
      formAlertDOM.textContent = "";
      formAlertDOM.classList.remove("error");
    }, 2000);
  }
});


tasksDOM.addEventListener("click", async (e) => {
  const btn = e.target.closest(".delete_btn");
  if (!btn || !tasksDOM.contains(btn)) return;
  const targetId = btn.dataset.id;

  try {
    await axios.delete(`/api/tasks/${targetId}`);


    const { data } = await axios.get(`/api/tasks?page=${currentPage}&limit=${PAGE_SIZE}`);
    const { items, meta } = data;


    const nextPage =
      (items.length === 0 && currentPage > 1)
        ? currentPage - 1
        : Math.min(currentPage, meta.totalPages);

    await loadPage(nextPage);
  } catch (err) {
    console.log(err);
  }
});


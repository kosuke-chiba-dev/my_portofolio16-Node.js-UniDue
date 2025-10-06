const params = window.location.search;
const id = new URLSearchParams(params).get("id");
const redirect404 = () => location.replace("/404.html");
if (!id) redirect404();


const taskIDDOM = document.querySelector(".task-edit_id");
const editTaskFormDOM = document.querySelector(".task_form");
const taskNameDOM = document.querySelector(".task-edit_name");
const taskCompletedDOM = document.querySelector(".task-edit_completed");
const taskDueDOM = document.querySelector(".task-edit_due");
const formAlertDOM = document.querySelector(".form-alert");

const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const showTask = async () => {
  try {
    const { data: task } = await axios.get(`api/tasks/${id}`);
    const { _id, completed, name, dueDate } = task;
    taskIDDOM.textContent = _id;
    taskNameDOM.value = name;
    taskCompletedDOM.checked = completed;
    if (taskDueDOM) taskDueDOM.value = fmtDate(dueDate);
  } catch (err) {
    if (err?.response?.status === 404 || err?.response?.status === 400) {
      return redirect404();
    }
    console.log(err);
  }
};
showTask();

editTaskFormDOM.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const payload = {
      name: taskNameDOM.value,
      completed: taskCompletedDOM.checked,
      dueDate: taskDueDOM?.value || "", 
    };
    await axios.patch(`/api/tasks/${id}`, payload);
    formAlertDOM.style.display = "block";
    formAlertDOM.classList.add("success");
    formAlertDOM.textContent = "編集に成功しました";
    setTimeout(() => {
      formAlertDOM.style.display = "none";
      formAlertDOM.textContent = "";
      formAlertDOM.classList.remove("success");
    }, 3000);
  } catch (err) {
    console.log(err);
    formAlertDOM.style.display = "block";
    formAlertDOM.classList.add("error");
    formAlertDOM.textContent = "1~20文字で登録してください。";
    setTimeout(() => {
      formAlertDOM.style.display = "none";
      formAlertDOM.textContent = "";
      formAlertDOM.classList.remove("error");
    }, 3000);
  }
});

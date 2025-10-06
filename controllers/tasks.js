const mongoose = require("mongoose");
const Task = require("../models/Task");

const parseLocalDateToUTC = (dateStr) => {
  if (!dateStr) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]) - 1, d = Number(m[3]);
  return new Date(y, mo, d, 23, 59, 59, 999);
};


const getAllTasks = async (req, res) => {
  try {
    const now = new Date();
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "15", 10), 1);

    const upcoming = await Task.find({ dueDate: { $ne: null, $gte: now } })
      .sort({ dueDate: 1, createdAt: -1 }).lean();

    const overdue = await Task.find({ dueDate: { $ne: null, $lt: now } })
      .sort({ dueDate: -1, createdAt: -1 }).lean();

    const noDue = await Task.find({ dueDate: null })
      .sort({ createdAt: 1, _id: 1 }).lean();

    const all = [...upcoming, ...overdue, ...noDue];
    const total = all.length;
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const start = (page - 1) * limit;
    const items = all.slice(start, start + limit);

    return res.status(200).json({
      items,
      meta: { total, totalPages, page, limit }
    });
  } catch (err) {
    return res.status(500).json({ error: "server_error", message: err.message });
  }
};



const createTask = async (req, res) => {
  try {
    const { name, completed = false, dueDate } = req.body;

    if (typeof name !== "string" || name.trim().length < 1 || name.trim().length > 20) {
      return res.status(400).json({ error: "bad_request", message: "1~20文字で登録してください。" });
    }

    let due = null;
    if (typeof dueDate === "string" && dueDate) {
      due = parseLocalDateToUTC(dueDate);
      if (!due) {
        return res.status(400).json({ error: "bad_request", message: "期限の日付形式が不正です。(YYYY-MM-DD)" });
      }
    }

    const newTask = await Task.create({
      name: name.trim(),
      completed: !!completed,
      dueDate: due,
    });

    return res.status(201).json(newTask);
  } catch (err) {
    return res.status(500).json({ error: "server_error", message: err.message });
  }
};



const getTask = async (req, res) => {
  try {
    const targetId = req.params.id;
    if (!mongoose.isValidObjectId(targetId)) {
      return res.status(400).json({ error: "bad_request", message: "不正なID形式です。" });
    }
    const targetTask = await Task.findById(targetId);
    if (!targetTask) {
      return res.status(404).json({ error: "not_found", message: `_id:${targetId} は存在しません。` });
    }
    return res.status(200).json(targetTask);
  } catch (err) {
    return res.status(500).json({ error: "server_error", message: err.message });
  }
};


const updateTask = async (req, res) => {
  try {
    const targetId = req.params.id;
    if (!mongoose.isValidObjectId(targetId)) {
      return res.status(400).json({ error: "bad_request", message: "不正なID形式です。" });
    }

    const payload = {};
    if (typeof req.body.name === "string") {
      const nm = req.body.name.trim();
      if (nm.length < 1 || nm.length > 20) {
        return res.status(400).json({ error: "bad_request", message: "1~20文字で登録してください。" });
      }
      payload.name = nm;
    }
    if (typeof req.body.completed === "boolean") payload.completed = req.body.completed;

    if (typeof req.body.dueDate === "string") {
      payload.dueDate = req.body.dueDate ? parseLocalDateToUTC(req.body.dueDate) : null;
      if (req.body.dueDate && !payload.dueDate) {
        return res.status(400).json({ error: "bad_request", message: "期限の日付形式が不正です。(YYYY-MM-DD)" });
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      targetId,
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ error: "not_found", message: `_id:${targetId} は存在しません。` });
    }
    return res.status(200).json(updatedTask);
  } catch (e) {
    if (e.name === "CastError") {
      return res.status(400).json({ error: "bad_request", message: "不正なID形式です。" });
    }
    return res.status(500).json({ error: "server_error", message: e.message });
  }
};


const deleteTask = async (req, res) => {
  try {
    const targetId = req.params.id;
    if (!mongoose.isValidObjectId(targetId)) {
      return res.status(400).json({ error: "bad_request", message: "不正なID形式です。" });
    }
    const deletedTask = await Task.findByIdAndDelete(targetId);
    if (!deletedTask) {
      return res.status(404).json({ error: "not_found", message: `_id:${targetId} は存在しません。` });
    }
    return res.status(200).json(deletedTask);
  } catch (e) {
    return res.status(500).json({ error: "server_error", message: e.message });
  }
};

module.exports = { getAllTasks, createTask, getTask, updateTask, deleteTask };

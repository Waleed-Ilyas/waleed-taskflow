import express from "express";
import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = Number(process.env.API_PORT || 4104);
const dataPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "data.json");
const origins = new Set(["http://localhost:3004", "http://127.0.0.1:3004"]);
app.disable("x-powered-by");
app.use((req, res, next) => {
  const origin = req.get("origin");
  if (origin && !origins.has(origin)) return res.status(403).json({ error: "Origin not allowed" });
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: "32kb", strict: true }));

async function loadStore() {
  return JSON.parse(await readFile(dataPath, "utf8"));
}
async function saveStore(store) {
  const temporary = `${dataPath}.${crypto.randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(store, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  await rename(temporary, dataPath);
}
function validRecord(resource, value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (resource === "tasks")
    return (
      typeof value.title === "string" &&
      value.title.trim().length > 0 &&
      value.title.length <= 160 &&
      (value.assignee === undefined ||
        (typeof value.assignee === "string" && value.assignee.length <= 100)) &&
      (value.label === undefined ||
        (typeof value.label === "string" && value.label.length <= 60)) &&
      (value.priority === undefined || ["High", "Medium", "Low"].includes(value.priority)) &&
      (value.dueDate === undefined ||
        (typeof value.dueDate === "string" && value.dueDate.length <= 40))
    );
  return false;
}

app.get("/api/health", (_req, res) => res.json({ status: "ok", storage: "local-json" }));
app.get("/api/tasks", async (_req, res, next) => {
  try {
    res.json({ data: (await loadStore()).tasks });
  } catch (error) {
    next(error);
  }
});
app.post("/api/tasks", async (req, res, next) => {
  try {
    if (!validRecord("tasks", req.body))
      return res.status(400).json({ error: "A task title is required (160 characters maximum)." });
    const store = await loadStore();
    const task = {
      id: crypto.randomUUID(),
      title: req.body.title.trim(),
      assignee: req.body.assignee?.trim() || "Unassigned",
      label: req.body.label?.trim() || "General",
      priority: req.body.priority || "Medium",
      dueDate: req.body.dueDate || null,
      status: "todo",
      createdAt: new Date().toISOString(),
    };
    store.tasks.unshift(task);
    await saveStore(store);
    res.status(201).json({ data: task });
  } catch (error) {
    next(error);
  }
});
app.patch("/api/tasks/:id", async (req, res, next) => {
  try {
    const store = await loadStore();
    const task = store.tasks.find((item) => item.id === req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found." });
    if (req.body?.status !== undefined) {
      if (!["todo", "in-progress", "done"].includes(req.body.status))
        return res.status(400).json({ error: "Status must be todo, in-progress, or done." });
      task.status = req.body.status;
    }
    if (req.body?.title !== undefined) {
      if (
        typeof req.body.title !== "string" ||
        !req.body.title.trim() ||
        req.body.title.length > 160
      )
        return res.status(400).json({ error: "Title must contain 1–160 characters." });
      task.title = req.body.title.trim();
    }
    const allowedFields = ["status", "title", "assignee", "label", "priority", "dueDate"];
    if (Object.keys(req.body || {}).some((key) => !allowedFields.includes(key)))
      return res.status(400).json({ error: "The request contains an unsupported task field." });
    if (req.body?.assignee !== undefined) {
      if (typeof req.body.assignee !== "string" || req.body.assignee.length > 100)
        return res.status(400).json({ error: "Assignee must be 100 characters or fewer." });
      task.assignee = req.body.assignee.trim();
    }
    if (req.body?.label !== undefined) {
      if (typeof req.body.label !== "string" || req.body.label.length > 60)
        return res.status(400).json({ error: "Label must be 60 characters or fewer." });
      task.label = req.body.label.trim();
    }
    if (req.body?.priority !== undefined) {
      if (!["High", "Medium", "Low"].includes(req.body.priority))
        return res.status(400).json({ error: "Priority must be High, Medium, or Low." });
      task.priority = req.body.priority;
    }
    if (req.body?.dueDate !== undefined) {
      if (typeof req.body.dueDate !== "string" || req.body.dueDate.length > 40)
        return res.status(400).json({ error: "Due date must be 40 characters or fewer." });
      task.dueDate = req.body.dueDate;
    }
    await saveStore(store);
    res.json({ data: task });
  } catch (error) {
    next(error);
  }
});
app.delete("/api/tasks/:id", async (req, res, next) => {
  try {
    const store = await loadStore();
    const index = store.tasks.findIndex((item) => item.id === req.params.id);
    if (index < 0) return res.status(404).json({ error: "Task not found." });
    store.tasks.splice(index, 1);
    await saveStore(store);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});
app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError)
    return res.status(400).json({ error: "Request body must be valid JSON." });
  if (error?.type === "entity.too.large")
    return res.status(413).json({ error: "Request body is too large." });
  console.error("TaskFlow API request failed", error);
  res.status(500).json({ error: "The local API could not complete the request." });
});
app.listen(port, "127.0.0.1", () =>
  console.log(`TaskFlow local API listening on http://127.0.0.1:${port}`),
);

"use client";

import { FormEvent, useMemo, useState } from "react";

type Column = "Backlog" | "In progress" | "In review" | "Done";
type Task = {
  id: number;
  title: string;
  project: string;
  assignee: string;
  initials: string;
  color: string;
  priority: "High" | "Medium" | "Low";
  label: string;
  due: string;
  points: number;
  column: Column;
  tracked: number;
};

const columns: Column[] = ["Backlog", "In progress", "In review", "Done"];
const seedTasks: Task[] = [
  {
    id: 101,
    title: "Map the first-time workspace setup",
    project: "NORTHSTAR",
    assignee: "Maya Chen",
    initials: "MC",
    color: "lavender",
    priority: "High",
    label: "Research",
    due: "Nov 6",
    points: 5,
    column: "Backlog",
    tracked: 0,
  },
  {
    id: 102,
    title: "Add keyboard focus to navigation",
    project: "NORTHSTAR",
    assignee: "Leo Park",
    initials: "LP",
    color: "peach",
    priority: "Medium",
    label: "Accessibility",
    due: "Nov 7",
    points: 3,
    column: "Backlog",
    tracked: 0,
  },
  {
    id: 103,
    title: "Design empty state for project list",
    project: "NORTHSTAR",
    assignee: "Amara Okafor",
    initials: "AO",
    color: "mint",
    priority: "Low",
    label: "Design",
    due: "Nov 10",
    points: 2,
    column: "Backlog",
    tracked: 0,
  },
  {
    id: 104,
    title: "Build reusable filter controls",
    project: "NORTHSTAR",
    assignee: "Waleed Ilyas",
    initials: "WI",
    color: "blue",
    priority: "High",
    label: "Frontend",
    due: "Nov 5",
    points: 5,
    column: "In progress",
    tracked: 0,
  },
  {
    id: 105,
    title: "Document the component tokens",
    project: "NORTHSTAR",
    assignee: "Maya Chen",
    initials: "MC",
    color: "lavender",
    priority: "Medium",
    label: "Docs",
    due: "Nov 8",
    points: 2,
    column: "In progress",
    tracked: 0,
  },
  {
    id: 106,
    title: "Audit loading and error messages",
    project: "ATLAS",
    assignee: "Leo Park",
    initials: "LP",
    color: "peach",
    priority: "Medium",
    label: "Quality",
    due: "Nov 6",
    points: 3,
    column: "In review",
    tracked: 0,
  },
  {
    id: 107,
    title: "Create shared button variants",
    project: "ATLAS",
    assignee: "Amara Okafor",
    initials: "AO",
    color: "mint",
    priority: "Low",
    label: "Frontend",
    due: "Nov 4",
    points: 2,
    column: "Done",
    tracked: 0,
  },
  {
    id: 108,
    title: "Set up responsive type scale",
    project: "ATLAS",
    assignee: "Waleed Ilyas",
    initials: "WI",
    color: "blue",
    priority: "Medium",
    label: "Design",
    due: "Nov 3",
    points: 3,
    column: "Done",
    tracked: 0,
  },
];

export default function TaskFlowPage() {
  const [tasks, setTasks] = useState(seedTasks);
  const [filter, setFilter] = useState("All tasks");
  const [search, setSearch] = useState("");
  const [dragged, setDragged] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [notice, setNotice] = useState("");
  const [activity, setActivity] = useState([
    "Maya moved ‘Map first-time setup’ to Backlog",
    "Leo completed ‘Shared button variants’",
    "Sprint 08 started · Nov 2",
  ]);
  const visibleTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (filter === "All tasks" || task.priority === filter) &&
          `${task.title} ${task.project} ${task.assignee} ${task.label}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [tasks, filter, search],
  );
  const donePoints = tasks
    .filter((task) => task.column === "Done")
    .reduce((total, task) => total + task.points, 0);

  const moveTask = (taskId: number, nextColumn: Column) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.column === nextColumn) return;
    setTasks((current) =>
      current.map((item) => (item.id === taskId ? { ...item, column: nextColumn } : item)),
    );
    setActivity((current) =>
      [`You moved ‘${task.title}’ to ${nextColumn}`, ...current].slice(0, 6),
    );
  };
  const createTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;
    const task: Task = {
      id: Date.now(),
      title: title.trim().slice(0, 90),
      project: "NORTHSTAR",
      assignee: "Waleed Ilyas",
      initials: "WI",
      color: "blue",
      priority: "Medium",
      label: "New",
      due: "Nov 12",
      points: 2,
      column: "Backlog",
      tracked: 0,
    };
    setTasks((current) => [task, ...current]);
    setActivity((current) => [`You created ‘${task.title}’`, ...current].slice(0, 6));
    if (process.env.NODE_ENV !== "production") {
      void fetch("http://127.0.0.1:4104/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          assignee: task.assignee,
          label: task.label,
          priority: task.priority,
          dueDate: task.due,
        }),
      })
        .then((response) => {
          if (!response.ok) throw new Error("API request failed");
        })
        .catch(() => setNotice("Task added to this browser. Start the local API to persist it."));
    }
    setTitle("");
    setShowCreate(false);
  };
  const trackTime = (id: number) => {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, tracked: task.tracked + 15 } : task)),
    );
    setNotice("Added 15 minutes to this task’s local time log.");
  };

  return (
    <main className="task-app">
      <aside className="task-sidebar">
        <div className="task-brand">
          <span>t</span> taskflow <small>DEMO</small>
        </div>
        <button className="workspace">
          <span className="workspace-icon">N</span>
          <span>
            <b>Northstar Studio</b>
            <small>Free workspace</small>
          </span>
          <i>⌄</i>
        </button>
        <nav className="primary-nav">
          <button className="nav-active">
            <span>▦</span> Overview
          </button>
          <button onClick={() => setNotice("Your assigned tasks are visible in the board below.")}>
            <span>☷</span> My tasks <b>4</b>
          </button>
          <button
            onClick={() =>
              setNotice("Inbox is a local UI concept; no notifications are delivered.")
            }
          >
            <span>♧</span> Inbox
          </button>
        </nav>
        <div className="side-label">WORKSPACE</div>
        <button className="project-link">
          <i className="project-dot purple" /> Product refresh <span>⌄</span>
        </button>
        <button className="project-link">
          <i className="project-dot blue-dot" /> Atlas design system
        </button>
        <button className="project-link">
          <i className="project-dot yellow" /> Website updates
        </button>
        <button
          className="add-project"
          onClick={() => setNotice("Project creation is outside this local showcase.")}
        >
          ＋ Add project
        </button>
        <div className="sidebar-bottom">
          <button onClick={() => setNotice("Help center is not connected in this demo.")}>
            ⓘ Help &amp; feedback
          </button>
          <div className="workspace-user">
            <span className="avatar blue">WI</span>
            <span>
              <b>Waleed Ilyas</b>
              <small>Workspace admin · demo</small>
            </span>
            <button aria-label="Account menu">•••</button>
          </div>
        </div>
      </aside>
      <section className="task-main">
        <header className="task-topbar">
          <div className="breadcrumbs">
            Projects <span>/</span> <b>Product refresh</b> <span>/</span> <b>Board</b>
          </div>
          <div className="top-actions">
            <label className="board-search">
              ⌕{" "}
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks"
              />
            </label>
            <button onClick={() => setNotice("Team presence is sample data in this local demo.")}>
              👥 <span>5</span>
            </button>
            <button
              className="invite-button"
              onClick={() => setNotice("Invitations require a configured account backend.")}
            >
              Invite
            </button>
            <span className="avatar blue top-avatar">WI</span>
          </div>
        </header>
        <div className="project-header">
          <div>
            <div className="project-overline">
              <span className="project-dot purple" /> NORTHSTAR STUDIO <span>·</span> PROJECT
            </div>
            <h1>Product refresh</h1>
            <p>Make the everyday workflow feel a little more thoughtful.</p>
          </div>
          <button
            className="share-button"
            onClick={() => setNotice("Sharing is disabled in this standalone demo.")}
          >
            ↗ Share
          </button>
        </div>
        <div className="project-tabs">
          <button className="tab-active">▦ Board</button>
          <button
            onClick={() => setNotice("List view is represented by the board lanes in this demo.")}
          >
            ☷ List
          </button>
          <button onClick={() => setNotice("Timeline view is a future project concept.")}>
            ⌁ Timeline
          </button>
          <button onClick={() => setNotice("Project files are not uploaded to a server.")}>
            ▧ Files
          </button>
          <button
            className="tab-add"
            onClick={() => setNotice("Additional views are not connected.")}
          >
            ＋
          </button>
          <div className="tabs-right">
            <span>SPRINT 08</span>
            <button onClick={() => setNotice("Sprint dates are sample values.")}>
              Nov 2 – Nov 13 ⌄
            </button>
          </div>
        </div>
        <div className="board-toolbar">
          <div className="filter-controls">
            {["All tasks", "High", "Medium", "Low"].map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={filter === item ? "filter-active" : ""}
              >
                {item === "All tasks" ? "☷ " : ""}
                {item}
              </button>
            ))}
            <button
              onClick={() => setNotice("Assignee filters are not connected to a team service.")}
            >
              ♙ Assignee
            </button>
            <button onClick={() => setNotice("Date filters are a UI preview.")}>▦ Due date</button>
          </div>
          <button className="new-task" onClick={() => setShowCreate(true)}>
            ＋ New task
          </button>
        </div>
        <div className="board" aria-label="Kanban board">
          {columns.map((column) => {
            const laneTasks = visibleTasks.filter((task) => task.column === column);
            return (
              <section
                className="board-column"
                key={column}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (dragged !== null) moveTask(dragged, column);
                  setDragged(null);
                }}
              >
                <div className="column-head">
                  <span className={`column-icon ${column.replaceAll(" ", "-").toLowerCase()}`} />{" "}
                  <strong>{column}</strong>
                  <small>{laneTasks.length}</small>
                  <button aria-label={`Add task to ${column}`} onClick={() => setShowCreate(true)}>
                    ＋
                  </button>
                </div>
                <div className="task-cards">
                  {laneTasks.map((task) => (
                    <article
                      className="task-card"
                      key={task.id}
                      draggable
                      onDragStart={() => setDragged(task.id)}
                      onDragEnd={() => setDragged(null)}
                    >
                      <div className="task-card-top">
                        <span>{task.project}</span>
                        <button aria-label="Task options" onClick={() => trackTime(task.id)}>
                          ◷
                        </button>
                      </div>
                      <h2>{task.title}</h2>
                      <div className="task-labels">
                        <span className={`label-chip ${task.label.toLowerCase()}`}>
                          {task.label}
                        </span>
                        <span className={`priority ${task.priority.toLowerCase()}`}>
                          ● {task.priority}
                        </span>
                      </div>
                      <div className="task-card-bottom">
                        <div className="task-due">
                          ▦ {task.due}
                          {task.tracked > 0 && <span> · {task.tracked}m</span>}
                        </div>
                        <div className="task-people">
                          <span className={`avatar ${task.color}`}>{task.initials}</span>
                          <button onClick={() => trackTime(task.id)} title="Log 15 minutes">
                            +15m
                          </button>
                        </div>
                      </div>
                      <label className="move-control">
                        Move to{" "}
                        <select
                          value={task.column}
                          onChange={(event) => moveTask(task.id, event.target.value as Column)}
                          aria-label={`Move ${task.title}`}
                        >
                          {columns.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </label>
                    </article>
                  ))}
                </div>
                <button className="column-add" onClick={() => setShowCreate(true)}>
                  ＋ Add task
                </button>
              </section>
            );
          })}
        </div>
        <footer className="board-footer">
          <span>◷ &nbsp;Sprint progress</span>
          <div className="progress-track">
            <i style={{ width: `${Math.min(100, donePoints * 5)}%` }} />
          </div>
          <b>{donePoints} / 40 pts</b>
          <button onClick={() => setNotice("Sprint summary is based on this sample board only.")}>
            View report ↗
          </button>
        </footer>
      </section>
      <aside className="activity-panel">
        <div className="activity-heading">
          <div>
            <span className="small-overline">PROJECT ACTIVITY</span>
            <h2>Updates</h2>
          </div>
          <button onClick={() => setNotice("Activity notifications are local to this page.")}>
            •••
          </button>
        </div>
        <div className="activity-date">TODAY</div>
        <div className="activity-list">
          {activity.map((item, index) => (
            <article className="activity-item" key={`${item}-${index}`}>
              <span className={`activity-avatar ${index % 2 ? "lavender" : "blue"}`}>
                {index === 0 ? "WI" : index === 1 ? "MC" : "LP"}
              </span>
              <p>{item}</p>
              <small>{index === 0 ? "just now" : `${(index + 1) * 18}m ago`}</small>
            </article>
          ))}
        </div>
        <div className="sprint-card">
          <span className="small-overline">SPRINT 08</span>
          <h3>One week left.</h3>
          <p>Keep the scope visible and the work moving.</p>
          <div className="sprint-numbers">
            <span>
              <b>{tasks.filter((task) => task.column === "Done").length}</b>
              <small>Completed</small>
            </span>
            <span>
              <b>{tasks.filter((task) => task.column !== "Done").length}</b>
              <small>In flight</small>
            </span>
          </div>
        </div>
        <div className="activity-disclosure">Sample workspace data · no shared updates</div>
      </aside>
      {showCreate && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowCreate(false);
          }}
        >
          <form className="task-modal" onSubmit={createTask}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setShowCreate(false)}
              aria-label="Close"
            >
              ×
            </button>
            <span className="small-overline">NEW TASK / BACKLOG</span>
            <h2>Make the next step clear.</h2>
            <label>
              Task title
              <input
                autoFocus
                maxLength={90}
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Review the onboarding flow"
              />
            </label>
            <div className="modal-note">
              New tasks are added to this local board. Team assignment and due dates use sample
              defaults.
            </div>
            <button className="new-task" type="submit">
              Create task
            </button>
          </form>
        </div>
      )}
      {notice && (
        <div className="task-toast" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
    </main>
  );
}

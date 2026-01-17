const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");

const app = express();
const PORT = 3000;

// --- DB ---
const dbPath = path.join(__dirname, "db.sqlite");
const db = new Database(dbPath);

function getDescendantIds(taskId) {
    const children = db
        .prepare("SELECT id FROM tasks WHERE parent_id = ?")
        .all(taskId);

    let ids = [];

    for (const child of children) {
        ids.push(child.id);
        ids = ids.concat(getDescendantIds(child.id));
    }

    return ids;
}


// Crear tabla si no existe
db.prepare(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER NULL,
    position INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// --- Middleware ---
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// --- Routes ---

// GET /tasks -> devuelve todas las tareas
app.get("/tasks", (req, res) => {
    const tasks = db
        .prepare("SELECT * FROM tasks ORDER BY parent_id, position")
        .all();

    res.json(tasks);
});

// POST /tasks -> crear tarea en el inbox
app.post("/tasks", (req, res) => {
    const { title, description = null } = req.body;

    if (!title || title.trim() === "") {
        return res.status(400).json({ error: "Title is required" });
    }

    // Obtener la siguiente posición en el inbox (parent_id NULL)
    const result = db
        .prepare(
            `SELECT COALESCE(MAX(position), -1) + 1 AS nextPos
       FROM tasks
       WHERE parent_id IS NULL`
        )
        .get();

    const stmt = db.prepare(`
    INSERT INTO tasks (parent_id, position, title, description)
    VALUES (NULL, ?, ?, ?)
  `);

    const info = stmt.run(result.nextPos, title.trim(), description);

    const newTask = db
        .prepare("SELECT * FROM tasks WHERE id = ?")
        .get(info.lastInsertRowid);

    res.status(201).json(newTask);
});

// DELETE /tasks/:id
app.delete("/tasks/:id", (req, res) => {
    const id = Number(req.params.id);

    const idsToDelete = [id, ...getDescendantIds(id)];

    const stmt = db.prepare("DELETE FROM tasks WHERE id = ?");

    const tx = db.transaction(() => {
        for (const taskId of idsToDelete) {
            stmt.run(taskId);
        }
    });

    tx();

    res.status(204).end();
});


// POST /tasks/reorder
app.post("/tasks/reorder", (req, res) => {
    const updates = req.body;

    const stmt = db.prepare(`
    UPDATE tasks
    SET parent_id = ?, position = ?
    WHERE id = ?
  `);

    const tx = db.transaction(() => {
        for (const u of updates) {
            stmt.run(u.parent_id, u.position, u.id);
        }
    });

    tx();

    res.status(204).end();
});

// --- Start ---
app.listen(PORT, () => {
    console.log(`mindbox backend running on http://localhost:${PORT}`);
});

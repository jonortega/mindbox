const taskList = document.getElementById("task-list");
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");

taskInput.addEventListener("input", () => {
    autoResizeTextarea(taskInput);
});

// Cargar tareas al iniciar
fetchTasks();

// Construir árbol de tareas
function buildTree(tasks, parentId = null) {
    return tasks
        .filter(t => t.parent_id === parentId)
        .sort((a, b) => a.position - b.position)
        .map(t => ({
            ...t,
            children: buildTree(tasks, t.id)
        }));
}

// Renderizar tareas
function renderTasks(tasks, container, parentId = null) {
    const ul = document.createElement("ul");
    ul.dataset.parentId = parentId;

    tasks.forEach(task => {
        const li = document.createElement("li");
        li.dataset.id = task.id;
        li.dataset.collapsed = "false";

        const content = document.createElement("div");
        content.className = "task";

        const text = document.createElement("div");
        text.className = "text";

        const title = document.createElement("span");
        title.className = "title";
        title.textContent = task.title;

        text.appendChild(title);

        if (task.description) {
            const desc = document.createElement("div");
            desc.className = "description";
            desc.textContent = task.description;
            text.appendChild(desc);
        }

        const delBtn = document.createElement("button");
        delBtn.textContent = "✕";
        delBtn.className = "delete";
        delBtn.onclick = () => deleteTask(task.id);

        content.appendChild(text);
        content.appendChild(delBtn);
        li.appendChild(content);

        // Render hijos (esto CREA el <ul> hijo)
        renderTasks(task.children, li, task.id);

        // Ahora sí: comprobar si hay hijos reales
        const childrenUl = li.querySelector(":scope > ul");

        if (childrenUl && childrenUl.children.length > 0) {
            li.dataset.hasChildren = "true";
            content.style.cursor = "pointer";

            content.addEventListener("click", (e) => {
                // Evitar colapsar al pulsar el botón de borrar
                if (e.target.closest(".delete")) return;

                const collapsed = li.dataset.collapsed === "true";
                li.dataset.collapsed = (!collapsed).toString();
                childrenUl.style.display = collapsed ? "block" : "none";
            });
        } else {
            li.dataset.hasChildren = "false";
        }

        ul.appendChild(li);
    });

    container.appendChild(ul);
    makeSortable(ul);
}

function makeSortable(ul) {
    new Sortable(ul, {
        group: "tasks",
        animation: 150,

        onUpdate: async () => {
            await persistOrder(ul);
        },

        onAdd: async (evt) => {
            await persistOrder(evt.to);
        }
    });
}


async function persistOrder(ul) {
    const parentId = ul.dataset.parentId
        ? Number(ul.dataset.parentId)
        : null;

    const updates = Array.from(ul.children).map((li, index) => ({
        id: Number(li.dataset.id),
        parent_id: parentId,
        position: index
    }));

    await fetch("/tasks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
    });
}

async function fetchTasks() {
    const res = await fetch("/tasks");
    const tasks = await res.json();

    taskList.innerHTML = "";

    const tree = buildTree(tasks);
    renderTasks(tree, taskList);
}


// Crear tarea
taskForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const raw = taskInput.value.trim();
    if (!raw) return;

    const lines = raw.split("\n");
    const title = lines[0];
    const description =
        lines.length > 1
            ? lines.slice(1).join("\n").trim()
            : null;


    await fetch("/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description })
    });

    taskInput.value = "";
    taskInput.style.height = "auto";
    taskInput.focus();
    fetchTasks();
});

// Borrar tarea
async function deleteTask(id) {
    await fetch(`/tasks/${id}`, {
        method: "DELETE"
    });

    fetchTasks();
}

taskInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        taskForm.requestSubmit();
    }
});

function autoResizeTextarea(el) {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
}

taskInput.focus();
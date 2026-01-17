# Mindbox

Mindbox es una web app personal de tareas pensada como un **inbox mental**: un lugar donde volcar ideas y tareas rápidamente, y organizarlas más tarde con calma.

No pretende ser un sistema de productividad complejo, ni una app comercial, ni una herramienta gamificada. **El objetivo es descargar la mente y ordenar pensamientos de forma flexible**.

## Objetivo del MVP

El MVP se centra únicamente en tres acciones fundamentales:

1. Añadir tareas
2. Ordenar y anidar tareas libremente
3. Eliminar tareas

## Funcionalidades actuales

- Inbox único de tareas
- Creación de tareas
- Eliminación de tareas
- Reordenación mediante drag & drop
- Anidación infinita de subtareas (jerarquía libre)
- Persistencia local con SQLite
- Interfaz web simple (HTML, CSS, JavaScript)

## Stack técnico

- Backend:
  - Node.js
  - Express
  - SQLite (better-sqlite3)

- Frontend:
  - HTML
  - CSS
  - JavaScript
  - SortableJS (drag & drop)

## Estructura del proyecto

```sh
mindbox/
├─ server/
│ ├─ server.js
│ └─ db.sqlite # base de datos local (ignorada en git)
│
├─ public/
│ ├─ index.html
│ ├─ style.css
│ └─ app.js
│
├─ package.json
├─ .gitignore
└─ README.md
```

## Instalación y ejecución

1. Instalar dependencias: `npm install`
2. Arrancar el servidor: `node server/server.js`
3. Abrir en el navegador: `http://localhost:3000`

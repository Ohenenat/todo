# TODO App

Simple TODO web app (Express + PostgreSQL) — small project for managing users and tasks.

**Tech stack:** Node.js, Express, PostgreSQL

## Features
- User authentication (login / register)
- Create, update, delete, and list tasks
- Static frontend served from `public/`

## Prerequisites
- Node.js (v16+ recommended)
- PostgreSQL

## Installation
1. Clone the repo and install dependencies:

```powershell
git clone <repo-url>
cd todo
npm install
```




Adjust the values for your environment. The server reads DB settings from these variables (`src/config/db.js`).

## Database setup
1. Create a PostgreSQL database (e.g., `todo_db`).
2. Run the SQL schema to create tables:

```powershell
# Using psql (replace connection params as needed)
psql -h $env:DB_HOST -U $env:DB_USER -d $env:DB_NAME -f src/config/schema.sql
```

Or connect with a DB GUI and run the SQL found in `src/config/schema.sql`.

## Running the app
- Start in production mode:

```powershell
npm start
```

- Start in development mode (with `nodemon`):

```powershell
npm run dev
```

The server serves static files from `src/public` and exposes API routes under `/api`.

By default the server listens on `PORT` from `.env` or `3000`.

## API (overview)
- `POST /api/auth/register` — register a new user
- `POST /api/auth/login` — login and receive auth token/cookie
- `GET/POST/PUT/DELETE /api/tasks` — task CRUD (authenticated)

See `routes/auth.js` and `routes/tasks.js` for details on parameters and responses.

## Project structure

- `src/server.js` — express app entrypoint
- `src/config/db.js` — postgres pool config (reads env vars)
- `src/config/schema.sql` — SQL schema to create tables
- `routes/` — route handlers (`auth.js`, `tasks.js`)
- `middlewares/` — middleware like `auth.js`
- `public/` — frontend static files (`index.html`, `dashboard.html`, `js/`, `css/`)

## Contributing
- Open an issue or PR. Keep changes focused and add tests where appropriate.

## License
MIT-style (add your license or modify as needed).

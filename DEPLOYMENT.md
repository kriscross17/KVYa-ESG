# Deployment guide

The application is intentionally split into a Vite frontend and an Express/Prisma/PostgreSQL backend so they can be deployed independently.

## Frontend

Build:

```bash
npm ci
npm run build
```

Deploy the generated `dist/` directory to a static hosting service. Set:

```env
VITE_API_URL=https://YOUR-BACKEND-DOMAIN/api
```

## Backend

Set these environment variables on the backend platform:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://...
JWT_SECRET=<at least 32 random characters>
CORS_ORIGIN=https://YOUR-FRONTEND-DOMAIN
UPLOAD_DIR=./uploads
```

Then run:

```bash
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm start
```

For a managed PostgreSQL service, use its private connection string when possible. Persistent storage is required for uploaded evidence; for a multi-instance production deployment, move evidence storage to an object-storage service and keep only metadata in PostgreSQL.

## Docker

From `backend/`:

```bash
docker compose up --build
```

The included compose file is for local/demo use. Replace the demo database password and JWT secret before any public deployment.

## Production hardening before public launch

- Replace demo credentials and secrets.
- Use HTTPS for both frontend and backend.
- Restrict `CORS_ORIGIN` to the real frontend domain.
- Use managed PostgreSQL with backups.
- Use object storage for evidence files.
- Add centralized logging and monitoring.
- Add a reverse proxy/WAF and platform rate limits.
- Replace the synthetic office master with verified departmental data.


## Docker deployment hardening

Do not commit real database passwords or JWT secrets. For the included Compose setup, create `backend/.env` with:

```env
POSTGRES_PASSWORD=<strong-password>
JWT_SECRET=<random-secret-at-least-32-characters>
CORS_ORIGIN=https://your-frontend.example
```

The frontend container accepts `VITE_API_URL` at build time:

```bash
docker build --build-arg VITE_API_URL=https://your-api.example/api -t sih-brsr-web .
```

The backend container exposes `/api/health` for readiness/health checks.

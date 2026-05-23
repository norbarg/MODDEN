# Modden

## 1. Clone repository

```bash
git clone <repo_url>
cd MODDEN
```

## 2. Start PostgreSQL in Docker

In the project root:

```bash
docker compose up -d
```

Check that the container is running:

```bash
docker ps
```

There should be a container named `modden-postgres`.

---

## 3. Go to backend

```bash
cd backend
```

## 4. Install dependencies

```bash
pnpm install
```

---

## 5. Create `.env`

Inside the `backend` folder, create a `.env` file.

Example:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/modden_db?schema=public"

PORT=3000
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

JWT_ACCESS_SECRET=super_access_secret
JWT_REFRESH_SECRET=super_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

EMAIL_VERIFICATION_TOKEN_EXPIRES_HOURS=24

PEXELS_API_KEY=your_pexels_api_key
```

---

## 6. Generate Prisma client

```bash
pnpm prisma generate
```

---

## 7. Run migrations

```bash
pnpm prisma migrate dev
```

If migrations already exist, this command will just apply them.

---

## 8. Seed system templates

If system templates are needed:

```bash
pnpm prisma:seed
```

---

## 9. Run backend

```bash
pnpm start:dev
```

After startup, the backend will be available at:

```text
http://localhost:3000
```

Swagger:

```text
http://localhost:3000/api/docs
```

---

# Useful commands

## Open Prisma Studio

```bash
pnpm prisma studio
```

## Stop database

From the project root:

```bash
docker compose down
```

## Full database reset

If you need to fully recreate the local database:

```bash
docker compose down -v
docker compose up -d
cd backend
pnpm prisma migrate dev
pnpm prisma:seed
```

---

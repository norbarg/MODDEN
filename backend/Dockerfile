FROM node:22-alpine AS deps

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
COPY prisma.config.ts ./
COPY prisma ./prisma

RUN pnpm config set strict-dep-builds false && pnpm install --frozen-lockfile


FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml ./
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY . .

RUN pnpm prisma generate
RUN pnpm build


FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
COPY prisma.config.ts ./
COPY prisma ./prisma

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/src/main.js"]
# InvestorOS API + in-process growth-path worker.
# Chromium from Debian instead of Puppeteer's download: the Blueprint PDF needs a browser,
# and Puppeteer picks up PUPPETEER_EXECUTABLE_PATH on its own.

FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV PUPPETEER_SKIP_DOWNLOAD=true
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npx prisma generate && npm run build

FROM node:22-bookworm-slim
RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium fonts-liberation ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PORT=3001 \
    PATH=/app/node_modules/.bin:$PATH
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
# Dev dependencies stay (NODE_ENV=production would drop them): `prisma migrate deploy`, the
# seed (tsx) and the ops scripts run from this image.
RUN npm ci --include=dev && npx prisma generate
COPY --from=build /app/dist ./dist
COPY scripts ./scripts
EXPOSE 3001
# Migrations and the prompt-template seed (an upsert) run on every start, then the API.
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/main.js"]

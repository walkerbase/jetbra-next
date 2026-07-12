# syntax=docker/dockerfile:1

FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app


# 安装依赖
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile


# 构建项目
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build
# RUN pnpm prune --prod


# 生产运行
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3088
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs \
  && mkdir -p /app/cert \
  && chown -R nextjs:nodejs /app

COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# 项目存在 public 目录时再取消下面这行注释
# COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3088

CMD ["node_modules/.bin/next", "start", "-p", "3088", "-H", "0.0.0.0"]
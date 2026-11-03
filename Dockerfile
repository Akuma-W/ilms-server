# ---------- BUILD STAGE ----------
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# ---------- PRODUCTION STAGE ----------
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Tạo non-root user cho production container và cấp quyền thư mục logs
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001 && mkdir -p /app/logs && chown -R nestjs:nodejs /app

COPY package*.json ./
RUN npm ci --omit=dev

# Copy prisma schema và runtime artifacts
COPY --from=builder /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/src/generated/prisma ./src/generated/prisma
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Cấp quyền cho thư mục làm việc trước khi chuyển sang user non-root
RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 5000

ENV PORT=5000

CMD ["node", "dist/main"]

# ---------- 构建阶段 ----------
FROM node:20-alpine AS build
WORKDIR /app

# 先拷贝依赖清单，利用镜像层缓存
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ---------- 运行阶段（非 root nginx） ----------
FROM nginxinc/nginx-unprivileged:1.27-alpine

# SPA 路由回退配置
COPY nginx.conf /etc/nginx/conf.d/default.conf
# 静态产物
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

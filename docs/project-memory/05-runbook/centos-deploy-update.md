# CentOS 服务器部署与更新（Nginx + Docker）

本手册描述一种“宿主机不需要安装 Node/npm”的部署方式：

- 前端：Nginx 直接托管 `dist/`（静态文件 + SPA 路由）
- 联机：Docker 跑 WebSocket server（监听 `127.0.0.1:8787`），由 Nginx `/ws` 反代

适用域名示例：`game.xxx.cn`

## 目标架构

- Web：
  - `https://game.xxx.cn/` → Nginx → `dist/`
- WebSocket：
  - `wss://game.xxx.cn/ws` → Nginx（反代）→ `http://127.0.0.1:8787`
- 端口开放：
  - 对公网：80、443
  - 不对公网：8787（仅本机）

## 0. DNS 与安全组

- DNS：`game.xxx.cn` 配置 A 记录指向服务器公网 IP
- 安全组/防火墙：
  - 放通 TCP 80、443
  - 不需要放通 TCP 8787（建议不要放通）

## 1. 服务器目录约定

示例项目路径：

- `/root/myfile/games/guihaiyidao`
  - `dist/`：前端构建产物（Nginx root 指向这里）
  - `server/`：WS 服务端源码（容器 bind mount 后在容器内安装依赖并启动）

## 2. Nginx 配置（HTTP + HTTPS + /ws 反代）

示例：`/etc/nginx/conf.d/guihaiyidao.conf`

### 2.1 HTTP（80）

用于：
- 证书签发/续期的 ACME 验证
- 其它请求跳转到 HTTPS

```nginx
server {
  listen 80;
  server_name game.xxx.cn;

  location ^~ /.well-known/acme-challenge/ {
    root /var/www/certbot;
    default_type "text/plain";
    try_files $uri =404;
  }

  return 301 https://$host$request_uri;
}
```

### 2.2 HTTPS（443）

```nginx
server {
  listen 443 ssl;
  server_name game.xxx.cn;

  ssl_certificate /etc/letsencrypt/live/game.xxx.cn/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/game.xxx.cn/privkey.pem;

  root /root/myfile/games/guihaiyidao/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /ws {
    proxy_pass http://127.0.0.1:8787;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
  }
}
```

应用配置：

```bash
mkdir -p /var/www/certbot
nginx -t && systemctl reload nginx
```

## 3. 申请 HTTPS 证书（Docker 版 certbot）

如果系统 certbot 受 Python2/依赖影响，直接用 Docker 版。

### 3.1 申请证书

```bash
docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/certbot:/var/www/certbot \
  certbot/certbot certonly \
  --webroot -w /var/www/certbot \
  -d game.xxx.cn \
  --agree-tos -m you@example.com --no-eff-email
```

申请成功后，重载 Nginx：

```bash
nginx -t && systemctl reload nginx
```

### 3.2 续期（cron）

```bash
crontab -e
```

加入：

```bash
0 3 * * * docker run --rm -v /etc/letsencrypt:/etc/letsencrypt -v /var/www/certbot:/var/www/certbot certbot/certbot renew --webroot -w /var/www/certbot --quiet && systemctl reload nginx
```

## 4. 启动 WS 服务（Docker，宿主机无需 npm）

WS 服务默认端口 `8787`，容器只映射到 `127.0.0.1`：

```bash
docker run -d \
  --name guihaiyidao-ws \
  --restart unless-stopped \
  -p 127.0.0.1:8787:8787 \
  -e PORT=8787 \
  -e NODE_ENV=production \
  -v /root/myfile/games/guihaiyidao:/app \
  -w /app/server \
  node:20-bullseye \
  bash -lc "npm ci --include=dev && npm run dev"
```

检查日志：

```bash
docker logs -f --tail=200 guihaiyidao-ws
```

看到 `ws server listening on ws://localhost:8787` 即正常。

## 5. 构建/更新前端 dist（Docker 构建）

宿主机没有 npm 时，使用 node 容器构建 `dist/`：

```bash
cd /root/myfile/games/guihaiyidao
git pull

docker run --rm \
  -v /root/myfile/games/guihaiyidao:/app \
  -w /app \
  node:20-bullseye \
  bash -lc "npm ci && npm run build"

nginx -t
/usr/sbin/nginx -s reload
```

## 6. 更新流程（推荐顺序）

1. 拉取代码：

```bash
cd /root/myfile/games/guihaiyidao
git checkout main
git pull
```

2. 更新前端：

```bash
docker run --rm -v /root/myfile/games/guihaiyidao:/app -w /app node:20-bullseye bash -lc "npm ci && npm run build"
nginx -t && systemctl reload nginx
```

3. 更新 WS（如 server 代码有变）：

```bash
docker restart guihaiyidao-ws
docker logs -f --tail=200 guihaiyidao-ws
```

## 7. 排障命令

### 7.1 验证端口监听（8787 必须是 127.0.0.1）

```bash
ss -lntp | grep 8787 || netstat -lntp | grep 8787
```

### 7.2 验证 /ws 是否能升级（期望 101）

```bash
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Host: game.xxx.cn" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: SGVsbG9Xb3JsZA==" \
  https://game.xxx.cn/ws
```

### 7.3 常见问题：页面还是旧版本

- Nginx root 指向的是 `dist/`，仓库更新并不会自动更新 dist
- 需要执行“构建/更新前端 dist”步骤
- 浏览器可能有缓存，可用无痕模式或 URL 加 `?v=xxx` 强制刷新

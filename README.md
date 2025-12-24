# Cloudflare Image Cloud

一个基于 Cloudflare Workers、R2 和 KV 的个人图床服务，完全免费且高性能。

![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![Hono](https://img.shields.io/badge/Hono-4.x-E36002?logo=hono)

## ✨ 功能特性

- 🔐 **登录认证**：基于 JWT + Cookie 的安全认证系统
- 📤 **拖拽上传**：支持拖拽文件和点击选择文件上传
- 📋 **自动复制**：上传成功后自动复制图片 URL 到剪贴板
- 🖼️ **图片管理**：查看所有已上传图片，支持删除和复制链接
- 🚀 **边缘缓存**：利用 Cloudflare CDN 缓存，访问速度极快
- 🛡️ **防盗链**：通过 Snippets 实现 Referer 检查和 User-Agent 过滤
- 💰 **零成本**：完全使用 Cloudflare 免费套餐，适合个人使用

## 🏗️ 技术栈

### 后端
- **Hono** - 轻量级 Web 框架
- **Cloudflare Workers** - 边缘计算平台
- **Cloudflare R2** - 对象存储（兼容 S3）
- **Cloudflare KV** - 键值存储
- **jose** - JWT 认证库

### 前端
- **Hono JSX** - 服务端渲染
- **Vanilla JavaScript** - 客户端交互
- **CSS** - 响应式样式

### 工具
- **Bun** - JavaScript 运行时和包管理器
- **TypeScript** - 类型安全
- **Vite** - 构建工具

## 📦 项目结构

```
cf-image-cloud/
├── src/
│   ├── types/              # TypeScript 类型定义
│   │   ├── env.ts         # Cloudflare bindings 接口
│   │   └── image.ts       # 图片元数据类型
│   ├── utils/             # 工具函数
│   │   ├── id-generator.ts
│   │   ├── jwt.ts         # JWT 生成和验证
│   │   └── constants.ts
│   ├── services/          # 业务逻辑层
│   │   ├── validation.ts  # 文件验证
│   │   ├── storage.ts     # R2 操作
│   │   └── metadata.ts    # KV 操作
│   ├── middleware/        # 中间件
│   │   ├── auth.ts        # JWT 认证
│   │   └── error.ts       # 错误处理
│   ├── routes/            # API 路由
│   │   ├── api/
│   │   │   ├── login.ts   # 登录/登出
│   │   │   ├── check-auth.ts
│   │   │   ├── upload.ts
│   │   │   ├── images.ts
│   │   │   ├── image-detail.ts
│   │   │   └── delete.ts
│   │   └── serve.ts       # 图片服务
│   ├── pages/             # 页面组件
│   │   ├── Login.tsx
│   │   └── Home.tsx
│   ├── client.ts          # 客户端 JavaScript
│   ├── index.tsx          # 主入口
│   ├── renderer.tsx       # JSX 渲染器
│   └── style.css          # 样式文件
├── wrangler.jsonc         # Cloudflare Workers 配置
├── .dev.vars              # 本地开发环境变量（不提交）
└── cloudflare-snippet.js  # Cloudflare Snippet 防护代码
```

## 🚀 快速开始

### 前置要求

- [Bun](https://bun.sh) >= 1.0
- [Cloudflare 账号](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd cf-image-cloud
```

### 2. 安装依赖

```bash
bun install
```

### 3. 配置本地环境变量

创建 `.dev.vars` 文件（已在 `.gitignore` 中）：

```bash
# .dev.vars
AUTH_USERNAME=your-email@example.com
AUTH_PASSWORD=your-secure-password
JWT_SECRET=your-random-jwt-secret-at-least-32-characters-long
```

**重要提示**：
- `AUTH_USERNAME`：登录用户名（可以是邮箱）
- `AUTH_PASSWORD`：登录密码
- `JWT_SECRET`：JWT 加密密钥，至少 32 字符的随机字符串

### 4. 本地开发

```bash
bun run dev
```

访问 http://localhost:8787

## 📤 部署到 Cloudflare

### 1. 创建 R2 存储桶

```bash
wrangler r2 bucket create cf-image-cloud-storage
```

### 2. 创建 KV 命名空间

```bash
# 生产环境
wrangler kv namespace create IMAGE_METADATA

# 开发环境（可选）
wrangler kv namespace create IMAGE_METADATA --preview
```

执行后会返回 namespace ID，更新 `wrangler.jsonc` 中的 `id` 和 `preview_id` 字段。

### 3. 设置生产环境密钥

```bash
# 设置用户名
wrangler secret put AUTH_USERNAME
# 输入你的用户名

# 设置密码
wrangler secret put AUTH_PASSWORD
# 输入你的密码

# 设置 JWT 密钥
wrangler secret put JWT_SECRET
# 输入一个随机的长字符串（至少32字符）
```

### 4. 生成类型定义

```bash
bun run cf-typegen
```

### 5. 部署

```bash
bun run deploy
```

部署成功后，访问你的 Workers 域名（如 `https://cf-image-cloud.your-subdomain.workers.dev`）。

### 6. 配置 Cloudflare Snippet（防盗链）

**可选但推荐**：在 Cloudflare Dashboard 配置 Snippet 以防止图片被盗链和刷流量。

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Rules** → **Snippets**
3. 点击 **Create Snippet**
4. 复制 `cloudflare-snippet.js` 的内容
5. **重要**：修改 `allowedDomains` 为你的实际域名
6. 部署

详细配置说明请查看 [SNIPPET-CONFIG.md](./SNIPPET-CONFIG.md)

## 📖 使用指南

### 登录系统

1. 访问你的图床网址
2. 会自动跳转到登录页 `/login`
3. 输入在 `.dev.vars` 或 secrets 中设置的用户名和密码
4. 登录成功后跳转到主页

### 上传图片

1. **方式一**：点击上传区域，选择图片文件
2. **方式二**：直接拖拽图片到上传区域
3. 支持的格式：JPG, PNG, GIF, WebP, SVG
4. 文件大小限制：10MB

### 自动复制链接

上传成功后，图片 URL 会自动复制到剪贴板：
- 成功提示会显示完整 URL
- 直接 `Ctrl+V` / `Cmd+V` 即可粘贴使用
- URL 格式：`https://your-domain.com/i/{image-id}`

### 图片管理

- **查看列表**：所有上传的图片按时间倒序显示
- **复制链接**：点击 "Copy Link" 按钮复制图片 URL
- **删除图片**：点击 "Delete" 按钮删除图片（需确认）
- **刷新列表**：点击 "Refresh" 按钮重新加载图片列表

### 登出

点击右上角 "Logout" 按钮退出登录。

## 🛡️ 安全与防护

### 认证机制

- **JWT Token**：登录后生成 JWT token 存储在 HttpOnly Cookie 中
- **7 天有效期**：Token 有效期 7 天，过期后需重新登录
- **自动跳转**：未登录访问时自动跳转到登录页
- **Session 检查**：API 请求会验证 Cookie 中的 JWT token

### 防盗链策略

通过 Cloudflare Snippet 实现：

1. **Referer 检查**：只允许指定域名或空 referer 访问
2. **User-Agent 过滤**：阻止爬虫和自动化工具
3. **Method 限制**：图片服务仅允许 GET 和 HEAD 请求

### 缓存优化

- **边缘缓存**：图片在 Cloudflare CDN 缓存 1 年
- **浏览器缓存**：设置 `immutable` 标记，优化重复访问
- **成本控制**：99.9% 的请求由 CDN 处理，几乎零成本

## 💰 成本分析

### Cloudflare 免费额度

- **R2 存储**：10 GB/月
- **R2 Class A 操作**（上传）：1,000,000 次/月
- **R2 Class B 操作**（下载）：10,000,000 次/月
- **Workers 请求**：100,000 次/天（3,000,000 次/月）
- **KV 存储**：1 GB
- **KV 读取**：100,000 次/天
- **KV 写入**：1,000 次/天

### 实际成本

对于个人使用，**完全免费**：

假设每张图片被访问 100 万次：
- **首次访问**：触发 Worker → R2 读取（计费 1 次）
- **后续 999,999 次**：Cloudflare CDN 缓存命中（免费）

**结论**：利用 CDN 缓存，即使图片被大量访问也不会产生费用。

## 🔧 配置说明

### wrangler.jsonc

```jsonc
{
  "name": "cf-image-cloud",
  "compatibility_date": "2025-08-03",
  "main": "./src/index.tsx",

  // R2 存储桶配置
  "r2_buckets": [
    {
      "binding": "IMAGE_BUCKET",
      "bucket_name": "cf-image-cloud-storage"
    }
  ],

  // KV 命名空间配置
  "kv_namespaces": [
    {
      "binding": "IMAGE_METADATA",
      "id": "your-kv-namespace-id",
      "preview_id": "your-preview-namespace-id"
    }
  ],

  // 环境变量
  "vars": {
    "MAX_FILE_SIZE": 10485760,  // 10MB
    "ALLOWED_ORIGINS": "*"
  }
}
```

### 环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `AUTH_USERNAME` | 登录用户名 | `admin@example.com` |
| `AUTH_PASSWORD` | 登录密码 | `SecurePass123!` |
| `JWT_SECRET` | JWT 加密密钥 | 32+ 字符随机字符串 |
| `MAX_FILE_SIZE` | 最大文件大小（字节） | `10485760`（10MB） |
| `ALLOWED_ORIGINS` | CORS 允许的源 | `*` 或指定域名 |

## 🤝 API 文档

### 认证相关

#### POST /api/login
登录接口

**请求体**：
```json
{
  "username": "admin@example.com",
  "password": "your-password"
}
```

**响应**：
```json
{
  "success": true
}
```

#### POST /api/logout
登出接口

**响应**：
```json
{
  "success": true
}
```

#### GET /api/check-auth
检查认证状态

**响应**：
```json
{
  "authenticated": true,
  "username": "admin@example.com"
}
```

### 图片管理

#### POST /api/upload
上传图片（需要认证）

**请求**：
- Content-Type: `multipart/form-data`
- Body: `file` 字段包含图片文件

**响应**：
```json
{
  "success": true,
  "image": {
    "id": "abc123def456",
    "filename": "abc123def456_image.png",
    "originalFilename": "image.png",
    "size": 102400,
    "contentType": "image/png",
    "uploadTime": "2025-01-01T00:00:00.000Z",
    "r2Key": "images/abc123def456/image.png"
  }
}
```

#### GET /api/images
获取所有图片列表（需要认证）

**响应**：
```json
{
  "images": [...],
  "total": 10
}
```

#### GET /api/images/:id
获取单个图片元数据（公开）

**响应**：
```json
{
  "id": "abc123def456",
  "filename": "abc123def456_image.png",
  ...
}
```

#### DELETE /api/images/:id
删除图片（需要认证）

**响应**：
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

#### GET /i/:id
访问图片（公开）

直接返回图片文件，支持浏览器缓存和 CDN 缓存。

## 🐛 故障排查

### 登录失败

1. 检查 `.dev.vars`（本地）或 secrets（生产）是否正确设置
2. 确认用户名和密码输入无误
3. 查看浏览器控制台错误信息

### 上传失败

1. 检查文件大小是否超过 10MB
2. 确认文件类型是否为支持的图片格式
3. 检查 R2 bucket 是否正确创建和绑定
4. 查看 Workers 日志：`wrangler tail`

### 图片无法访问

1. 检查 KV 中是否存在图片元数据
2. 确认 R2 中文件是否存在
3. 检查 Snippet 是否阻止了请求（查看响应头 `X-Blocked-Reason`）

### TypeScript 错误

运行以下命令生成类型：
```bash
bun run cf-typegen
```

## 📝 开发命令

```bash
# 安装依赖
bun install

# 本地开发
bun run dev

# 构建项目
bun run build

# 预览构建结果
bun run preview

# 部署到 Cloudflare
bun run deploy

# 生成 Cloudflare 类型
bun run cf-typegen

# 查看 Workers 日志
wrangler tail
```

## 📄 许可证

MIT License

## 🙏 致谢

- [Hono](https://hono.dev/) - 现代化的 Web 框架
- [Cloudflare Workers](https://workers.cloudflare.com/) - 边缘计算平台
- [Bun](https://bun.sh/) - 快速的 JavaScript 运行时

## 🔗 相关链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [Cloudflare KV 文档](https://developers.cloudflare.com/kv/)
- [Hono 文档](https://hono.dev/)

---

**💡 提示**：如果觉得这个项目对你有帮助，欢迎 Star ⭐

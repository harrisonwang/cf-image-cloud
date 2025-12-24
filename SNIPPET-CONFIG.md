# Cloudflare Snippet 配置指南

## 功能概述

本项目使用 Cloudflare Snippets 在边缘节点（CDN 层）提前过滤请求，减少 Worker 调用次数，降低成本并提升安全性。

### 已实现的防护功能

1. **地理位置限制** - 仅允许中国和美国访问管理后台
2. **文件上传预检** - 在到达 Worker 前检查文件大小
3. **图片防盗链** - 限制允许的 Referer 域名
4. **User-Agent 过滤** - 阻止爬虫和自动化工具
5. **HTTP Method 限制** - 图片服务仅允许 GET 和 HEAD 请求

---

## 部署步骤

### 1. 登录 Cloudflare Dashboard
访问：https://dash.cloudflare.com

### 2. 进入 Snippets 配置
1. 选择你的域名
2. 导航到：**Rules** → **Snippets**
3. 点击 **Create Snippet**

### 3. 配置 Snippet
- **Name**: `image-cloud-protection`
- **Code**: 复制 `cloudflare-snippet.js` 的完整内容
- **Trigger**:
  - 选择 **All incoming requests**（所有传入请求）
  - 或者自定义：Hostname equals `your-domain.com`

### 4. 部署
点击 **Deploy** 或 **Save and Deploy**

---

## 功能详解

### 1️⃣ 地理位置限制

**限制区域**: 仅允许 `CN` (中国) 和 `US` (美国) 访问

**保护的 API 端点**:
- `/api/upload` - 图片上传
- `/api/images` - 图片列表

**工作原理**:
- 读取 `request.cf.country` 获取访问者国家代码
- 如果不在白名单，直接返回 403 错误，**不会触发 Worker**

**成本节省**: 每拦截 1 个海外恶意请求 = 节省 1 次 Worker 调用

**自定义配置**:
```javascript
const allowedCountries = ['CN', 'US', 'HK', 'TW', 'SG']; // 添加更多国家
```

国家代码参考: [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)

---

### 2️⃣ 文件上传预检

**检查方式**: 读取 `Content-Length` 请求头

**大小限制**: 10MB (10,485,760 字节)

**工作原理**:
- 在 Worker 执行前检查请求头中的 `Content-Length`
- 如果超过限制，直接返回 413 错误

**成本节省**:
- 避免 Worker 执行
- 避免 FormData 解析（内存密集型操作）
- 避免潜在的 R2 写入尝试

**注意事项**:
- ⚠️ 只能检查 HTTP 头，无法验证实际内容
- ⚠️ 不能替代 Worker 中的完整文件验证
- ✅ 作为第一道防线，拦截明显超标的上传

**自定义配置**:
```javascript
const maxSize = 20 * 1024 * 1024; // 改为 20MB
```

---

### 3️⃣ 图片防盗链

**允许的域名**:
- `localhost:5173` - Vite 本地开发
- `localhost:8787` - Wrangler 本地开发
- `localhost` - 通用本地开发
- `img.510006.xyz` - 你的主域名
- `nodeseek.com` - 允许引用的外部域名

**工作原理**:
- 检查请求的 `Referer` 头
- 允许空 Referer（直接在浏览器访问）
- 如果 Referer 不在白名单，返回 403 错误

**成本节省**: 每拦截 1 个盗链请求 = 节省 1 次 Worker 调用 + 1 次 R2 读取

**添加新域名**:
```javascript
const allowedDomains = [
  // ... 现有域名
  'new-domain.com',      // 添加新域名
  'blog.example.com',    // 支持子域名
];
```

---

### 4️⃣ User-Agent 过滤

**阻止的 User-Agent**:
- `scrapy` - Python 爬虫框架
- `python-requests` - Python HTTP 库
- `bot` - 通用机器人
- `crawler` - 通用爬虫
- `spider` - 通用蜘蛛

**注意**:
- ✅ 已移除 `curl` 和 `wget`（方便开发调试）
- ⚠️ 如果需要阻止 curl/wget，可以手动添加回去

**自定义配置**:
```javascript
const blockedAgents = [
  'scrapy',
  'python-requests',
  'curl',              // 取消注释以阻止 curl
  'wget',              // 取消注释以阻止 wget
  'bot',
  'crawler',
  'spider',
  'headless',          // 添加：阻止无头浏览器
  'phantom',           // 添加：阻止 PhantomJS
];
```

---

### 5️⃣ HTTP Method 限制

**允许的方法**: 仅 `GET` 和 `HEAD`

**应用范围**: 仅图片访问路径 `/i/*`

**工作原理**:
- 拒绝 POST、PUT、DELETE 等写操作
- 返回 405 Method Not Allowed

---

## 测试 Snippet

### 1. 测试地理位置限制

**方法 1**: 使用 VPN 切换到非 CN/US 地区
```bash
# 从非允许地区访问
curl -X POST https://your-domain.com/api/upload
# 预期返回: {"success":false,"error":"Access denied from your region"}
# HTTP 状态码: 403
```

**方法 2**: 在本地模拟（修改代码临时测试）
```javascript
const country = 'JP'; // 临时硬编码为日本
```

### 2. 测试文件大小限制

```bash
# 模拟 20MB 的上传请求
curl -X POST https://your-domain.com/api/upload \
  -H "Content-Length: 20971520"

# 预期返回: {"success":false,"error":"File size exceeds 10MB limit"}
# HTTP 状态码: 413
```

### 3. 测试防盗链

```bash
# 测试不允许的 Referer
curl -H "Referer: https://evil-site.com" \
  https://your-domain.com/i/some-image-id

# 预期返回: Hotlinking is not allowed
# HTTP 状态码: 403
# 响应头: X-Blocked-Reason: Invalid-Referer
```

```bash
# 测试允许的 Referer
curl -H "Referer: https://img.510006.xyz/post/123" \
  https://your-domain.com/i/some-image-id

# 预期返回: 正常图片内容（如果图片存在）
# HTTP 状态码: 200
```

### 4. 测试 User-Agent 过滤

```bash
# 测试被阻止的 User-Agent
curl -A "python-requests/2.28.0" \
  https://your-domain.com/i/some-image-id

# 预期返回: Access denied
# HTTP 状态码: 403
# 响应头: X-Blocked-Reason: Blocked-User-Agent
```

### 5. 测试正常访问

```bash
# 浏览器直接访问（空 Referer）
curl https://your-domain.com/i/some-image-id

# 预期返回: 正常图片内容
# HTTP 状态码: 200
```

---

## 监控与分析

### 查看拦截日志

1. **Cloudflare Dashboard** → **Analytics** → **Security**
2. 筛选事件类型：**Snippet**
3. 查看被阻止的请求：
   - 按 `X-Blocked-Reason` 分类
   - 按国家/地区分类
   - 按 IP 地址分类

### 查看缓存命中率

1. **Cloudflare Dashboard** → **Caching** → **Configuration**
2. 查看 **Cache Analytics**
3. 验证图片缓存是否生效（应该接近 100%）

### 查看 Worker 请求量

1. **Cloudflare Dashboard** → **Workers & Pages** → **Overview**
2. 查看 **Requests** 图表
3. 部署 Snippet 后，Worker 请求量应该**显著下降**

---

## 成本分析

### 使用 Snippet 前后对比

**场景**: 图床每天被访问 10,000 次

#### 使用 Snippet 前
```
10,000 次请求 → 10,000 次 Worker 调用 → 潜在的 10,000 次 R2 读取
```

#### 使用 Snippet 后
```
10,000 次请求
  ├─ 50 次海外恶意扫描 → Snippet 拦截 (0 Worker 调用)
  ├─ 10 次超大文件上传 → Snippet 拦截 (0 Worker 调用)
  ├─ 100 次盗链请求 → Snippet 拦截 (0 Worker 调用)
  ├─ 9,840 次正常访问
      ├─ 9,839 次 CDN 缓存命中 (0 Worker 调用)
      └─ 1 次 Worker + R2 读取
```

**每日成本节省**:
- Worker 调用: 10,000 → **1 次** (节省 99.99%)
- R2 读取: 10,000 → **1 次** (节省 99.99%)

### Cloudflare 免费额度

- **Snippets**: ✅ 完全免费，无限次执行
- **Workers**: 100,000 次/天
- **R2 读取**: 10,000,000 次/月
- **CDN 缓存**: ✅ 完全免费，无限流量

**结论**: 配合 Snippet + CDN 缓存，个人图床几乎**零成本运行** 🎉

---

## 故障排查

### Snippet 没有生效？

**检查项**:
1. ✅ Snippet 是否已部署（状态应为 "Active"）
2. ✅ 触发规则是否正确（应该匹配所有传入请求）
3. ✅ 是否清空了浏览器缓存
4. ✅ 检查响应头是否包含 `X-Blocked-Reason`

**调试方法**:
```bash
# 查看完整响应头
curl -I https://your-domain.com/i/test

# 如果看到 X-Blocked-Reason 头，说明 Snippet 已生效
```

### 合法访问被阻止？

**可能原因**:

1. **Referer 不匹配**
   - 检查 `allowedDomains` 是否包含你的域名
   - 确认域名拼写正确（区分大小写）

2. **User-Agent 被误拦**
   - 临时注释掉 User-Agent 检查
   - 查看是否恢复正常

3. **地理位置限制**
   - 确认访问者是否在 CN/US
   - 如需支持其他地区，添加到 `allowedCountries`

**临时禁用某个检查**:
```javascript
// 临时注释掉地理位置限制
/*
if (url.pathname.startsWith('/api/upload') || ...) {
  // ... 地理位置检查代码
}
*/
```

### CDN 缓存未命中？

**检查项**:
1. ✅ 响应头是否包含 `Cache-Control: public, max-age=31536000`
2. ✅ 响应头是否包含 `CDN-Cache-Control`
3. ✅ URL 是否包含查询参数（`?timestamp=xxx` 会破坏缓存）

**优化建议**:
```javascript
// 在 Worker 中确保图片响应包含缓存头
headers.set('Cache-Control', 'public, max-age=31536000, immutable');
headers.set('CDN-Cache-Control', 'public, max-age=31536000');
```

### 本地开发时图片无法加载？

**原因**: 本地开发服务器的端口可能不在白名单中

**解决方案**:
```javascript
const allowedDomains = [
  'localhost:5173',     // Vite 默认端口
  'localhost:5174',     // Vite 备用端口
  'localhost:8787',     // Wrangler 默认端口
  'localhost:3000',     // 其他常用端口
  '127.0.0.1',          // 支持 IP 访问
];
```

---

## 高级配置

### IP 黑名单（可选）

如果发现恶意 IP 持续攻击，可以手动添加到黑名单：

```javascript
// 在 Snippet 开头添加
const clientIP = request.headers.get('CF-Connecting-IP');
const blockedIPs = [
  '1.2.3.4',
  '5.6.7.8',
];

if (blockedIPs.includes(clientIP)) {
  return new Response('Forbidden', {
    status: 403,
    headers: { 'X-Blocked-Reason': 'IP-Blacklist' }
  });
}
```

### 基于时间的限流（高级）

配合 Cloudflare Rate Limiting Rules 使用：

1. **Dashboard** → **Security** → **WAF** → **Rate limiting rules**
2. 创建规则：
   - **Path**: `/api/upload`
   - **Limit**: 10 requests per minute
   - **Action**: Block

### 维护模式（可选）

在维护期间临时阻止访问：

```javascript
// 在 Snippet 开头添加
const maintenanceMode = false; // 维护时改为 true

if (maintenanceMode) {
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head><title>维护中</title></head>
    <body>
      <h1>🛠️ 系统维护中</h1>
      <p>图床服务正在维护，请稍后再试。</p>
    </body>
    </html>
  `, {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
```

---

## 总结

通过 Cloudflare Snippets 实现边缘层防护，你的图床服务可以：

✅ **降低成本** - 减少 99% 以上的 Worker 和 R2 调用
✅ **提升安全** - 多层防护阻止恶意访问
✅ **优化性能** - 在 CDN 层直接拦截，响应更快
✅ **易于管理** - 无需修改 Worker 代码，在 Dashboard 即时更新

**推荐监控指标**:
- Worker 请求量（应该极低）
- CDN 缓存命中率（应该 > 99%）
- Snippet 拦截次数（安全事件日志）

如有问题，请参考 [Cloudflare Snippets 官方文档](https://developers.cloudflare.com/rules/snippets/)。

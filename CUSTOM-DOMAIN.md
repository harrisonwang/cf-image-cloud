# 自定义域名配置指南

本文档介绍如何为 Cloudflare Image Cloud 配置自定义域名。

## 前提条件

- ✅ 拥有一个域名（如 `example.com`）
- ✅ 域名已托管在 Cloudflare DNS 上
- ✅ 域名状态为 Active（绿色勾号）

如果域名还未托管到 Cloudflare：
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 点击 **Add a Site**
3. 按照引导将域名 NS 记录指向 Cloudflare

---

## 方式一：Cloudflare Dashboard 配置（推荐）

**优点**：简单直观，不需要修改代码，即时生效

### 步骤 1：访问 Workers 设置

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 点击左侧菜单 **Workers & Pages**
3. 找到你的 Worker：`cf-image-cloud`
4. 点击进入详情页面

### 步骤 2：添加自定义域名

1. 点击 **Settings** 标签
2. 向下滚动找到 **Domains & Routes** 部分
3. 点击 **Add Custom Domain** 按钮

### 步骤 3：输入域名

建议使用子域名（如 `img.example.com`）：

```
img.example.com
```

或者使用根域名（不推荐，除非专门用于图床）：

```
example.com
```

### 步骤 4：确认添加

1. 点击 **Add Domain**
2. Cloudflare 会自动：
   - 创建 DNS 记录
   - 配置 SSL/TLS 证书（自动 HTTPS）
   - 设置路由规则

### 步骤 5：等待生效

- 通常几秒钟内生效
- 全球 DNS 传播可能需要 1-5 分钟

### 步骤 6：测试访问

访问你的自定义域名：

```
https://img.example.com
```

应该能看到登录页面。

---

## 方式二：通过 wrangler.jsonc 配置

**优点**：配置即代码，便于版本控制

### 步骤 1：编辑配置文件

打开 `wrangler.jsonc`，取消注释并修改 `routes` 部分：

```jsonc
{
  "name": "cf-image-cloud",
  "compatibility_date": "2025-08-03",
  "main": "./src/index.tsx",

  // 启用自定义域名（禁用 workers.dev 域名）
  "workers_dev": false,

  // 配置路由规则
  "routes": [
    {
      "pattern": "img.example.com/*",
      "zone_name": "example.com"
    }
  ],

  // ... 其他配置
}
```

**参数说明**：
- `pattern`: 匹配的 URL 模式（使用 `/*` 匹配所有路径）
- `zone_name`: 域名的根域名（必须是 Cloudflare 管理的域名）

### 步骤 2：部署

```bash
bun run deploy
```

### 步骤 3：配置 DNS（自动）

Wrangler 会自动创建必要的 DNS 记录。如果没有，手动创建：

1. 进入 Cloudflare Dashboard → 选择域名
2. 点击 **DNS** → **Records**
3. 添加记录：
   - **Type**: `AAAA`
   - **Name**: `img`（子域名部分）
   - **IPv6 address**: `100::`
   - **Proxy status**: ✅ Proxied（橙色云朵）

或使用 CNAME 记录：
   - **Type**: `CNAME`
   - **Name**: `img`
   - **Target**: `cf-image-cloud.your-subdomain.workers.dev`
   - **Proxy status**: ✅ Proxied

### 步骤 4：测试访问

```
https://img.example.com
```

---

## 多域名配置

如果需要同时支持多个域名：

### Dashboard 方式

在 **Domains & Routes** 中分别添加多个域名：
- `img.example.com`
- `cdn.example.com`
- `i.example.com`

### 配置文件方式

```jsonc
{
  "routes": [
    {
      "pattern": "img.example.com/*",
      "zone_name": "example.com"
    },
    {
      "pattern": "cdn.example.com/*",
      "zone_name": "example.com"
    },
    {
      "pattern": "i.anotherdomain.com/*",
      "zone_name": "anotherdomain.com"
    }
  ]
}
```

---

## 更新 Snippet 配置

配置自定义域名后，需要更新 Cloudflare Snippet 的 `allowedDomains`：

编辑 `cloudflare-snippet.js`：

```javascript
const allowedDomains = [
  'img.example.com',        // 你的自定义域名
  'example.com',            // 如果使用根域名
  'localhost:8787',         // 本地开发
  'localhost',
];
```

然后在 Cloudflare Dashboard 中更新 Snippet。

---

## SSL/TLS 设置

Cloudflare 自动为自定义域名提供 SSL/TLS 证书。

### 检查 SSL 状态

1. Dashboard → 选择域名 → **SSL/TLS**
2. 确认加密模式为 **Full** 或 **Full (strict)**
3. 查看 **Edge Certificates** 确认证书已颁发

### HTTPS 重定向

建议启用自动 HTTPS 重定向：

1. Dashboard → 选择域名 → **SSL/TLS**
2. 点击 **Edge Certificates**
3. 启用 **Always Use HTTPS**

---

## 故障排查

### 问题 1：域名无法访问

**检查清单**：
- ✅ 域名已托管在 Cloudflare
- ✅ DNS 记录已创建
- ✅ Proxy 状态为橙色云朵（Proxied）
- ✅ Worker 已部署成功
- ✅ 路由规则正确配置

**解决方法**：
```bash
# 检查 DNS 解析
nslookup img.example.com

# 查看 Worker 日志
wrangler tail
```

### 问题 2：SSL 证书错误

**原因**：证书还在颁发中

**解决方法**：
- 等待 5-10 分钟
- 在 Dashboard → SSL/TLS → Edge Certificates 查看状态
- 如果超过 1 小时仍未生效，联系 Cloudflare 支持

### 问题 3：workers.dev 仍然可访问

**原因**：`workers_dev` 设置为 `true`

**解决方法**：
在 `wrangler.jsonc` 中设置：
```jsonc
{
  "workers_dev": false
}
```

然后重新部署：
```bash
bun run deploy
```

### 问题 4：Snippet 阻止了访问

**原因**：`allowedDomains` 没有包含新域名

**解决方法**：
更新 Snippet 代码中的 `allowedDomains` 数组，添加新域名。

---

## 域名建议

### 子域名命名建议

- `img.example.com` - 简洁明了
- `i.example.com` - 更短
- `cdn.example.com` - CDN 风格
- `pic.example.com` - 图片专用
- `images.example.com` - 完整词汇

### 不推荐使用根域名

除非专门用于图床，否则不建议使用 `example.com`：
- 占用根域名资源
- 无法用于其他服务
- SEO 可能受影响

---

## 成本说明

使用自定义域名**完全免费**：
- ✅ DNS 查询：免费
- ✅ SSL/TLS 证书：免费
- ✅ CDN 流量：免费
- ✅ Worker 请求：在免费额度内

---

## 下一步

配置好自定义域名后：

1. ✅ 更新 Snippet 的 `allowedDomains`
2. ✅ 测试上传和访问功能
3. ✅ 更新你的个人网站/博客中的图片链接
4. ✅ 享受专业的自定义域名图床服务！

---

## 参考文档

- [Cloudflare Workers Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [Cloudflare DNS Records](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/)
- [Cloudflare SSL/TLS](https://developers.cloudflare.com/ssl/)

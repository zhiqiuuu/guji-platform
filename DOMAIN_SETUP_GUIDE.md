# 将阿里云域名绑定到 Vercel 项目指南

## 概述
本指南将帮助您将阿里云域名 `keyiproject.top` 绑定到 Vercel 上部署的古籍典藏平台。

## 前提条件
- ✅ 已有 Vercel 账号并部署了项目
- ✅ 拥有阿里云域名 `keyiproject.top`
- ✅ 能够访问阿里云域名管理控制台

## 步骤一: 在 Vercel 添加自定义域名

### 1.1 登录 Vercel
访问 https://vercel.com 并登录您的账号

### 1.2 进入项目设置
1. 在 Dashboard 中找到您的 `guji-platform` 项目
2. 点击项目名称进入项目详情页
3. 点击顶部导航栏的 **Settings** (设置)
4. 在左侧菜单中选择 **Domains** (域名)

### 1.3 添加域名
1. 在 "Add Domain" 输入框中输入您的域名:
   ```
   keyiproject.top
   ```
2. 点击 **Add** 按钮

3. Vercel 会提示您需要配置 DNS 记录,记下以下信息:
   - **Type**: A 记录
   - **Name**: @ (或留空)
   - **Value**: `76.76.21.21` (Vercel 的 IP 地址)

### 1.4 (可选) 添加 www 子域名
如果您也想支持 `www.keyiproject.top`:
1. 再次点击 "Add Domain"
2. 输入: `www.keyiproject.top`
3. 点击 **Add**

Vercel 通常会自动配置 www 重定向到主域名。

## 步骤二: 在阿里云配置 DNS 解析

### 2.1 登录阿里云
1. 访问 https://dns.console.aliyun.com
2. 登录您的阿里云账号

### 2.2 进入域名解析设置
1. 在域名列表中找到 `keyiproject.top`
2. 点击右侧的 **解析设置** 按钮

### 2.3 添加 A 记录 (主域名)
1. 点击 **添加记录** 按钮
2. 填写以下信息:
   ```
   记录类型: A
   主机记录: @
   解析线路: 默认
   记录值: 76.76.21.21
   TTL: 10分钟 (600)
   ```
3. 点击 **确认** 保存

### 2.4 添加 CNAME 记录 (www 子域名)
1. 再次点击 **添加记录** 按钮
2. 填写以下信息:
   ```
   记录类型: CNAME
   主机记录: www
   解析线路: 默认
   记录值: cname.vercel-dns.com
   TTL: 10分钟 (600)
   ```
3. 点击 **确认** 保存

## 步骤三: 验证域名配置

### 3.1 等待 DNS 传播
DNS 解析生效通常需要几分钟到 48 小时,但阿里云通常在 10-30 分钟内生效。

### 3.2 在 Vercel 检查状态
1. 返回 Vercel 项目的 **Domains** 页面
2. 您应该看到域名旁边有一个刷新图标
3. 等待状态变为 **Valid** (有效)
4. Vercel 会自动为您的域名配置 HTTPS 证书 (Let's Encrypt)

### 3.3 测试访问
在浏览器中访问:
- https://keyiproject.top
- https://www.keyiproject.top

如果配置成功,您应该能看到古籍典藏平台的页面。

## 常见问题

### Q1: DNS 解析一直不生效怎么办?
**解决方案:**
1. 检查 DNS 记录是否正确配置
2. 使用在线工具检查 DNS 传播状态:
   - https://dnschecker.org
   - 输入 `keyiproject.top` 查看全球解析情况
3. 清除本地 DNS 缓存:
   ```bash
   # Windows
   ipconfig /flushdns

   # Mac
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

   # Linux
   sudo systemd-resolve --flush-caches
   ```

### Q2: Vercel 显示 "Invalid Configuration"
**解决方案:**
1. 确认阿里云的 A 记录值为 `76.76.21.21`
2. 确认 CNAME 记录值为 `cname.vercel-dns.com`
3. 等待 10-30 分钟让 DNS 传播
4. 在 Vercel 点击域名右侧的 **Refresh** 按钮

### Q3: HTTPS 证书配置失败
**解决方案:**
1. 确保 DNS 解析已生效
2. Vercel 需要验证域名所有权才能颁发 SSL 证书
3. 通常在 DNS 生效后 5-15 分钟内自动完成
4. 如果长时间未生效,尝试删除域名重新添加

### Q4: 想要配置多个子域名
**例如:** `admin.keyiproject.top`, `api.keyiproject.top`

**解决方案:**
1. 在 Vercel 的 Domains 页面添加每个子域名
2. 在阿里云添加对应的 CNAME 记录:
   ```
   # admin 子域名
   记录类型: CNAME
   主机记录: admin
   记录值: cname.vercel-dns.com

   # api 子域名
   记录类型: CNAME
   主机记录: api
   记录值: cname.vercel-dns.com
   ```

## 高级配置 (可选)

### 配置域名重定向
如果您想将所有访问重定向到主域名 (例如 www -> 主域名):

在项目根目录创建或编辑 `vercel.json`:
```json
{
  "redirects": [
    {
      "source": "/:path*",
      "has": [
        {
          "type": "host",
          "value": "www.keyiproject.top"
        }
      ],
      "destination": "https://keyiproject.top/:path*",
      "permanent": true
    }
  ]
}
```

### 配置自定义头部
在 `vercel.json` 中添加安全头部:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

## 完整的 DNS 配置总结

| 记录类型 | 主机记录 | 记录值 | TTL | 说明 |
|---------|---------|--------|-----|------|
| A | @ | 76.76.21.21 | 600 | 主域名解析 |
| CNAME | www | cname.vercel-dns.com | 600 | www 子域名 |

## 验证工具

### 命令行验证
```bash
# 检查 A 记录
nslookup keyiproject.top

# 检查 CNAME 记录
nslookup www.keyiproject.top

# 或使用 dig (Mac/Linux)
dig keyiproject.top
dig www.keyiproject.top
```

### 在线验证工具
- DNS 传播检查: https://dnschecker.org
- SSL 证书检查: https://www.ssllabs.com/ssltest/
- Vercel 域名检查: 直接在 Vercel Dashboard 查看

## 预计时间线

| 步骤 | 预计时间 |
|------|---------|
| 在 Vercel 添加域名 | 1-2 分钟 |
| 在阿里云配置 DNS | 2-3 分钟 |
| DNS 传播生效 | 10-30 分钟 |
| SSL 证书自动配置 | 5-15 分钟 |
| **总计** | **约 20-50 分钟** |

## 完成后的检查清单

- [ ] 在 Vercel Domains 页面看到域名状态为 "Valid"
- [ ] 能够通过 https://keyiproject.top 访问网站
- [ ] 能够通过 https://www.keyiproject.top 访问网站
- [ ] 浏览器地址栏显示安全锁图标 (HTTPS)
- [ ] 使用 https://www.ssllabs.com/ssltest/ 检查 SSL 配置得分 A 或 A+

## 需要帮助?

如果遇到问题:
1. 检查 Vercel Dashboard 的域名状态和错误提示
2. 使用 `dnschecker.org` 验证 DNS 是否全球生效
3. 查看 Vercel 的官方文档: https://vercel.com/docs/custom-domains
4. 联系 Vercel 支持: https://vercel.com/support

---

配置完成后,您的古籍典藏平台将可以通过自定义域名访问,并且自动配置了 HTTPS 加密! 🎉

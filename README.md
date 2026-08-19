# HOD 算力彩 · 算力竞猜平台

基于 SHA-256 哈希承诺的 6 位数字算力竞猜平台。用户投入 HOD 算力参与竞猜，系统保证开奖公平可验证。

## ✨ 特性

- 🔐 **SHA-256 哈希承诺** — 期次创建时公示哈希，开奖后公开原文，任何人都可验证，数学保证公平
- 🎯 **7 级奖池** — 一等奖 30%（无人中滚存）+ 保底奖（所有未中奖投注瓜分，绝不空手）
- ⚡ **三档倍投** — 1x / 10x / 100x，投入越高奖金同步放大
- 📊 **运营看板** — 转化率、留存、奖池健康度、用户分层、期次趋势
- 🏆 **排行榜** — 总榜/月榜/周榜，多维度排序
- 📧 **真实邮件** — SMTP 发送验证码，支持手机/邮箱绑定
- 🎫 **兑换码** — 防并发的一次性兑换码系统
- 🌗 **明暗主题** — CSS 变量双主题，localStorage 持久化

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router + Turbopack) |
| 语言 | TypeScript 5 |
| 数据库 | SQLite (better-sqlite3) — 可平滑切换 PostgreSQL |
| ORM | Prisma 7 |
| 样式 | TailwindCSS v4 |
| 认证 | JWT (jose) + bcryptjs |
| 邮件 | Nodemailer |

## 🚀 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，填入 AUTH_SECRET（32 字节随机 hex）

# 3. 初始化数据库
npx prisma migrate dev
npm run db:seed

# 4. 启动开发服务
npm run dev
# → http://localhost:3100
```

### 默认账户

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | Admin123456! |

演示用户 demo01/demo02 仅在**非生产环境**（NODE_ENV ≠ production）创建。

## 📁 项目结构

```
src/
├── app/                    # App Router 页面
│   ├── admin/              # 管理后台（期次/用户/兑换码/看板）
│   ├── api/                # 48 条 API 路由
│   ├── leaderboard/        # 排行榜
│   ├── login/              # 登录/注册/找回密码
│   ├── me/                 # 个人中心
│   ├── rounds/             # 开奖公示+期次详情
│   ├── rules/              # 玩法规则
│   └── agreement/          # 用户协议
├── components/             # 28 个 UI 组件
├── lib/                    # 核心库
│   ├── engine.ts           # 结算引擎
│   ├── lottery.ts          # 开奖码生成+匹配
│   ├── auth.ts             # JWT 会话
│   ├── codeService.ts      # 验证码服务
│   └── rateLimit.ts        # IP 速率限制
└── instrumentation.ts      # SQLite WAL + 调度器
```

## 📡 API 概览

| 模块 | 端点示例 |
|------|---------|
| 认证 | `/api/auth/login` `/register` `/reset` |
| 投注 | `/api/bets` |
| 期次 | `/api/rounds` `/[id]` `/[id]/winners` |
| 用户 | `/api/me` `/me/bets` `/me/txs` `/me/username` |
| 管理 | `/api/admin/rounds` `/admin/users` `/admin/dashboard` |
| 排行榜 | `/api/leaderboard?period=all&sort=profit` |
| 健康检查 | `/api/health` |

完整文档见 [`docs/开发流程文档.md`](docs/开发流程文档.md)

## 🔒 安全

- 开奖码不入库（AUTH_SECRET + 盐值派生，DB 泄露也看不到）
- 验证码 5 次失败自动作废
- 登录/注册/重置码 IP 速率限制
- 账户枚举防护（恒定时间比对）
- CSP / X-Frame-Options / nosniff 安全响应头
- 投注防 TOCTOU 竞态（事务内复查）

## 📄 协议

- [用户服务协议](/agreement)
- [玩法规则](/rules)

## 📋 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务 |
| `npm run build` | 生产构建 |
| `npm start` | 启动生产 |
| `npm run typecheck` | 类型检查 |
| `npm run lint` | 代码检查 |
| `npm run db:migrate` | 数据库迁移 |
| `npm run db:seed` | 种子数据 |
| `npm run db:studio` | 可视化管理 |

## ⚠️ 生产部署

1. 将 `.env` 中的 `AUTH_SECRET` 替换为真实随机 32 字节 hex
2. 配置 SMTP 邮件服务
3. 将 `NODE_ENV` 设为 `production`（禁用演示用户种子）
4. 建议将 SQLite 切换为 PostgreSQL（仅需改 `DATABASE_URL` 和 provider）

## 📄 许可

MIT License
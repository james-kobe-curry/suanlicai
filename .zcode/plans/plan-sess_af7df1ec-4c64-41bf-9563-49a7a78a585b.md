## 实施计划

### 一、排行榜 `/leaderboard`

**新建文件**:
1. `src/app/leaderboard/page.tsx` — 服务端页面，初始数据 SSR
2. `src/components/LeaderboardTable.tsx` — 客户端组件，Tab切换+排序+分页
3. `src/app/api/leaderboard/route.ts` — API（period=all|month|week, sort, page）

**修改文件**:
4. `src/components/Nav.tsx` — 导航栏新增「排行榜」链接（放在玩法规则之后）

**功能**:
- 三个 Tab：总榜 / 月榜 / 周榜
- 7 列：排名、用户名、总投入、总中奖、净收益(+绿/-红)、中奖次数、胜率
- 默认按净收益 DESC 排序，点击表头可切换
- 每页 50 人，底部分页导航
- 顶部 3 张统计卡：🏆 榜首净收益 / 📊 参与人数 / 💰 总派奖

---

### 二、运营看板 `/admin/dashboard`

**新建文件**:
5. `src/app/admin/dashboard/page.tsx` — 服务端页面，全量数据 SSR
6. `src/components/DashboardCards.tsx` — 指标卡片行
7. `src/components/PrizePoolHealth.tsx` — 奖池健康度仪表（CSS 进度条）
8. `src/components/RoundTrendTable.tsx` — 期次趋势表（CSS 迷你柱）
9. `src/components/UserTierRing.tsx` — 用户分层环形图（CSS conic-gradient）
10. `src/components/TxTypeBar.tsx` — TX 类型分布堆叠条

**修改文件**:
11. `src/components/AdminNav.tsx` — 侧边栏新增「运营看板」项

**布局**（从上到下）:
```
┌─────────────────────────────────────────────┐
│  指标卡片 ×6                                 │
│  转化率 | 复投率 | 健康度 | 留存 | 销售额 | 活跃  │
├──────────────────┬──────────────────────────┤
│  奖池健康度仪表    │  用户分层环形图            │
│  (CSS 进度条)     │  (CSS conic-gradient)    │
├──────────────────┴──────────────────────────┤
│  TX 类型分布堆叠条                            │
├─────────────────────────────────────────────┤
│  最近 20 期趋势表（CSS 迷你柱状条）              │
└─────────────────────────────────────────────┘
```

**核心指标**:
- 投注转化率 = 投注用户 / 总注册用户
- 重复投注率 = 投注≥2次用户 / 投注用户
- 奖池健康度 = 实际派奖 / (销售额 × 返奖率)，健康区间 95%-105%
- 平台留存 = 累计 platformProfit
- 累计销售额、活跃用户（近7天有投注）

所有 CSS 可视化使用现有设计 token（`--t-brand`、`--t-ok`、`--t-warn`、`--t-err`），与现有 UI 风格统一。
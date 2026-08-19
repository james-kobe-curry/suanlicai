import { PRIZE_LEVELS, TIERS, MAX_COMBOS, MAX_RANDOM } from '@/lib/constants';

export default function RulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow text-brand">Game Rules</p>
        <h1 className="mt-1 text-2xl font-semibold text-fg">玩法规则</h1>
        <p className="mt-1 text-sm text-fg2">了解竞猜码、奖级与开奖公平性机制</p>
      </div>

      <section className="card p-7">
        <h2 className="section-title">一、基本玩法</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-fg2">
          <li>每期开奖一个 6 位数字竞猜码（000000 - 999999），竞猜码数字与位置均相同即中奖。</li>
          <li>每注基础价 1 HOD 算力，支持三种选号方式：单式选号、复式投注、机选。</li>
          <li>复式投注：每位可选多个数字，自动展开为所有组合，最多 {MAX_COMBOS} 注。</li>
          <li>机选：随机生成 {MAX_RANDOM} 注以内竞猜码。</li>
          <li>活动期次由管理员发布，用户选择其中进行中的一期参与投注。</li>
          <li>
            为保障账户与资产安全，参与投注、绑定平台账户、领取算力等操作前需先完成手机号或邮箱绑定验证；
            未绑定的用户仅可浏览，无法实际参与。
          </li>
        </ul>
      </section>

      <section className="card p-7">
        <h2 className="section-title">二、投入档位（倍投）</h2>
        <p className="mt-3 text-sm text-fg2">
          投入越大，中奖奖金同步放大：每注价格 = 基础价 × 档位，奖金按投入占比分配。
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {TIERS.map((t) => (
            <span key={t.value} className="rounded-lg border border-line bg-raise px-4 py-2.5 text-sm">
              <span className="font-semibold text-brand">{t.value}x</span>{' '}
              <span className="text-fg2">{t.label}</span>
            </span>
          ))}
        </div>
      </section>

      <section className="card p-7">
        <h2 className="section-title">三、奖级设置</h2>
        <p className="mt-3 text-sm text-fg2">
          每期奖池 = 本期销售总额 × 返奖率（默认 80%）。奖池按以下占比分配至各级，同级多人中奖按投入占比均分。
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="tbl min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line">
                <th>奖级</th>
                <th>中奖条件</th>
                <th>奖池占比</th>
              </tr>
            </thead>
            <tbody>
              {PRIZE_LEVELS.map((L) => (
                <tr key={L.level}>
                  <td className="font-medium text-brand">{L.name}</td>
                  <td className="text-fg">{L.desc}</td>
                  <td className="mono-num text-fg">{L.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-fg2">
          一等奖无人中时，其奖池全额滚存至下一期一等奖，形成滚存大奖。
        </p>
      </section>

      <section className="card p-7">
        <h2 className="section-title">四、开奖公平性 —— SHA-256 哈希承诺机制</h2>
        <p className="mt-3 text-sm text-fg2">
          每次开奖的公平性由数学保证，无需信任平台。核心原理是密码学中的「承诺-揭示」方案。
        </p>

        {/* 通俗比喻 */}
        <div className="mt-5 rounded-xl border border-brand/20 bg-brandsoft px-5 py-4">
          <p className="text-sm font-medium text-brand">
            💡 通俗理解：开奖码就像一个封好的信封。期次发布时，信封已经封好并公开展示（哈希值），谁也无法偷看。
            开奖时间一到，系统当众拆开信封（公布原文+盐），任何人都可以当场比对，验证信封从未被调包。
          </p>
        </div>

        {/* 三步流程 */}
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          <div className="flex flex-col items-center text-center">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-base font-bold text-brandfg shadow-sm">
              1
            </span>
            <p className="mt-3 text-sm font-semibold text-fg">先锁（Commit）</p>
            <p className="mt-1.5 text-xs leading-relaxed text-fg2">
              管理员发布期次时，系统用<strong className="font-medium text-fg">密码学安全随机数</strong>生成 6 位开奖码，
              同时生成一段<strong className="font-medium text-fg">随机盐（Salt）</strong>。
              立即计算 <code className="rounded bg-raise px-1 font-mono text-[11px] text-brand">SHA-256(开奖码 | 盐)</code>，
              将得到的<strong className="font-medium text-fg">哈希值（承诺指纹）</strong>公示在期次页面上。
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-base font-bold text-brandfg shadow-sm">
              2
            </span>
            <p className="mt-3 text-sm font-semibold text-fg">后开（Reveal）</p>
            <p className="mt-1.5 text-xs leading-relaxed text-fg2">
              开奖时间到达后（或管理员手动触发），系统<strong className="font-medium text-fg">公开开奖码原文与随机盐</strong>。
              此时中奖结果已确定，所有人都能看到完整的开奖信息，公开透明。
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-base font-bold text-brandfg shadow-sm">
              3
            </span>
            <p className="mt-3 text-sm font-semibold text-fg">可验（Verify）</p>
            <p className="mt-1.5 text-xs leading-relaxed text-fg2">
              任何人都可以<strong className="font-medium text-fg">自己动手验证</strong>：在期次详情页输入任意数字，
              系统实时计算 SHA-256，与开奖前公示的承诺哈希比对。<strong className="font-medium text-brand">对上了就是真的，对不上就是被换过。</strong>
            </p>
          </div>
        </div>

        {/* 技术细节 */}
        <div className="mt-6 space-y-3 border-t border-line pt-5">
          <h3 className="text-sm font-semibold text-fg">为什么这个方案无法作弊？</h3>
          <div className="space-y-2.5 text-xs leading-relaxed text-fg2">
            <p>
              <strong className="font-medium text-fg">① SHA-256 的单向性：</strong>
              从哈希值反推开奖码在数学上<strong className="font-medium text-fg">不可行</strong>。
              哪怕只差一个数字，哈希值会完全不同（雪崩效应）。开奖前任何人都无法从未知的开奖码推出哈希值，也无法从哈希值反推回开奖码。
            </p>
            <p>
              <strong className="font-medium text-fg">② 随机盐的作用：</strong>
              如果没有盐，有人可以提前把所有 100 万种可能的 6 位数字（000000-999999）的哈希值全部算出来（彩虹表），
              然后对着公示哈希查表反推。加入<strong className="font-medium text-fg">足够长的随机盐</strong>后，
              可能的组合变成天文数字，破解成本极高，彩虹表彻底失效。
            </p>
            <p>
              <strong className="font-medium text-fg">③ 哈希一旦公示就无法修改：</strong>
              承诺哈希在开奖前已经公开展示。如果平台在开奖时换了开奖码，
              公布的数字+盐算出来的哈希就会和之前公示的哈希<strong className="font-medium text-err">不一致</strong>，
              任何人都能当场发现作弊。
            </p>
            <p>
              <strong className="font-medium text-fg">④ 验证随时可做：</strong>
              不需要信任平台代码。你可以把公示的哈希值、开奖码、盐拿到<strong className="font-medium text-fg">任何 SHA-256 工具</strong>上自己算，
              结果一致就说明开奖码在发布那一刻就已经确定了，从未被篡改。
            </p>
          </div>
        </div>

        {/* 实例演示 */}
        <div className="mt-5 rounded-lg bg-raise p-4">
          <p className="text-xs font-medium text-fg">📐 实例演示</p>
          <div className="mt-2 space-y-1 font-mono text-xs text-fg2">
            <p>开奖码 = <span className="text-brand">382951</span></p>
            <p>随机盐 = <span className="text-brand">a7f3b2c9d1e4</span></p>
            <p>
              承诺哈希 = SHA-256(<span className="text-brand">382951|a7f3b2c9d1e4</span>)
            </p>
            <p className="text-fg3 break-all">
              → e9a8b7c6d5f4e3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0
            </p>
            <p className="mt-2 text-fg3">
              ✓ 开奖前只公示哈希，号码保密。开奖后公布原文，任何人可验。
            </p>
          </div>
        </div>

        <p className="mt-5 text-sm text-fg2">
          开奖由系统定时任务自动执行（也可由管理员手动触发），结算全程数据库事务保证账目一致。
          后续版本将接入区块链 VRF 随机源，进一步提升开奖的可信度。
        </p>
      </section>

      <section className="card p-7">
        <h2 className="section-title">五、合规与理性提示</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-fg2">
          <li>本产品定位为「有奖竞猜游戏」，上线前需完成当地法务合规评估。</li>
          <li>账户密码需满足强度要求（8-64 位，含大写/小写/数字/特殊符号中至少 3 类），请妥善保管。</li>
          <li>禁止未成年人参与；请理性投入，量力而行。</li>
        </ul>
      </section>
    </div>
  );
}

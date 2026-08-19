// HOD 算力彩 · 全局常量与玩法配置

/** 1 HOD = 1_000_000 μHOD（金额最小单位，整数存储避免浮点误差） */
export const MICRO = 1_000_000n;

export const SITE_NAME = 'HOD 算力彩';
export const TOKEN_NAME = 'HOD';

export const CODE_LEN = 6;

/** 投入档位（倍投）：每注价格 = 期次基础价 × 档位，奖金同步放大 */
export const TIERS = [
  { value: 1, label: '1x 基础档' },
  { value: 10, label: '10x 进阶档' },
  { value: 100, label: '100x 豪华档' },
] as const;

/** 奖级表：pct 为该级占返奖奖池的百分比，合计 100 */
export const PRIZE_LEVELS = [
  { level: 1, name: '一等奖', pct: 30, desc: '6 位全部命中（大奖，无人中则滚存至下期）' },
  { level: 2, name: '二等奖', pct: 15, desc: '前 5 位或后 5 位连续命中' },
  { level: 3, name: '三等奖', pct: 10, desc: '前 4 位或后 4 位连续命中' },
  { level: 4, name: '四等奖', pct: 18, desc: '任意 3 位位置命中' },
  { level: 5, name: '五等奖', pct: 12, desc: '任意 2 位位置命中' },
  { level: 6, name: '幸运奖', pct: 10, desc: '任意 1 位位置命中' },
  { level: 7, name: '保底奖', pct: 5, desc: '未中奖的每注均可参与瓜分（绝不空手）' },
] as const;

/** 复式投注最大展开注数 */
export const MAX_COMBOS = 500;
/** 机选最大注数 */
export const MAX_RANDOM = 10;

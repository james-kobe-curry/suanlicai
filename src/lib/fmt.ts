import { MICRO } from './constants';

/**
 * 格式化普通数字（非 micro-HOD），
 * - ≥ 1亿 显示为 X.XXX亿
 * - ≥ 1万 显示为 X.XXX万
 * - 否则千位分隔，小数最多 3 位（截断不四舍五入）
 */
export function fmtNum(n: number): string {
  const neg = n < 0;
  const abs = neg ? -n : n;

  if (abs >= 100_000_000) {
    const v = abs / 100_000_000;
    return `${neg ? '-' : ''}${trunc3(v)}亿`;
  }
  if (abs >= 10_000) {
    const v = abs / 10_000;
    return `${neg ? '-' : ''}${trunc3(v)}万`;
  }

  // < 1万：千位分隔 + 最多 3 位小数
  const intPart = Math.floor(abs);
  const frac = abs - intPart;
  const intStr = intPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const fracStr = frac > 0 ? '.' + Math.floor(frac * 1000).toString().padEnd(3, '0').replace(/0+$/, '') : '';
  return `${neg ? '-' : ''}${intStr}${fracStr}`;
}

/** 截断到 3 位小数，去掉尾部多余的 0 */
function trunc3(v: number): string {
  const s = (Math.floor(v * 1000) / 1000).toFixed(3);
  // 去掉末尾多余的 0 和小数点
  return s.replace(/\.?0+$/, '');
}

/**
 * 将 μHOD（bigint 或 number）格式化为 HOD 字符串。
 * 内部转换为 HOD 后委托 fmtNum 处理单位与精度。
 */
export function fmtHOD(micro: bigint | number): string {
  const v = BigInt(typeof micro === 'number' ? Math.round(micro) : micro);
  const neg = v < 0n;
  const abs = neg ? -v : v;
  const intPart = abs / MICRO;
  const frac = abs % MICRO;

  // 转为 number（HOD），最多 6 位小数精度，再截断到 3 位
  const hod = Number(intPart) + Number(frac) / Number(MICRO);
  return fmtNum(hod);
}

/** 时间格式化（统一本地时区，前后端一致） */
export function fmtDateTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 手机号脱敏：138****1234 */
export function maskPhone(phone: string): string {
  if (phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
}

/** 邮箱脱敏：a***@example.com */
export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return email;
  return `${email[0]}***${email.slice(at)}`;
}
import { createHash, randomBytes, randomInt } from 'crypto';
import { CODE_LEN } from './constants';

/** 生成 6 位竞猜码（前导零保留）——仅用于创建期次时一次性生成 */
export function randomCode(): string {
  let s = '';
  for (let i = 0; i < CODE_LEN; i++) s += randomInt(0, 10);
  return s;
}

/** 从盐值 + 服务器密钥派生开奖码。同一盐值永远得到相同结果，DB 不存码 */
export function deriveCode(salt: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('[lottery] AUTH_SECRET 未设置，无法派生开奖码');
  const buf = createHash('sha256').update(`${salt}|${secret}`).digest();
  let s = '';
  for (let i = 0; i < CODE_LEN; i++) s += String((buf[i] ?? 0) % 10);
  return s;
}

/** 生成随机盐（16 字节 hex） */
export function newSalt(): string {
  return randomBytes(16).toString('hex');
}

/** 承诺哈希：sha256(code|salt)，期次创建即公示，开奖后可用原文校验 */
export function commitHash(code: string, salt: string): string {
  return createHash('sha256').update(`${code}|${salt}`).digest('hex');
}

/** 校验承诺：sha256(code|salt) === hash */
export function verifyHash(code: string, salt: string, hash: string): boolean {
  return commitHash(code, salt) === hash;
}

/** 复式展开：positions 为 6 位各自的可选数字集合，返回笛卡尔积码列表 */
export function expandCombos(positions: string[][]): string[] {
  let acc: string[] = [''];
  for (const digits of positions) {
    const next: string[] = [];
    for (const prefix of acc) {
      for (const d of digits) next.push(prefix + d);
    }
    acc = next;
  }
  return acc;
}

/** 奖级匹配：返回最高中奖等级（1-6），未中奖返回 null */
export function matchLevel(code: string, win: string): number | null {
  let cnt = 0;
  for (let i = 0; i < CODE_LEN; i++) {
    if (code[i] === win[i]) cnt++;
  }
  if (cnt === CODE_LEN) return 1;
  if (code.slice(0, 5) === win.slice(0, 5) || code.slice(1) === win.slice(1)) return 2;
  if (code.slice(0, 4) === win.slice(0, 4) || code.slice(2) === win.slice(2)) return 3;
  if (cnt >= 3) return 4;
  if (cnt >= 2) return 5;
  if (cnt >= 1) return 6;
  return null;
}

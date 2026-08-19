import { randomInt } from 'crypto';

/**
 * 兑换码工具：格式 HOD-XXXX-XXXX-XXXX
 * 字符集排除易混淆的 0/O/1/I，共 32 个字符
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const REDEEM_CODE_RE = /^HOD-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

export function normalizeRedeemCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '');
}

export function genRedeemCode(): string {
  const seg = () =>
    Array.from({ length: 4 }, () => ALPHABET[randomInt(0, ALPHABET.length)]).join('');
  return `HOD-${seg()}-${seg()}-${seg()}`;
}

/** 生成不重复的兑换码（碰撞时重试） */
export async function genUniqueRedeemCode(exists: (code: string) => Promise<boolean>): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = genRedeemCode();
    if (!(await exists(code))) return code;
  }
  throw new Error('兑换码生成失败，请重试');
}

/** 规范化后的码是否合法 */
export function isValidRedeemCode(code: string): boolean {
  return REDEEM_CODE_RE.test(code);
}

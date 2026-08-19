import { randomInt } from 'crypto';
import { prisma } from './prisma';
import { sendVerificationEmail, isEmailConfigured } from './email';

/**
 * 验证码服务（绑定手机/邮箱 与 找回密码 共用）
 *
 * 发送策略：
 * - EMAIL 且已配置 SMTP → 真实邮件发送（响应不回传验证码）
 * - 其他情况 → 演示模式（验证码随响应返回，控制台日志模拟发送）
 *
 * ⚠ 二期接入短信服务商时：在 issueCode 中为 PHONE 增加真实下发即可，
 *   签发、存储、校验、一次性消费逻辑无需改动。
 */

export const CODE_TTL_MS = 5 * 60 * 1000;
export const CODE_TTL_SEC = CODE_TTL_MS / 1000;

const RESEND_COOLDOWN_MS = 60 * 1000; // 同一目标 60 秒重发冷却
const DAILY_SEND_LIMIT = 20; // 单用户每日发送上限

export type CodeType = 'PHONE' | 'EMAIL';
export type CodeScene = 'BIND' | 'RESET';

export interface IssueResult {
  code: string;
  sentReal: boolean; // true = 已通过真实渠道发送
}

/** 签发一次性验证码（5 分钟有效）并发送 */
export async function issueCode(
  userId: string,
  type: CodeType,
  target: string,
  scene: CodeScene
): Promise<IssueResult> {
  // 重发冷却
  const recent = await prisma.verifyCode.findFirst({
    where: {
      userId,
      type,
      target,
      createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (recent) throw new Error('发送过于频繁，请 60 秒后再试');

  // 每日上限
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const todayCount = await prisma.verifyCode.count({
    where: { userId, createdAt: { gte: dayStart } },
  });
  if (todayCount >= DAILY_SEND_LIMIT) {
    throw new Error('今日验证码发送次数已达上限，请明天再试');
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await prisma.verifyCode.create({
    data: {
      userId,
      type,
      target,
      scene,
      code,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  });

  // 发送
  let sentReal = false;
  if (type === 'EMAIL' && isEmailConfigured()) {
    try {
      await sendVerificationEmail(target, code, scene);
      sentReal = true;
    } catch (e) {
      // 发送失败回退演示模式，避免阻塞用户流程
      console.error('[email] 邮件发送失败，回退为演示模式:', e);
    }
  }
  if (!sentReal) {
    // 演示模式：仅日志记录（生产环境需移除）
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[demo] 验证码 ${code} → ${type} ${target} (${scene})`);
    }
  }
  return { code, sentReal };
}

const MAX_ATTEMPTS = 5;

/** 校验并消费验证码（一次性），正确返回 true。失败时递增尝试次数，超过上限自动作废 */
export async function verifyAndConsumeCode(
  userId: string,
  target: string,
  scene: CodeScene,
  code: string
): Promise<boolean> {
  const record = await prisma.verifyCode.findFirst({
    where: {
      userId,
      target,
      scene,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) return false;
  if (record.attempts >= MAX_ATTEMPTS) {
    // 超过尝试上限，自动作废
    await prisma.verifyCode.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    return false;
  }
  if (record.code !== code) {
    await prisma.verifyCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return false;
  }
  await prisma.verifyCode.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  return true;
}

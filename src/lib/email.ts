import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * 邮箱服务（标准 SMTP，兼容 QQ邮箱 / 163 / 阿里云 / 企业邮箱 / SendGrid 等）
 *
 * 配置（.env）：
 *   SMTP_HOST      SMTP 服务器地址，如 smtp.qq.com
 *   SMTP_PORT      端口（SSL 一般 465，STARTTLS 一般 587）
 *   SMTP_SECURE    是否 SSL（true / false）
 *   SMTP_USER      登录账号（通常是邮箱地址）
 *   SMTP_PASS      密码 / SMTP 授权码
 *   EMAIL_FROM     发件人地址（默认取 SMTP_USER）
 *   EMAIL_FROM_NAME 发件人显示名（默认「HOD 算力乐」）
 *
 * 未配置 SMTP 时 isEmailConfigured() 返回 false，codeService 自动回退演示模式。
 */

let transporter: Transporter | null = null;

export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: (process.env.SMTP_SECURE ?? 'true') === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

const SCENE_TEXT = {
  BIND: '绑定邮箱',
  RESET: '找回密码',
} as const;

export type EmailScene = keyof typeof SCENE_TEXT;

/** 品牌化验证码邮件模板（可单独测试渲染） */
export function buildVerificationEmail(
  code: string,
  scene: EmailScene
): { subject: string; html: string } {
  const subject = `【HOD 算力乐】${SCENE_TEXT[scene]}验证码：${code}`;
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<body style="margin:0;padding:32px 16px;background:#f3f5f7;font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e3e8ed;border-radius:14px;overflow:hidden;">
    <div style="background:#10161d;padding:18px 28px;">
      <span style="color:#4d9cb8;font-weight:700;font-size:13px;letter-spacing:3px;">HOD POWER LOTTERY</span>
      <span style="float:right;color:#66727e;font-size:12px;">HOD 算力乐</span>
    </div>
    <div style="padding:32px 28px;">
      <h2 style="margin:0 0 8px;color:#17202a;font-size:18px;">${SCENE_TEXT[scene]}验证码</h2>
      <p style="margin:0 0 24px;color:#5c6672;font-size:14px;line-height:1.7;">
        您正在进行<strong>${SCENE_TEXT[scene]}</strong>操作，验证码 5 分钟内有效：
      </p>
      <div style="background:#eef4f7;border:1px dashed #2e6e88;border-radius:10px;padding:18px 0;text-align:center;">
        <span style="font-family:'SF Mono',Consolas,Menlo,monospace;font-size:34px;font-weight:700;letter-spacing:12px;color:#2e6e88;">${code}</span>
      </div>
      <p style="margin:24px 0 0;color:#98a2ad;font-size:12px;line-height:1.7;">
        如非本人操作，请忽略此邮件。请勿将验证码转发或告知他人。
      </p>
    </div>
    <div style="border-top:1px solid #e3e8ed;padding:16px 28px;color:#98a2ad;font-size:11px;">
      HOD 算力乐 · 账户安全验证 · 本邮件由系统自动发送，请勿回复
    </div>
  </div>
</body>
</html>`;
  return { subject, html };
}

/** 发送验证码邮件 */
export async function sendVerificationEmail(
  to: string,
  code: string,
  scene: EmailScene
): Promise<void> {
  const { subject, html } = buildVerificationEmail(code, scene);
  const from = `"${process.env.EMAIL_FROM_NAME ?? 'HOD 算力乐'}" <${
    process.env.EMAIL_FROM ?? process.env.SMTP_USER
  }>`;
  await getTransporter().sendMail({ from, to, subject, html });
}

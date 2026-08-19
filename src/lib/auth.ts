import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from './prisma';
import type { User } from '../generated/prisma/client';

const COOKIE_NAME = 'hod_session';
if (!process.env.AUTH_SECRET) {
  throw new Error('[auth] AUTH_SECRET 环境变量未设置。生产环境必须设置一个随机强密钥。请复制 .env.example 并填入你的密钥。');
}
const secretKey = new TextEncoder().encode(process.env.AUTH_SECRET);

export function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

export async function createSession(userId: string, username: string, role: string) {
  const token = await new SignJWT({ uid: userId, username, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** 从会话 cookie 读取当前用户（含最新余额），未登录或已封禁返回 null */
export async function getSessionUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    const user = await prisma.user.findUnique({ where: { id: payload.uid as string } });
    if (!user || user.status !== 'ACTIVE') return null;
    return user;
  } catch {
    return null;
  }
}

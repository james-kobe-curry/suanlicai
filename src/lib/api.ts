import { NextResponse } from 'next/server';
import type { User } from '../generated/prisma/client';

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function isAdmin(user: User | null): boolean {
  return user?.role === 'ADMIN';
}

/** 是否已完成手机号或邮箱绑定（参与投注等敏感操作的前置条件） */
export function isBound(user: User | null): boolean {
  return !!user && !!(user.phone || user.email);
}

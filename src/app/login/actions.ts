"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  setSession,
  clearSession,
} from "@/lib/auth";

function safeNext(next: string | null | undefined): string {
  // 오픈 리다이렉트 방지: 앱 내부 경로만 허용
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/stories";
}

export type AuthState = { error?: string } | null;

export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const username = String(formData.get("username") || "")
    .trim()
    .toLowerCase();
  const displayName = String(formData.get("displayName") || "").trim();
  const password = String(formData.get("password") || "");
  const next = safeNext(String(formData.get("next") || ""));

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return { error: "아이디는 영문 소문자·숫자·밑줄 3~20자로 지어주세요." };
  }
  if (!displayName) return { error: "필명을 입력해주세요." };
  if (password.length < 6) {
    return { error: "비밀번호는 6자 이상으로 정해주세요." };
  }

  const exists = await db.user.findUnique({ where: { username } });
  if (exists) return { error: "이미 사용 중인 아이디예요." };

  const user = await db.user.create({
    data: { username, displayName, passwordHash: hashPassword(password) },
  });
  await setSession(user.id);
  redirect(next);
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const username = String(formData.get("username") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const next = safeNext(String(formData.get("next") || ""));

  const user = await db.user.findUnique({ where: { username } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "아이디 또는 비밀번호가 올바르지 않아요." };
  }
  await setSession(user.id);
  redirect(next);
}

export async function logout() {
  await clearSession();
  redirect("/");
}

import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHmac,
} from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

// 세션 서명용 비밀키. 배포 시 AUTH_SECRET 환경변수를 반드시 설정하세요.
const SECRET =
  process.env.AUTH_SECRET || "plotwerks-dev-secret-change-me-in-production";
const COOKIE = "pw_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30일

// ── 비밀번호 해시 (scrypt, 외부 의존성 없음) ──────────────
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derived = scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(key, "hex");
  if (keyBuf.length !== derived.length) return false;
  return timingSafeEqual(keyBuf, derived);
}

// ── 서명된 세션 토큰 ─────────────────────────────────────
function sign(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("hex");
}

function makeToken(userId: string): string {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  const payload = `${userId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

function readToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, exp, sig] = parts;
  const payload = `${userId}.${exp}`;
  const expected = sign(payload);
  if (
    sig.length !== expected.length ||
    !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return null;
  }
  if (Number(exp) < Math.floor(Date.now() / 1000)) return null;
  return userId;
}

// ── 세션 쿠키 읽기/쓰기 ──────────────────────────────────
export async function setSession(userId: string) {
  const store = await cookies();
  store.set(COOKIE, makeToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export type CurrentUser = {
  id: string;
  username: string;
  displayName: string;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const userId = readToken(token);
  if (!userId) return null;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, displayName: true },
  });
  return user;
}

// 로그인 필수 페이지에서 사용. 미로그인 시 로그인 화면으로 보냄.
export async function requireUser(next?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  }
  return user;
}

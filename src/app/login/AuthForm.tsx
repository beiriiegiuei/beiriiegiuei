"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { authenticate, type AuthState } from "./actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "잠시만요…" : label}
    </button>
  );
}

export function AuthForm({
  initialMode,
  next,
}: {
  initialMode: "login" | "signup";
  next?: string;
}) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [state, formAction] = useActionState<AuthState, FormData>(
    authenticate,
    null,
  );

  return (
    <div>
      <div
        className="mb-5 flex rounded-xl bg-paper-sunk p-1"
        role="tablist"
        aria-label="로그인 또는 회원가입"
      >
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              mode === m
                ? "bg-paper text-ink shadow-card"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {m === "login" ? "로그인" : "회원가입"}
          </button>
        ))}
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="mode" value={mode} />
        {next && <input type="hidden" name="next" value={next} />}

        <div>
          <label className="label" htmlFor="username">
            아이디
          </label>
          <input
            id="username"
            name="username"
            required
            autoComplete="username"
            className="input"
            placeholder="영문 소문자·숫자 (예: story_lover)"
            pattern="[A-Za-z0-9_]{3,20}"
          />
        </div>

        {mode === "signup" && (
          <div>
            <label className="label" htmlFor="displayName">
              필명 (화면에 보이는 이름)
            </label>
            <input
              id="displayName"
              name="displayName"
              required
              autoComplete="nickname"
              className="input"
              placeholder="예: 겨울작가"
            />
          </div>
        )}

        <div>
          <label className="label" htmlFor="password">
            비밀번호
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="input"
            placeholder="6자 이상"
          />
        </div>

        {state?.error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
          >
            {state.error}
          </p>
        )}

        <SubmitButton label={mode === "login" ? "로그인" : "가입하고 시작하기"} />
      </form>
    </div>
  );
}

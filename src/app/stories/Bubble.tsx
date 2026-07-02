import { Avatar } from "./Avatar";

export type Kind = "dialogue" | "thought" | "monologue" | "narration";
export type BubbleChar = {
  name: string;
  emoji: string | null;
  avatar: string | null;
  align: string;
};

/* 리더와 편집기 미리보기가 함께 쓰는 말풍선 렌더러.
   grouped=true 이면 바로 위와 같은 화자·종류라 프로필/이름을 숨기고 묶어서 보여준다. */
export function Bubble({
  kind,
  text,
  char,
  grouped = false,
}: {
  kind: Kind;
  text: string;
  char?: BubbleChar;
  grouped?: boolean;
}) {
  if (kind === "narration") {
    return (
      <div className="my-2 flex items-center gap-3 py-1" role="note">
        <span className="h-px flex-1 bg-line" />
        <span className="max-w-[80%] text-center text-sm italic text-ink-muted">
          {text}
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>
    );
  }

  const right = char?.align === "right";
  let bubbleClass =
    "rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words";
  let tag: string | null = null;
  if (kind === "dialogue") {
    bubbleClass += right
      ? " bg-brand-600 text-white rounded-br-md"
      : " bg-paper-sunk text-ink rounded-bl-md";
  } else if (kind === "thought") {
    bubbleClass +=
      " border border-dashed border-line-strong bg-paper text-ink-muted italic";
    tag = "💭 생각";
  } else {
    bubbleClass += " bg-paper border border-line text-ink-soft italic";
    tag = "혼잣말";
  }

  return (
    <div className={`flex items-end gap-2 ${right ? "flex-row-reverse" : "flex-row"}`}>
      {grouped ? (
        <span className="w-8 shrink-0" aria-hidden />
      ) : (
        <Avatar emoji={char?.emoji} avatar={char?.avatar} name={char?.name} size={32} />
      )}
      <div className={`flex max-w-[78%] flex-col ${right ? "items-end" : "items-start"}`}>
        {!grouped && (
          <span className="mb-0.5 px-1 text-xs font-medium text-ink-muted">
            {char?.name || "?"}
            {tag && <span className="ml-1 text-ink-faint">· {tag}</span>}
          </span>
        )}
        <div className={bubbleClass}>{text}</div>
      </div>
    </div>
  );
}

// 앞 메시지와 같은 화자·종류(대사/생각/혼잣말)면 묶음 처리
export function isGrouped(
  list: { characterId: string | null; kind: Kind }[],
  i: number,
): boolean {
  if (i <= 0) return false;
  const cur = list[i];
  const prev = list[i - 1];
  if (cur.kind === "narration" || prev.kind === "narration") return false;
  return cur.characterId === prev.characterId && cur.kind === prev.kind;
}

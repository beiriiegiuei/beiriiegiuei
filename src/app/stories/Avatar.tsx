/* 프로필: 업로드한 사진이 있으면 사진, 없으면 이모지 (색 구분 없음) */
export function Avatar({
  emoji,
  avatar,
  name,
  size = 32,
}: {
  emoji?: string | null;
  avatar?: string | null;
  name?: string;
  size?: number;
}) {
  const style = { width: size, height: size };
  if (avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatar}
        alt={name ? `${name} 프로필` : "프로필"}
        style={style}
        className="shrink-0 select-none rounded-full object-cover"
      />
    );
  }
  return (
    <span
      style={{ ...style, fontSize: size * 0.55 }}
      className="flex shrink-0 select-none items-center justify-center rounded-full bg-paper-sunk"
      aria-hidden
    >
      {emoji || "🙂"}
    </span>
  );
}

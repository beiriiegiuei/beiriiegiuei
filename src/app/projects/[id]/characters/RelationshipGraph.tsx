"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Character, Relationship } from "@prisma/client";

export const KIND_META: Record<string, { label: string; color: string }> = {
  romance: { label: "연인/애정", color: "#ec4899" },
  ally: { label: "협력/우호", color: "#10b981" },
  rival: { label: "적대/라이벌", color: "#ef4444" },
  family: { label: "가족/혈연", color: "#f59e0b" },
  neutral: { label: "기타", color: "#94a3b8" },
};

const W = 820;
const H = 540;

export function RelationshipGraph({
  characters,
  relationships,
  onEditRelationship,
}: {
  characters: Character[];
  relationships: Relationship[];
  onEditRelationship: (rel: Relationship) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [pos, setPos] = useState<Record<string, { x: number; y: number }>>({});
  const dragId = useRef<string | null>(null);

  // 초기 배치: 원형
  useEffect(() => {
    setPos((prev) => {
      const next = { ...prev };
      const n = characters.length;
      characters.forEach((c, i) => {
        if (!next[c.id]) {
          const angle = (i / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2;
          const r = Math.min(W, H) / 2 - 90;
          next[c.id] = {
            x: W / 2 + r * Math.cos(angle),
            y: H / 2 + r * Math.sin(angle),
          };
        }
      });
      // 삭제된 인물 정리
      for (const k of Object.keys(next)) {
        if (!characters.find((c) => c.id === k)) delete next[k];
      }
      return next;
    });
  }, [characters]);

  const toSvg = (e: React.PointerEvent) => {
    const svg = svgRef.current!;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const r = p.matrixTransform(ctm.inverse());
    return { x: r.x, y: r.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragId.current) return;
    const { x, y } = toSvg(e);
    setPos((prev) => ({
      ...prev,
      [dragId.current!]: {
        x: Math.max(40, Math.min(W - 40, x)),
        y: Math.max(40, Math.min(H - 40, y)),
      },
    }));
  };

  const charMap = useMemo(
    () => Object.fromEntries(characters.map((c) => [c.id, c])),
    [characters]
  );

  if (characters.length === 0) {
    return (
      <div className="card flex h-[300px] items-center justify-center text-sm text-ink-faint">
        인물을 2명 이상 추가하면 관계도를 그릴 수 있어요.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-[540px] w-full touch-none select-none"
        onPointerMove={onPointerMove}
        onPointerUp={() => (dragId.current = null)}
        onPointerLeave={() => (dragId.current = null)}
      >
        <defs>
          <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0H0V28" fill="none" stroke="#f0eef5" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#grid)" />

        {/* 관계선 */}
        {relationships.map((rel) => {
          const a = pos[rel.fromId];
          const b = pos[rel.toId];
          if (!a || !b || !charMap[rel.fromId] || !charMap[rel.toId]) return null;
          const color = KIND_META[rel.kind || "neutral"]?.color || "#94a3b8";
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          return (
            <g
              key={rel.id}
              className="cursor-pointer"
              onClick={() => onEditRelationship(rel)}
            >
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={color}
                strokeWidth={2.5}
                strokeOpacity={0.55}
              />
              {rel.label && (
                <>
                  <rect
                    x={mx - rel.label.length * 6 - 8}
                    y={my - 12}
                    width={rel.label.length * 12 + 16}
                    height={22}
                    rx={11}
                    fill="white"
                    stroke={color}
                    strokeOpacity={0.5}
                  />
                  <text
                    x={mx}
                    y={my + 3}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="600"
                    fill={color}
                  >
                    {rel.label}
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* 인물 노드 */}
        {characters.map((c) => {
          const p = pos[c.id];
          if (!p) return null;
          const color = c.color || "#7c54f5";
          return (
            <g
              key={c.id}
              transform={`translate(${p.x},${p.y})`}
              className="cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => {
                dragId.current = c.id;
                (e.target as Element).setPointerCapture?.(e.pointerId);
              }}
            >
              <circle r={26} fill="white" stroke={color} strokeWidth={2.5} />
              <text textAnchor="middle" y={7} fontSize="22">
                {c.emoji || "🧑"}
              </text>
              <text
                textAnchor="middle"
                y={46}
                fontSize="13"
                fontWeight="700"
                fill="#1c1b22"
              >
                {c.name}
              </text>
              {c.role && (
                <text textAnchor="middle" y={62} fontSize="11" fill="#9a97a8">
                  {c.role}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-3 border-t border-line px-4 py-2.5 text-xs text-ink-muted">
        {Object.entries(KIND_META).map(([k, v]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: v.color }}
            />
            {v.label}
          </span>
        ))}
        <span className="ml-auto text-ink-faint">
          노드를 드래그해 배치 · 선을 눌러 관계 편집
        </span>
      </div>
    </div>
  );
}

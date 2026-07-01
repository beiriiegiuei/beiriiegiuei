import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const db = new PrismaClient();

// src/lib/auth.ts 와 동일한 방식(scrypt)으로 비밀번호 해시
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

async function main() {
  const project = await db.project.create({
    data: {
      title: "끝나지 않는 겨울",
      logline: "시간이 멈춘 도시에서 유일하게 깨어있는 소녀가 세계의 비밀을 좇는 이야기.",
      genre: "판타지 / 미스터리",
      coverEmoji: "❄️",
    },
  });
  const pid = project.id;

  // 세력
  const [frost, ember] = await Promise.all([
    db.faction.create({
      data: {
        projectId: pid, name: "서리회", element: "빙결", emoji: "❄️", color: "#06b6d4",
        summary: "시간을 멈춘 도시를 수호하려는 비밀 결사.",
        description: "정지된 세계의 질서를 지키며, 깨어난 자들을 관리한다.",
      },
    }),
    db.faction.create({
      data: {
        projectId: pid, name: "잔불단", element: "화염", emoji: "🔥", color: "#ef4444",
        summary: "겨울을 끝내려는 급진 세력.",
      },
    }),
  ]);

  await db.factionRelation.create({
    data: {
      projectId: pid, fromId: ember.id, toId: frost.id,
      label: "숙적", kind: "rival", description: "겨울의 존속을 두고 정면 충돌.",
    },
  });

  // 인물
  const [seo, doha, gray] = await Promise.all([
    db.character.create({
      data: {
        projectId: pid, name: "서리", aliases: "마지막 각성자", role: "주인공",
        emoji: "🧝", color: "#7c54f5",
        summary: "멈춘 시간 속에서 홀로 깨어난 17세 소녀.",
        age: "17", gender: "여", mbti: "INFP", element: "시간", rank: 3,
        tier: "각성자", lifeStatus: "alive", tags: "각성자, 떡밥보유",
        factionId: frost.id, goal: "겨울을 끝내고 가족을 되찾는 것",
        personality: "겁이 많지만 결정적인 순간엔 누구보다 용감하다.",
        background: "사고 이후 시간이 멈춘 도시에서 깨어났다.", order: 0,
      },
    }),
    db.character.create({
      data: {
        projectId: pid, name: "도하", aliases: "여우", role: "조력자",
        emoji: "🦊", color: "#10b981",
        summary: "시간의 틈을 넘나드는 정체불명의 소년.",
        gender: "남", mbti: "ENTP", element: "공간", rank: 5,
        lifeStatus: "unknown", tags: "비밀, 조력자", factionId: frost.id,
        goal: "서리를 돕는 진짜 이유를 숨기고 있다.",
        personality: "능청스럽고 비밀이 많다.", order: 1,
      },
    }),
    db.character.create({
      data: {
        projectId: pid, name: "회백", aliases: "겨울의 군주", role: "악역",
        emoji: "🐺", color: "#ef4444",
        summary: "겨울을 불러온 존재. 시간을 지배하려 한다.",
        gender: "?", element: "정지", rank: 1, tier: "군주", lifeStatus: "alive",
        tags: "최종보스", factionId: ember.id,
        goal: "영원한 정지의 세계를 완성하는 것",
        personality: "냉정하고 논리적이다.", order: 2,
      },
    }),
  ]);

  // 세력 수장 지정
  await db.faction.update({ where: { id: frost.id }, data: { leaderId: doha.id } });
  await db.faction.update({ where: { id: ember.id }, data: { leaderId: gray.id } });

  await db.relationship.createMany({
    data: [
      { projectId: pid, fromId: doha.id, toId: seo.id, label: "비밀스러운 보호자", kind: "ally" },
      { projectId: pid, fromId: gray.id, toId: seo.id, label: "숙명의 적", kind: "rival" },
      { projectId: pid, fromId: doha.id, toId: gray.id, label: "과거의 인연", kind: "neutral" },
    ],
  });

  // 시즌 → 아크 → 회차
  const s1 = await db.season.create({ data: { projectId: pid, title: "시즌1 · 각성", order: 0 } });
  const s2 = await db.season.create({ data: { projectId: pid, title: "시즌2 · 균열", order: 1 } });

  const arc1 = await db.act.create({
    data: { projectId: pid, seasonId: s1.id, title: "아크1 · 멈춘 도시", summary: "서리의 각성과 첫 여정.", epStart: 1, epEnd: 12, order: 0 },
  });
  const arc2 = await db.act.create({
    data: { projectId: pid, seasonId: s1.id, title: "아크2 · 틈의 추적자", summary: "도하와 함께 시간의 틈을 좇는다.", epStart: 13, epEnd: 24, order: 1 },
  });
  const arc3 = await db.act.create({
    data: { projectId: pid, seasonId: s2.id, title: "아크3 · 군주와의 대치", summary: "회백의 진실과 최종 대결.", epStart: 25, epEnd: 40, order: 2 },
  });

  const ep1 = await db.scene.create({
    data: { projectId: pid, actId: arc1.id, title: "멈춘 도시에서 눈을 뜨다", episodeNo: 1, summary: "서리가 정지된 세계에서 홀로 깨어난다.", status: "done", order: 0 },
  });
  await db.scene.create({
    data: { projectId: pid, actId: arc1.id, title: "도하와의 첫 만남", episodeNo: 4, summary: "눈 내리는 정류장에서 도하를 만난다.", status: "draft", order: 1 },
  });
  await db.scene.create({
    data: { projectId: pid, actId: arc2.id, title: "시간의 틈으로", episodeNo: 13, summary: "첫 번째 틈을 통과한다.", status: "idea", order: 2 },
  });
  const epClimax = await db.scene.create({
    data: { projectId: pid, actId: arc3.id, title: "회백과의 마지막 대치", episodeNo: 38, summary: "서리가 흉터의 비밀을 깨닫고 시간을 되돌린다.", status: "idea", order: 3 },
  });

  // 떡밥
  await db.foreshadow.createMany({
    data: [
      {
        projectId: pid, title: "서리 목에 난 흉터의 정체", importance: 3, status: "planted",
        description: "1화에서 슬쩍 비추고, 후반 클라이맥스에서 시간 능력의 근원으로 회수.",
        plantedSceneId: ep1.id, resolvedSceneId: epClimax.id,
      },
      { projectId: pid, title: "도하가 들고 다니는 회중시계", importance: 2, status: "planted", description: "사실 회백의 물건이었다는 복선." },
      { projectId: pid, title: "도시 곳곳의 멈춘 새들", importance: 1, status: "resolved", description: "정지의 범위를 보여주는 장치. 회수됨." },
    ],
  });

  // 위키
  await db.wikiPage.createMany({
    data: [
      { projectId: pid, category: "지명", title: "회백의 도시", order: 0, content: "# 회백의 도시\n\n시간이 멈춘 회색의 도시. **[[서리]]** 만이 이곳에서 움직일 수 있다.\n\n- 눈이 영원히 내린다\n- 새와 사람 모두 정지해 있다" },
      { projectId: pid, category: "설정", title: "시간 정지", order: 1, content: "## 시간 정지의 규칙\n\n[[회백의 도시]] 전체에 걸린 현상.\n\n- 흉터를 가진 자만 면역\n- 회중시계로 일시적 해제 가능" },
      { projectId: pid, category: "세력", title: "서리회", order: 2, content: "정지된 세계를 수호하는 비밀 결사. 세력 페이지를 참고." },
    ],
  });

  console.log(`✅ 데모 작품 "${project.title}" 생성 완료 (id: ${pid})`);

  // ── 톡스토리 데모 (대화형 스토리) ──────────────────────
  const demoUser = await db.user.upsert({
    where: { username: "demo" },
    update: {},
    create: {
      username: "demo",
      displayName: "겨울작가",
      passwordHash: hashPassword("demo1234"),
    },
  });

  const story = await db.talkStory.create({
    data: {
      authorId: demoUser.id,
      title: "새벽 두 시의 메시지",
      description: "잠 못 드는 밤, 모르는 번호로 온 한 통의 메시지에서 시작되는 짧은 대화.",
      coverEmoji: "🌙",
      genre: "미스터리 / 로맨스",
      published: true,
    },
  });

  const 나 = await db.talkCharacter.create({
    data: { storyId: story.id, name: "나", emoji: "🙂", color: "#3daa7c", align: "right", order: 0 },
  });
  const 그 = await db.talkCharacter.create({
    data: { storyId: story.id, name: "모르는 번호", emoji: "👤", color: "#7c54f5", align: "left", order: 1 },
  });

  const lines: { c?: string; kind: string; text: string }[] = [
    { kind: "narration", text: "새벽 2시 14분. 휴대폰이 짧게 울렸다." },
    { c: 그.id, kind: "dialogue", text: "혹시… 아직 안 자요?" },
    { c: 나.id, kind: "thought", text: "누구지? 저장 안 된 번호인데." },
    { c: 나.id, kind: "dialogue", text: "누구세요? 번호 잘못 아신 것 같은데요." },
    { c: 그.id, kind: "dialogue", text: "아니요. 당신이 맞아요. 3층 창문에 불 켜져 있는 사람." },
    { c: 나.id, kind: "monologue", text: "창밖을 봤다. 맞은편 건물은… 전부 불이 꺼져 있었다." },
    { kind: "narration", text: "심장이 빠르게 뛰기 시작했다." },
    { c: 나.id, kind: "dialogue", text: "지금 어디서 절 보고 있는 거예요?" },
    { c: 그.id, kind: "dialogue", text: "걱정 말아요. 나쁜 사람 아니에요. 그냥… 오늘 밤엔 당신도 잠들면 안 될 것 같아서." },
    { c: 나.id, kind: "thought", text: "이 사람, 뭔가를 알고 있다." },
    { kind: "narration", text: "그리고 다음 메시지가 도착했다. — 다음 화에서 계속." },
  ];

  await db.talkMessage.createMany({
    data: lines.map((l, i) => ({
      storyId: story.id,
      characterId: l.c ?? null,
      kind: l.kind,
      text: l.text,
      order: i,
    })),
  });

  console.log(`✅ 톡스토리 데모 "${story.title}" 생성 완료 (데모 계정: demo / demo1234)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

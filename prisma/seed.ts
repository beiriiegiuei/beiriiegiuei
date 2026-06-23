import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

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

  // 인물
  const [seo, doha, gray] = await Promise.all([
    db.character.create({
      data: {
        projectId: pid, name: "서리", role: "주인공", emoji: "🧝", color: "#7c54f5",
        summary: "멈춘 시간 속에서 홀로 깨어난 17세 소녀.",
        age: "17", gender: "여", goal: "겨울을 끝내고 가족을 되찾는 것",
        personality: "겁이 많지만 결정적인 순간엔 누구보다 용감하다.",
        background: "사고 이후 시간이 멈춘 도시에서 깨어났다.",
        order: 0,
      },
    }),
    db.character.create({
      data: {
        projectId: pid, name: "도하", role: "조력자", emoji: "🦊", color: "#10b981",
        summary: "시간의 틈을 넘나드는 정체불명의 소년.",
        age: "?", gender: "남", goal: "서리를 돕는 진짜 이유를 숨기고 있다.",
        personality: "능청스럽고 비밀이 많다.", order: 1,
      },
    }),
    db.character.create({
      data: {
        projectId: pid, name: "회백", role: "악역", emoji: "🐺", color: "#ef4444",
        summary: "겨울을 불러온 존재. 시간을 지배하려 한다.",
        gender: "?", goal: "영원한 정지의 세계를 완성하는 것",
        personality: "냉정하고 논리적이다.", order: 2,
      },
    }),
  ]);

  await db.relationship.createMany({
    data: [
      { projectId: pid, fromId: doha.id, toId: seo.id, label: "비밀스러운 보호자", kind: "ally" },
      { projectId: pid, fromId: gray.id, toId: seo.id, label: "숙명의 적", kind: "rival" },
      { projectId: pid, fromId: doha.id, toId: gray.id, label: "과거의 인연", kind: "neutral" },
    ],
  });

  // 막 + 장면
  const acts = await Promise.all([
    db.act.create({ data: { projectId: pid, title: "1막 · 발단", order: 0 } }),
    db.act.create({ data: { projectId: pid, title: "2막 · 전개", order: 1 } }),
    db.act.create({ data: { projectId: pid, title: "3막 · 결말", order: 2 } }),
  ]);

  const scene1 = await db.scene.create({
    data: { projectId: pid, actId: acts[0].id, title: "멈춘 도시에서 눈을 뜨다", summary: "서리가 정지된 세계에서 홀로 깨어난다.", status: "done", order: 0 },
  });
  await db.scene.create({
    data: { projectId: pid, actId: acts[0].id, title: "도하와의 첫 만남", summary: "눈 내리는 정류장에서 도하를 만난다.", status: "draft", order: 1 },
  });
  const sceneClimax = await db.scene.create({
    data: { projectId: pid, actId: acts[2].id, title: "회백과의 마지막 대치", summary: "서리가 흉터의 비밀을 깨닫고 시간을 되돌린다.", status: "idea", order: 2 },
  });

  // 떡밥
  await db.foreshadow.createMany({
    data: [
      {
        projectId: pid, title: "서리 목에 난 흉터의 정체", importance: 3, status: "planted",
        description: "1막에서 슬쩍 비추고, 3막 클라이맥스에서 시간 능력의 근원으로 회수.",
        plantedSceneId: scene1.id, resolvedSceneId: sceneClimax.id,
      },
      {
        projectId: pid, title: "도하가 들고 다니는 회중시계", importance: 2, status: "planted",
        description: "사실 회백의 물건이었다는 복선.",
      },
      {
        projectId: pid, title: "도시 곳곳의 멈춘 새들", importance: 1, status: "resolved",
        description: "정지의 범위를 보여주는 장치. 회수됨.",
      },
    ],
  });

  // 위키
  await db.wikiPage.createMany({
    data: [
      { projectId: pid, category: "지명", title: "회백의 도시", order: 0, content: "# 회백의 도시\n\n시간이 멈춘 회색의 도시. **[[서리]]** 만이 이곳에서 움직일 수 있다.\n\n- 눈이 영원히 내린다\n- 새와 사람 모두 정지해 있다" },
      { projectId: pid, category: "설정", title: "시간 정지", order: 1, content: "## 시간 정지의 규칙\n\n[[회백의 도시]] 전체에 걸린 현상.\n\n- 흉터를 가진 자만 면역\n- 회중시계로 일시적 해제 가능" },
      { projectId: pid, category: "세력", title: "서리", order: 2, content: "주인공. 자세한 건 인물 카드를 참고." },
    ],
  });

  console.log(`✅ 데모 작품 "${project.title}" 생성 완료 (id: ${pid})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * 🏛️ 도시별 랜드마크 3D 모형 (클레이 디오라마 스타일)
 *
 * ▶ 왜 이미지가 아니라 3D 모형인가?
 * 예전에는 랜드마크를 HTML 마커 안에 <img> 로 띄웠습니다.
 * 그러면 지구본을 돌려도 그림이 항상 화면을 정면으로 바라봐서
 * 지면에 서 있는 게 아니라 **공중에 둥둥 떠 있는 스티커**처럼 보였습니다.
 * 여기서는 three.js 기본 도형을 조합해 진짜 입체 모형을 만들고,
 * globe.gl 의 objects 레이어로 지구 표면에 세워 둡니다.
 * 그래서 구글어스처럼 지구본을 돌리면 모형도 같이 기울고,
 * 지구 반대편으로 넘어가면 지구에 가려 사라집니다.
 *
 * ▶ 좌표 약속
 * 각 모형은 **Y축이 하늘 방향, 바닥이 y = 0** 인 상태로 만듭니다.
 * three-globe 의 objects 레이어는 물체의 **+Z 축을 지표면 바깥쪽**으로 세우므로,
 * 마지막에 바깥 그룹을 X축으로 90° 눕혀(rotation.x = π/2) 방향을 맞춥니다.
 * 모형 기준으로 +X 는 동쪽, +Z 는 남쪽입니다.
 *
 * ▶ 왜 마지막에 도형을 합치는가(flatten)?
 * 모형 하나가 도형 수십~백여 개로 이뤄져 있어서 그대로 두면
 * 도시 11곳 × 수십 개 = 수백 번의 그리기 명령이 매 프레임 나갑니다.
 * 재질이 같은 도형끼리 하나의 Mesh 로 합치면 모형당 4~6번으로 줄어듭니다.
 */

// ── 클레이 톤 색 팔레트 ──────────────────────────────
const COLOR = {
  stone: 0xd9c7a5, // 밝은 석재
  stoneDark: 0xb49c78, // 그늘진 석재
  // 현무암(제주 돌하르방). 실제 돌은 훨씬 검지만, 그대로 쓰면 지구본 위에서
  // 그림자 같은 검은 덩어리로만 보여서 한 단계 밝은 회색으로 올렸습니다.
  granite: 0x969ca6,
  graniteDark: 0x5c626b,
  bronze: 0xb08048, // 에펠탑 청동
  red: 0xe0503f, // 도쿄타워 적색
  cream: 0xf3ece0, // 흰 도장
  patina: 0x7fd0b4, // 자유의 여신상 청록
  slate: 0x7b93ab, // 지붕 청색
  gold: 0xf0c14b,
  grass: 0x5f9152,
  soil: 0x8a7451,
  dryHill: 0xa8934f, // 할리우드 언덕
  concrete: 0xc9cfd6,
  cable: 0xe8eef5,
  roofTile: 0xc0663f, // 기와
}

// ── 도형 헬퍼 ────────────────────────────────────────
const clay = (color, extra = {}) =>
  new THREE.MeshLambertMaterial({
    color,
    // 빛이 닿지 않는 뒷면이 새까맣게 죽지 않도록 아주 옅은 자체발광을 섞습니다
    emissive: new THREE.Color(color).multiplyScalar(0.16),
    ...extra,
  })

const box = (mat, w, h, d) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
const cyl = (mat, rTop, rBottom, h, seg = 14) =>
  new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, seg), mat)
const cone = (mat, r, h, seg = 14) => new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat)
const ball = (mat, r, seg = 12) => new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), mat)

/** 위치 지정 (체이닝용으로 Mesh 를 그대로 돌려줍니다) */
const at = (obj, x = 0, y = 0, z = 0) => {
  obj.position.set(x, y, z)
  return obj
}

/** Y축 회전 (라디안) */
const yaw = (obj, rad) => {
  obj.rotation.y = rad
  return obj
}

/** 크기 조절 */
const scaled = (obj, sx, sy, sz) => {
  obj.scale.set(sx, sy, sz)
  return obj
}

const UP = new THREE.Vector3(0, 1, 0)

/**
 * 두 점 a → b 를 잇는 각기둥(다리 케이블, 탑의 다리 등).
 * BoxGeometry 의 Y축이 길이 방향이 되도록 회전시킵니다.
 */
const strut = (mat, a, b, thickness) => {
  const dir = new THREE.Vector3().subVectors(b, a)
  const len = dir.length()
  if (len < 1e-6) return null

  const m = new THREE.Mesh(new THREE.BoxGeometry(thickness, len, thickness), mat)
  m.position.copy(a).addScaledVector(dir, 0.5)
  m.quaternion.setFromUnitVectors(UP, dir.normalize())
  return m
}

const v = (x, y, z) => new THREE.Vector3(x, y, z)

/** 부드러운 언덕 (납작하게 눌린 반구) */
const hill = (mat, rx, ry, rz, x = 0, z = 0) =>
  at(scaled(ball(mat, 1, 14), rx, ry, rz), x, -ry * 0.35, z)

/**
 * 재질이 같은 도형끼리 하나의 Mesh 로 합쳐 그리기 명령을 줄입니다.
 * (모형을 만들 때는 편하게 도형을 흩뿌려 두고, 마지막에 한 번만 부릅니다)
 */
const flatten = (group) => {
  group.updateMatrixWorld(true)

  const byMaterial = new Map()
  group.traverse((o) => {
    if (!o.isMesh) return
    /*
     * 합치려면 도형들의 형식이 같아야 합니다.
     * BoxGeometry 같은 대부분의 도형은 인덱스를 쓰지만 OctahedronGeometry 처럼
     * 인덱스가 없는 도형도 섞여 있어서, 전부 인덱스 없는 형태로 통일합니다.
     * (통일하지 않으면 mergeGeometries 가 null 을 돌려주고 모형이 사라집니다)
     */
    const src = o.geometry
    const baked = (src.index ? src.toNonIndexed() : src.clone()).applyMatrix4(o.matrixWorld)
    if (!byMaterial.has(o.material)) byMaterial.set(o.material, [])
    byMaterial.get(o.material).push(baked)
    src.dispose()
  })

  const merged = new THREE.Group()
  for (const [material, geometries] of byMaterial) {
    const geometry = mergeGeometries(geometries, false)
    geometries.forEach((g) => g.dispose())
    if (geometry) merged.add(new THREE.Mesh(geometry, material))
  }
  return merged
}

// ────────────────────────────────────────────────────
// 도시별 모형
// ────────────────────────────────────────────────────

/** 🇰🇷 서울 — N서울타워 (남산 언덕 위) */
const buildSeoulTower = () => {
  const g = new THREE.Group()
  const m = {
    hill: clay(COLOR.grass),
    base: clay(COLOR.stoneDark),
    shaft: clay(COLOR.cream),
    deck: clay(0x9ec9e8),
    mast: clay(COLOR.concrete),
  }

  g.add(hill(m.hill, 2.7, 1.1, 2.7))
  g.add(at(cyl(m.base, 0.6, 0.85, 0.8, 12), 0, 1.0, 0))
  g.add(at(cyl(m.shaft, 0.3, 0.45, 3.0, 12), 0, 2.9, 0))

  // 부풀어 오른 전망대 3단
  g.add(at(cyl(m.shaft, 0.85, 0.5, 0.75, 16), 0, 4.7, 0))
  g.add(at(cyl(m.deck, 0.92, 0.92, 0.3, 16), 0, 5.2, 0))
  g.add(at(cyl(m.shaft, 0.5, 0.85, 0.7, 16), 0, 5.7, 0))

  g.add(at(cyl(m.mast, 0.06, 0.16, 2.0, 8), 0, 7.05, 0))
  return flatten(g)
}

/** 🇰🇷 부산 — 광안대교 (2층 현수교) */
const buildGwanganBridge = () => {
  const g = new THREE.Group()
  const m = {
    deck: clay(COLOR.concrete),
    tower: clay(COLOR.cream),
    cable: clay(COLOR.cable, { emissive: new THREE.Color(0x60e0ff).multiplyScalar(0.35) }),
    pier: clay(COLOR.stoneDark),
    sea: clay(0x2f6fa8, { transparent: true, opacity: 0.75 }),
  }

  g.add(at(scaled(cyl(m.sea, 1, 1, 0.25, 24), 6.5, 1, 4.2), 0, 0.12, 0))

  // 상·하판 (복층 구조가 광안대교의 특징입니다)
  g.add(at(box(m.deck, 13, 0.26, 1.3), 0, 2.6, 0))
  g.add(at(box(m.deck, 13, 0.24, 1.3), 0, 1.9, 0))

  // 교각
  for (const x of [-5.6, -2.8, 2.8, 5.6]) {
    g.add(at(cyl(m.pier, 0.32, 0.44, 1.9, 10), x, 0.95, 0))
  }

  // 주탑 2기 (문(門) 모양)
  for (const x of [-2.8, 2.8]) {
    for (const z of [-0.5, 0.5]) {
      g.add(at(box(m.tower, 0.3, 3.6, 0.3), x, 4.3, z))
    }
    g.add(at(box(m.tower, 0.26, 0.26, 1.3), x, 5.5, 0))
    g.add(at(box(m.tower, 0.26, 0.26, 1.3), x, 4.2, 0))
  }

  // 주케이블 (포물선을 짧은 직선으로 이어 근사)
  const cableY = (x) => {
    if (Math.abs(x) <= 2.8) return 2.9 + 3.1 * (x / 2.8) ** 2 // 주경간: 아래로 처짐
    return 6.0 - 1.9 * ((Math.abs(x) - 2.8) / 3.0) // 측경간: 앵커까지 내려옴
  }
  for (const z of [-0.5, 0.5]) {
    for (let x = -6.4; x < 6.4; x += 0.8) {
      const seg = strut(m.cable, v(x, cableY(x), z), v(x + 0.8, cableY(x + 0.8), z), 0.11)
      if (seg) g.add(seg)
    }
  }

  // 수직 행어
  for (let x = -2.4; x <= 2.4; x += 0.8) {
    for (const z of [-0.5, 0.5]) {
      const top = cableY(x)
      if (top <= 2.85) continue
      const seg = strut(m.cable, v(x, 2.7, z), v(x, top, z), 0.06)
      if (seg) g.add(seg)
    }
  }

  return flatten(g)
}

/** 🇰🇷 제주 — 돌하르방 */
const buildDolHareubang = () => {
  const g = new THREE.Group()
  const m = {
    rock: clay(COLOR.granite),
    rockDark: clay(COLOR.graniteDark),
    base: clay(COLOR.soil),
    grass: clay(COLOR.grass),
  }

  g.add(hill(m.grass, 2.4, 0.7, 2.4))
  g.add(at(cyl(m.base, 1.15, 1.35, 0.5, 12), 0, 0.45, 0))

  // 몸통 — 아래가 넓은 항아리 모양
  g.add(at(cyl(m.rock, 0.95, 1.2, 3.0, 12), 0, 2.2, 0))
  // 배 위에 얹은 두 손
  g.add(at(scaled(ball(m.rock, 0.34), 1, 0.85, 0.8), -0.55, 2.1, 0.85))
  g.add(at(scaled(ball(m.rock, 0.34), 1, 0.85, 0.8), 0.55, 1.85, 0.85))

  // 머리
  g.add(at(scaled(ball(m.rock, 1.0), 1, 1.05, 0.95), 0, 4.15, 0))
  // 벙거지 모자
  g.add(at(cyl(m.rock, 0.62, 0.98, 0.95, 12), 0, 5.25, 0))
  g.add(at(cyl(m.rockDark, 0.66, 0.66, 0.14, 12), 0, 5.75, 0))

  // 튀어나온 눈, 뭉툭한 코, 다문 입
  g.add(at(ball(m.rockDark, 0.24, 10), -0.38, 4.35, 0.82))
  g.add(at(ball(m.rockDark, 0.24, 10), 0.38, 4.35, 0.82))
  const nose = at(cone(m.rock, 0.26, 0.7, 10), 0, 3.95, 0.85)
  nose.rotation.x = Math.PI / 2
  g.add(nose)
  g.add(at(box(m.rockDark, 0.55, 0.13, 0.18), 0, 3.5, 0.86))

  return flatten(g)
}

/** 🇺🇸 뉴욕 — 자유의 여신상 */
const buildLibertyStatue = () => {
  const g = new THREE.Group()
  const m = {
    fort: clay(COLOR.stoneDark),
    pedestal: clay(0xa2947e),
    body: clay(COLOR.patina),
    flame: clay(COLOR.gold, { emissive: new THREE.Color(0xffb340).multiplyScalar(0.6) }),
  }

  // 별 모양 요새 기단 → 사각 페디스탈
  g.add(at(cyl(m.fort, 1.9, 2.2, 0.5, 8), 0, 0.25, 0))
  g.add(at(cyl(m.pedestal, 1.05, 1.35, 2.5, 4), 0, 1.75, 0))
  g.add(at(cyl(m.pedestal, 1.2, 1.2, 0.2, 4), 0, 3.1, 0))

  // 흘러내리는 로브
  g.add(at(cyl(m.body, 0.5, 1.05, 3.1, 12), 0, 4.65, 0))
  g.add(at(scaled(ball(m.body, 0.52), 1.2, 0.9, 1), 0, 6.2, 0))

  // 머리 + 왕관 뿔 7개
  g.add(at(scaled(ball(m.body, 0.42), 1, 1.1, 1), 0, 6.85, 0))
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * 0.5 + (i / 6) * Math.PI
    const spike = at(cone(m.body, 0.09, 0.55, 6), Math.sin(a) * 0.48, 7.25, Math.cos(a) * 0.48)
    spike.rotation.z = -Math.sin(a) * 0.55
    spike.rotation.x = Math.cos(a) * 0.55
    g.add(spike)
  }

  // 횃불을 든 오른팔
  g.add(strut(m.body, v(0.42, 6.1, 0), v(1.0, 8.1, -0.1), 0.24))
  g.add(at(cyl(m.body, 0.15, 0.2, 0.4, 8), 1.0, 8.3, -0.1))
  g.add(at(cone(m.flame, 0.28, 0.7, 8), 1.0, 8.8, -0.1))

  // 독립선언서를 안은 왼팔
  g.add(strut(m.body, v(-0.45, 6.05, 0), v(-0.7, 4.9, 0.45), 0.22))
  const book = at(box(m.body, 0.62, 0.22, 0.8), -0.72, 4.8, 0.5)
  book.rotation.x = -0.35
  g.add(book)

  return flatten(g)
}

/** 🇯🇵 도쿄 — 도쿄타워 (홍백 격자 철탑) */
const buildTokyoTower = () => {
  const g = new THREE.Group()
  const m = {
    red: clay(COLOR.red),
    white: clay(COLOR.cream),
    mast: clay(COLOR.concrete),
    base: clay(COLOR.stoneDark),
  }

  g.add(at(yaw(cyl(m.base, 1.9, 2.1, 0.35, 4), Math.PI / 4), 0, 0.17, 0))

  // 네 다리
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      g.add(strut(m.red, v(sx * 1.35, 0.2, sz * 1.35), v(sx * 0.36, 3.4, sz * 0.36), 0.24))
    }
  }
  // 다리 사이 가로대 (격자 느낌)
  for (const y of [1.2, 2.3]) {
    const t = (y - 0.2) / 3.2
    const r = 1.35 + (0.36 - 1.35) * t
    for (const sz of [-1, 1]) {
      g.add(at(box(m.red, r * 2, 0.13, 0.13), 0, y, sz * r))
      g.add(at(box(m.red, 0.13, 0.13, r * 2), sz * r, y, 0))
    }
  }

  // 대전망대
  g.add(at(box(m.white, 1.85, 0.62, 1.85), 0, 3.6, 0))
  g.add(at(box(m.red, 1.95, 0.16, 1.95), 0, 3.95, 0))

  // 상부 철탑 (홍백 교대)
  g.add(at(yaw(cyl(m.red, 0.34, 0.44, 1.1, 4), Math.PI / 4), 0, 4.5, 0))
  g.add(at(yaw(cyl(m.white, 0.26, 0.34, 0.9, 4), Math.PI / 4), 0, 5.5, 0))
  g.add(at(yaw(cyl(m.red, 0.2, 0.26, 0.9, 4), Math.PI / 4), 0, 6.4, 0))

  // 특별전망대 + 안테나
  g.add(at(box(m.white, 0.8, 0.4, 0.8), 0, 6.05, 0))
  g.add(at(cyl(m.mast, 0.04, 0.13, 1.8, 6), 0, 7.75, 0))

  return flatten(g)
}

/** 🇬🇧 런던 — 타워브리지 */
const buildTowerBridge = () => {
  const g = new THREE.Group()
  const m = {
    stone: clay(COLOR.stone),
    stoneDark: clay(COLOR.stoneDark),
    roof: clay(COLOR.slate),
    deck: clay(0x6b7686),
    cable: clay(0x8e5f3c),
    water: clay(0x2f6fa8, { transparent: true, opacity: 0.75 }),
  }

  g.add(at(scaled(cyl(m.water, 1, 1, 0.25, 24), 6.2, 1, 3.4), 0, 0.12, 0))

  // 상판 (중앙 도개교 + 좌우 진입로)
  g.add(at(box(m.deck, 3.6, 0.3, 1.6), 0, 1.7, 0))
  for (const x of [-4.2, 4.2]) g.add(at(box(m.deck, 3.4, 0.3, 1.6), x, 1.7, 0))

  // 양끝 교대
  for (const x of [-6.0, 6.0]) g.add(at(box(m.stoneDark, 1.1, 1.8, 1.8), x, 0.9, 0))

  // 고딕 타워 2기
  for (const x of [-2.5, 2.5]) {
    g.add(at(box(m.stoneDark, 1.7, 1.9, 1.9), x, 0.95, 0))
    g.add(at(box(m.stone, 1.25, 3.3, 1.25), x, 3.4, 0))
    // 모서리 터렛
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        g.add(at(cyl(m.stone, 0.19, 0.19, 3.6, 8), x + sx * 0.62, 3.5, sz * 0.62))
        g.add(at(cone(m.roof, 0.26, 0.5, 8), x + sx * 0.62, 5.55, sz * 0.62))
      }
    }
    g.add(at(box(m.stone, 1.5, 0.2, 1.5), x, 5.15, 0))
    g.add(at(yaw(cone(m.roof, 1.0, 1.5, 4), Math.PI / 4), x, 6.0, 0))
    g.add(at(cone(m.roof, 0.1, 0.7, 6), x, 7.1, 0))
  }

  // 두 타워를 잇는 상부 보행 통로
  g.add(at(box(m.stone, 5.0, 0.55, 1.3), 0, 4.5, 0))
  g.add(at(box(m.roof, 5.2, 0.18, 1.45), 0, 4.85, 0))

  // 측경간 현수 케이블
  for (const s of [-1, 1]) {
    for (const z of [-0.7, 0.7]) {
      g.add(strut(m.cable, v(s * 2.5, 4.1, z), v(s * 4.2, 2.6, z), 0.12))
      g.add(strut(m.cable, v(s * 4.2, 2.6, z), v(s * 6.0, 1.9, z), 0.12))
    }
  }

  return flatten(g)
}

/** 🇫🇷 파리 — 에펠탑 */
const buildEiffelTower = () => {
  const g = new THREE.Group()
  const m = {
    iron: clay(COLOR.bronze),
    ironDark: clay(0x8d6437),
    lawn: clay(COLOR.grass),
    mast: clay(0xd9c39c),
  }

  g.add(hill(m.lawn, 1.9, 0.3, 1.9))

  /*
   * 에펠탑은 밑이 넓고 위로 갈수록 급격히 가늘어지는 게 특징입니다.
   * 밑동을 너무 벌리면 위에서 내려다볼 때 그냥 사각 상자로 보이므로,
   * 높이 대 밑변 비율을 실제 탑처럼 4:1 가까이 잡았습니다.
   */
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      g.add(strut(m.iron, v(sx * 1.15, 0, sz * 1.15), v(sx * 0.34, 2.9, sz * 0.34), 0.26))
    }
  }
  // 다리 사이 아치 (에펠탑의 상징)
  for (const s of [-1, 1]) {
    const archZ = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.1, 6, 14, Math.PI), m.ironDark)
    archZ.position.set(0, 0.3, s * 1.15)
    g.add(archZ)

    const archX = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.1, 6, 14, Math.PI), m.ironDark)
    archX.position.set(s * 1.15, 0.3, 0)
    archX.rotation.y = Math.PI / 2
    g.add(archX)
  }

  // 1층 → 2층 → 3층으로 좁아지는 사각 철탑
  g.add(at(box(m.ironDark, 2.3, 0.2, 2.3), 0, 3.0, 0))
  g.add(at(yaw(cyl(m.iron, 0.28, 0.62, 2.6, 4), Math.PI / 4), 0, 4.35, 0))
  g.add(at(box(m.ironDark, 1.25, 0.18, 1.25), 0, 5.7, 0))
  g.add(at(yaw(cyl(m.iron, 0.1, 0.26, 2.8, 4), Math.PI / 4), 0, 7.15, 0))
  g.add(at(box(m.ironDark, 0.6, 0.5, 0.6), 0, 8.75, 0))
  g.add(at(cyl(m.mast, 0.03, 0.08, 1.5, 6), 0, 9.7, 0))

  return flatten(g)
}

/**
 * 🇨🇳 베이징 — 만리장성
 *
 * 요구사항: "조금 더 긴 것으로 교체".
 * 망루 하나짜리 그림 대신, 능선을 따라 굽이치며 화면을 가로지르는
 * **약 20단위 길이의 성벽**으로 만들었습니다.
 * 성벽은 짧은 구간을 이어 붙여 만들고, 구간마다 통로·성가퀴를 얹습니다.
 */
const buildGreatWall = () => {
  const g = new THREE.Group()
  const m = {
    wall: clay(COLOR.stone),
    wallDark: clay(COLOR.stoneDark),
    path: clay(0xa89370),
    roof: clay(COLOR.roofTile),
    ridge: clay(0x6b8f56),
    ridgeDry: clay(0x8f8055),
  }

  const SPAN = 20 // 성벽 전체 길이
  const STEPS = 26 // 구간 수 (많을수록 곡선이 부드러움)

  // 능선 경로 — 좌우로 굽이치고(z), 오르내립니다(y)
  const pathAt = (t) => {
    const x = -SPAN / 2 + SPAN * t
    const z = Math.sin(t * Math.PI * 2.3) * 2.0 + Math.sin(t * Math.PI * 5.1) * 0.4
    const y = 0.7 + Math.sin(t * Math.PI * 3.1 + 0.6) * 0.5 + Math.cos(t * Math.PI * 1.4) * 0.3
    return v(x, y, z)
  }

  const points = []
  for (let i = 0; i <= STEPS; i++) points.push(pathAt(i / STEPS))

  // 성벽이 올라앉을 산등성이
  for (let i = 0; i <= 8; i++) {
    const p = pathAt(i / 8)
    const mat = i % 3 === 0 ? m.ridgeDry : m.ridge
    g.add(hill(mat, 2.0 + (i % 3) * 0.4, p.y + 0.75, 1.9 + (i % 2) * 0.5, p.x, p.z))
  }

  // 성벽 본체
  const WIDTH = 1.15
  const HEIGHT = 1.25
  for (let i = 0; i < STEPS; i++) {
    const a = points[i]
    const b = points[i + 1]
    const dx = b.x - a.x
    const dz = b.z - a.z
    const len = Math.hypot(dx, dz)
    const topY = (a.y + b.y) / 2 + HEIGHT

    const seg = new THREE.Group()
    seg.position.set((a.x + b.x) / 2, 0, (a.z + b.z) / 2)
    seg.rotation.y = Math.atan2(-dz, dx)

    // 바닥까지 내려 언덕에 파묻히게 하면 이음매가 벌어지지 않습니다
    seg.add(at(box(m.wall, len * 1.08, topY, WIDTH), 0, topY / 2, 0))
    seg.add(at(box(m.path, len * 1.08, 0.12, WIDTH * 0.72), 0, topY + 0.06, 0))

    // 성가퀴(총안) — 바깥쪽은 높게, 안쪽은 낮게
    for (let k = 0; k < 2; k++) {
      const px = ((k + 0.5) / 2) * len - len / 2
      seg.add(
        at(box(m.wallDark, (len / 2) * 0.5, 0.36, WIDTH * 0.18), px, topY + 0.18, WIDTH * 0.4),
      )
      seg.add(
        at(box(m.wallDark, (len / 2) * 0.5, 0.22, WIDTH * 0.18), px, topY + 0.11, -WIDTH * 0.4),
      )
    }
    g.add(seg)
  }

  // 일정 간격마다 망루
  for (const t of [0.08, 0.34, 0.62, 0.9]) {
    const p = pathAt(t)
    const tower = new THREE.Group()
    tower.position.set(p.x, 0, p.z)

    const bodyTop = p.y + 2.1
    tower.add(at(box(m.wall, 1.7, bodyTop, 1.7), 0, bodyTop / 2, 0))
    tower.add(at(box(m.path, 1.95, 0.16, 1.95), 0, bodyTop + 0.08, 0))
    // 난간
    for (const s of [-1, 1]) {
      tower.add(at(box(m.wallDark, 1.95, 0.3, 0.16), 0, bodyTop + 0.3, s * 0.9))
      tower.add(at(box(m.wallDark, 0.16, 0.3, 1.95), s * 0.9, bodyTop + 0.3, 0))
    }
    // 2층 + 기와 지붕
    tower.add(at(box(m.wall, 1.15, 1.0, 1.15), 0, bodyTop + 0.65, 0))
    tower.add(at(yaw(cone(m.roof, 1.15, 0.75, 4), Math.PI / 4), 0, bodyTop + 1.5, 0))
    g.add(tower)
  }

  return flatten(g)
}

/** 🇷🇺 모스크바 — 크렘린 / 성 바실리 대성당의 양파 돔 */
const buildKremlin = () => {
  const g = new THREE.Group()
  const m = {
    wall: clay(0xb4503f),
    stone: clay(0xe4d8c2),
    roof: clay(0x3f7d5f),
    gold: clay(COLOR.gold, { emissive: new THREE.Color(0xffcc55).multiplyScalar(0.35) }),
    blue: clay(0x3f6fb5),
    green: clay(0x4fa07a),
    snow: clay(0xe8eef5),
  }

  /** 양파 돔 — 회전체(LatheGeometry)로 부드러운 곡면을 만듭니다 */
  const onionDome = (mat, radius, height) => {
    const profile = []
    const STEPS = 12
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS
      // 아래는 살짝 오므라들고 → 가운데가 부풀고 → 끝은 뾰족
      const r = radius * Math.sin(Math.PI * (0.26 + 0.74 * t))
      profile.push(new THREE.Vector2(Math.max(r, 0.001), height * Math.pow(t, 1.2)))
    }
    return new THREE.Mesh(new THREE.LatheGeometry(profile, 14), mat)
  }

  g.add(hill(m.snow, 3.6, 0.4, 2.8))

  // 붉은 성벽
  g.add(at(box(m.wall, 6.4, 1.3, 3.2), 0, 0.65, 0))
  for (let i = 0; i < 9; i++) {
    g.add(at(box(m.wall, 0.4, 0.35, 0.22), -2.9 + i * 0.72, 1.45, 1.5))
  }

  // 중앙 시계탑 (스파스카야 탑)
  g.add(at(box(m.wall, 1.2, 3.2, 1.2), 0, 2.9, -0.3))
  g.add(at(box(m.stone, 1.45, 0.22, 1.45), 0, 4.6, -0.3))
  g.add(at(yaw(cone(m.roof, 0.95, 1.9, 4), Math.PI / 4), 0, 5.6, -0.3))
  g.add(at(new THREE.Mesh(new THREE.OctahedronGeometry(0.22), m.gold), 0, 6.75, -0.3))

  // 성 바실리풍 양파 돔 탑 4기
  const domes = [
    { x: -2.2, z: 0.6, h: 2.4, r: 0.62, mat: m.blue },
    { x: -0.9, z: 1.0, h: 1.9, r: 0.5, mat: m.gold },
    { x: 1.1, z: 1.0, h: 2.1, r: 0.55, mat: m.green },
    { x: 2.4, z: 0.5, h: 2.6, r: 0.66, mat: m.gold },
  ]
  for (const d of domes) {
    g.add(at(cyl(m.stone, d.r * 0.8, d.r * 0.92, d.h, 12), d.x, 1.3 + d.h / 2, d.z))
    const top = 1.3 + d.h
    const dome = at(onionDome(d.mat, d.r, d.r * 1.9), d.x, top, d.z)
    g.add(dome)
    g.add(at(cyl(m.gold, 0.03, 0.05, 0.5, 6), d.x, top + d.r * 1.9 + 0.25, d.z))
    g.add(at(box(m.gold, 0.28, 0.06, 0.06), d.x, top + d.r * 1.9 + 0.35, d.z))
  }

  return flatten(g)
}

/** 🇪🇸 마드리드 — 사그라다 파밀리아 */
const buildSagradaFamilia = () => {
  const g = new THREE.Group()
  const m = {
    stone: clay(0xdcc7a4),
    stoneDark: clay(0xc0a883),
    tip: clay(COLOR.gold, { emissive: new THREE.Color(0xffcc55).multiplyScalar(0.3) }),
    tipRed: clay(0xd9614b),
    tipBlue: clay(0x5b8fd6),
  }

  /*
   * 사그라다 파밀리아는 본당보다 **숲처럼 솟은 첨탑들**이 인상을 결정합니다.
   * 본당을 크게 잡으면 위에서 볼 때 그냥 상자로 보여서, 본당은 낮게 깔고
   * 첨탑을 길게 뽑았습니다.
   */
  g.add(at(box(m.stone, 2.6, 1.8, 2.0), 0, 0.9, 0))
  g.add(at(box(m.stoneDark, 2.9, 0.22, 2.3), 0, 1.9, 0))
  // 정면 아치 3개
  for (const x of [-0.8, 0, 0.8]) {
    const arch = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.09, 6, 12, Math.PI), m.stoneDark)
    arch.position.set(x, 0.75, 1.02)
    g.add(arch)
  }

  // 옥수수 모양 첨탑들 — 높이를 다르게 두면 실루엣이 살아납니다
  const spires = [
    { x: -1.0, z: -0.7, h: 5.4, tip: m.tipRed },
    { x: -0.38, z: -0.78, h: 6.6, tip: m.tip },
    { x: 0.38, z: -0.78, h: 6.1, tip: m.tipBlue },
    { x: 1.0, z: -0.7, h: 5.0, tip: m.tipRed },
    { x: -0.95, z: 0.7, h: 4.6, tip: m.tipBlue },
    { x: 0.95, z: 0.7, h: 4.9, tip: m.tip },
  ]
  for (const s of spires) {
    g.add(at(cyl(m.stone, 0.1, 0.32, s.h, 8), s.x, 1.9 + s.h / 2, s.z))
    g.add(at(cone(s.tip, 0.15, 0.55, 8), s.x, 1.9 + s.h + 0.27, s.z))
  }

  // 중앙 예수 탑 (가장 높음) + 십자가
  g.add(at(cyl(m.stone, 0.22, 0.62, 7.4, 10), 0, 1.9 + 3.7, 0.1))
  g.add(at(cone(m.stone, 0.26, 0.9, 10), 0, 9.75, 0.1))
  g.add(at(box(m.tip, 0.09, 1.0, 0.09), 0, 10.6, 0.1))
  g.add(at(box(m.tip, 0.5, 0.09, 0.09), 0, 10.75, 0.1))

  return flatten(g)
}

/** 🇺🇸 로스앤젤레스 — 할리우드 사인 */
const buildHollywoodSign = () => {
  const g = new THREE.Group()
  const m = {
    hill: clay(COLOR.dryHill),
    scrub: clay(0x7c7a45),
    post: clay(0xe9e6dc),
  }

  g.add(hill(m.hill, 5.2, 1.7, 3.0))
  g.add(hill(m.scrub, 2.2, 0.9, 1.6, -3.2, 1.0))
  g.add(hill(m.scrub, 1.8, 0.7, 1.4, 3.4, 1.2))

  // 글자판 — 캔버스에 글자를 그리고 투명한 틈으로 글자 사이를 띄웁니다
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#f7f5ee'
  ctx.font = 'bold 190px Helvetica, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const letters = [...'HOLLYWOOD']
  const cell = canvas.width / letters.length
  letters.forEach((ch, i) => ctx.fillText(ch, cell * (i + 0.5), canvas.height / 2 + 6))

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const signMat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.4,
    side: THREE.DoubleSide,
  })

  /*
   * 글자판을 언덕 위로 넉넉히 띄웁니다.
   * 마커 받침 링이 도시 좌표(높이 0) 위에 그려지므로, 글자가 낮게 붙어 있으면
   * 링이 글자를 가로질러 읽기 어려워집니다.
   */
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(7.0, 1.75), signMat)
  sign.position.set(0, 2.9, 0.5)
  sign.rotation.x = -0.14
  g.add(sign)

  // 글자를 받치는 기둥
  for (let i = 0; i < 9; i++) {
    g.add(at(box(m.post, 0.09, 2.0, 0.09), -3.1 + i * 0.78, 1.5, 0.42))
  }

  return flatten(g)
}

// ────────────────────────────────────────────────────
// 등록부
// ────────────────────────────────────────────────────

const BUILDERS = {
  seoulTower: buildSeoulTower,
  gwanganBridge: buildGwanganBridge,
  dolHareubang: buildDolHareubang,
  libertyStatue: buildLibertyStatue,
  tokyoTower: buildTokyoTower,
  towerBridge: buildTowerBridge,
  eiffelTower: buildEiffelTower,
  greatWall: buildGreatWall,
  kremlin: buildKremlin,
  sagradaFamilia: buildSagradaFamilia,
  hollywoodSign: buildHollywoodSign,
}

/** 만들 수 있는 모형인지 확인 */
export const hasLandmarkModel = (modelKey) => Boolean(BUILDERS[modelKey])

/**
 * 지구본에 세울 랜드마크 모형을 만듭니다.
 *
 * @param {string} modelKey  BUILDERS 의 키
 * @param {object} options
 * @param {number} options.scale    전체 크기 배율 (기본 1)
 * @param {number} options.heading  지면 위에서의 방위 회전(도). 0 이면 +X 가 동쪽
 * @param {boolean} options.upright true 면 모형의 +Y 를 그대로 위로 둡니다
 *                                  (지구본에 세울 때는 false — three-globe 가 +Z 를 하늘로 봅니다)
 * @returns {THREE.Group|null}
 */
export const buildLandmarkModel = (modelKey, { scale = 1, heading = 0, upright = false } = {}) => {
  const build = BUILDERS[modelKey]
  if (!build) return null

  const model = build()
  model.rotation.y = (heading * Math.PI) / 180

  const holder = new THREE.Group()
  holder.add(model)
  holder.scale.setScalar(scale)
  // three-globe 의 objects 레이어는 +Z 를 지표면 바깥(하늘)으로 세우므로
  // Y축이 하늘이던 모형을 90° 눕혀 방향을 맞춥니다.
  if (!upright) holder.rotation.x = Math.PI / 2

  return holder
}

/** 모형이 쓰던 지오메트리·재질·텍스처를 모두 정리합니다 */
export const disposeLandmarkModel = (object) => {
  if (!object) return
  object.traverse((o) => {
    if (!o.isMesh) return
    o.geometry?.dispose()
    const materials = Array.isArray(o.material) ? o.material : [o.material]
    for (const mat of materials) {
      mat?.map?.dispose()
      mat?.dispose()
    }
  })
  object.parent?.remove(object)
}

/**
 * 🏛️ 도시별 랜드마크 데이터
 *
 * 각 도시의 클레이 스타일 3D 랜드마크 이미지 매핑.
 * 이미지는 public/images/landmarks/ 에 위치하며,
 * Three.js objectsData 레이어를 통해 지구본 표면 위에 3D 스프라이트로 렌더링됩니다.
 */

const BASE = import.meta.env.BASE_URL + 'images/landmarks/'

export const LANDMARKS = {
  city_01: {
    name: 'N서울타워',
    nameEn: 'N Seoul Tower',
    image: `${BASE}seoul.jpg`,
  },
  city_07: {
    name: '광안대교',
    nameEn: 'Gwangan Bridge',
    image: `${BASE}busan.jpg`,
  },
  city_08: {
    name: '돌하르방',
    nameEn: 'Dol Hareubang',
    image: `${BASE}jeju.jpg`,
  },
  city_09: {
    name: '자유의 여신상',
    nameEn: 'Statue of Liberty',
    image: `${BASE}newyork.jpg`,
  },
  city_10: {
    name: '도쿄 타워',
    nameEn: 'Tokyo Tower',
    image: `${BASE}tokyo.jpg`,
  },
  city_11: {
    name: '타워 브릿지',
    nameEn: 'Tower Bridge',
    image: `${BASE}london.jpg`,
  },
  city_12: {
    name: '에펠탑',
    nameEn: 'Eiffel Tower',
    image: `${BASE}paris.jpg`,
  },
  city_13: {
    name: '만리장성',
    nameEn: 'Great Wall',
    image: `${BASE}beijing.jpg`,
  },
  city_14: {
    name: '크렘린궁',
    nameEn: 'Kremlin',
    image: null, // 모스크바 — 이미지 없음
  },
  city_15: {
    name: '사그라다 파밀리아',
    nameEn: 'Sagrada Familia',
    image: `${BASE}madrid.jpg`,
  },
  city_16: {
    name: '할리우드 사인',
    nameEn: 'Hollywood Sign',
    image: `${BASE}la.jpg`,
  },
}

/** 도시 ID 로 랜드마크 조회 (없으면 null) */
export const getLandmark = (cityId) => LANDMARKS[cityId] ?? null

/** 이미지가 있는 랜드마크만 배열로 반환 */
export const getAllLandmarks = () =>
  Object.entries(LANDMARKS)
    .filter(([, v]) => v.image)
    .map(([id, v]) => ({ id, ...v }))

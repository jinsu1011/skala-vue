import { hasLandmarkModel } from '@/three/landmarkModels'

/**
 * 🏛️ 도시별 랜드마크 데이터
 *
 * 예전에는 클레이 스타일 **이미지**를 마커 위에 띄웠지만,
 * 그림은 지구본을 돌려도 늘 정면을 보고 있어서 공중에 뜬 스티커처럼 보였습니다.
 * 지금은 `model` 키로 3D 모형을 지정하고, three.js 로 만든 입체 모형을
 * 지구 표면의 실제 좌표에 세웁니다. (모형 정의는 @/three/landmarkModels)
 *
 * - model   : 랜드마크 모형 종류
 * - scale   : 도시별 크기 배율 (기본 1). 지구본에서 서로 비슷해 보이도록 미세 조정
 * - heading : 지면 위에서의 방위 회전(도). 0 이면 모형의 +X 축이 동쪽을 향합니다
 */

export const LANDMARKS = {
  city_01: {
    name: 'N서울타워',
    nameEn: 'N Seoul Tower',
    model: 'seoulTower',
    scale: 0.55,
  },
  city_07: {
    name: '광안대교',
    nameEn: 'Gwangan Bridge',
    model: 'gwanganBridge',
    scale: 0.42,
    heading: 25,
  },
  city_08: {
    name: '돌하르방',
    nameEn: 'Dol Hareubang',
    model: 'dolHareubang',
    // 돌하르방은 원래 사람 키만 해서, 다른 랜드마크와 나란히 보이도록 크게 키웁니다
    scale: 0.7,
  },
  city_09: {
    name: '자유의 여신상',
    nameEn: 'Statue of Liberty',
    model: 'libertyStatue',
    scale: 0.5,
  },
  city_10: {
    name: '도쿄 타워',
    nameEn: 'Tokyo Tower',
    model: 'tokyoTower',
    scale: 0.55,
  },
  city_11: {
    name: '타워 브릿지',
    nameEn: 'Tower Bridge',
    model: 'towerBridge',
    scale: 0.5,
  },
  city_12: {
    name: '에펠탑',
    nameEn: 'Eiffel Tower',
    model: 'eiffelTower',
    scale: 0.55,
  },
  city_13: {
    name: '만리장성',
    nameEn: 'Great Wall',
    model: 'greatWall',
    // 성벽이 길어야 만리장성답기 때문에 다른 랜드마크보다 크게 둡니다
    scale: 0.45,
    heading: -18,
  },
  city_14: {
    name: '크렘린궁',
    nameEn: 'Kremlin',
    model: 'kremlin',
    scale: 0.5,
  },
  city_15: {
    name: '사그라다 파밀리아',
    nameEn: 'Sagrada Familia',
    model: 'sagradaFamilia',
    scale: 0.48,
  },
  city_16: {
    name: '할리우드 사인',
    nameEn: 'Hollywood Sign',
    model: 'hollywoodSign',
    scale: 0.5,
  },
}

/** 도시 ID 로 랜드마크 조회 (없으면 null) */
export const getLandmark = (cityId) => LANDMARKS[cityId] ?? null

/** 해당 도시에 세울 3D 모형이 준비돼 있는지 */
export const hasLandmark = (cityId) => hasLandmarkModel(LANDMARKS[cityId]?.model)

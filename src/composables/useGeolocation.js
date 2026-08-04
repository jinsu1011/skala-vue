import { ref } from 'vue'
import { CITIES } from '@/api/weatherApi'

/**
 * 📍 Haversine 공식 (두 위도/경도 좌표 간 대권 거리 km 계산)
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // 지구 반지름 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * 📍 useGeolocation Composable
 */
export function useGeolocation() {
  const geoState = ref('idle') // 'idle' | 'requesting' | 'denied'
  const errorMessage = ref('')

  /**
   * 사용자 위치 탐색 및 가장 가까운 도시 구하기
   * @returns {Promise<string|null>} 선택된 최단거리 도시 ID 또는 null
   */
  const getCurrentNearestCity = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        geoState.value = 'denied'
        errorMessage.value = '이 브라우저는 위치 서비스를 지원하지 않습니다.'
        resolve(null)
        return
      }

      geoState.value = 'requesting'
      errorMessage.value = ''

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude
          const userLon = position.coords.longitude

          // 12개 도시 중 최단 거리 도시 찾기
          let nearestCity = CITIES[0]
          let minDistance = Infinity

          CITIES.forEach((city) => {
            const dist = calculateHaversineDistance(userLat, userLon, city.lat, city.lon)
            if (dist < minDistance) {
              minDistance = dist
              nearestCity = city
            }
          })

          geoState.value = 'idle'
          resolve(nearestCity.id)
        },
        (error) => {
          geoState.value = 'denied'
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage.value = '위치 권한이 거부되었습니다. 검색창에서 도시를 직접 선택해 주세요.'
          } else if (error.code === error.TIMEOUT) {
            errorMessage.value = '위치 요청 시간이 초과되었습니다. 다시 시도해 주세요.'
          } else {
            errorMessage.value = '위치 정보를 가져올 수 없습니다.'
          }
          resolve(null)
        },
        { timeout: 8000, enableHighAccuracy: false },
      )
    })
  }

  return {
    geoState,
    errorMessage,
    getCurrentNearestCity,
  }
}

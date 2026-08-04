<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  city: {
    type: Object,
    required: true,
  },
  weather: {
    type: Object,
    default: null,
  },
})

const mapContainer = ref(null)
// 지도 타일(배경 이미지)을 못 받아왔는지 여부
const tileError = ref(false)
let mapInstance = null
let markerInstance = null

const initMap = () => {
  if (!mapContainer.value || !props.city) return

  // 이전 지도 인스턴스가 존재하면 정리
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }

  const { lat, lon } = props.city

  // Leaflet 지도 인스턴스 생성
  mapInstance = L.map(mapContainer.value, {
    center: [lat, lon],
    zoom: 11,
    zoomControl: false,
    attributionControl: false,
  })

  /*
   * OpenStreetMap 타일 레이어 추가
   *
   * 타일은 외부 서버에서 받아오는 이미지라 네트워크가 느리거나 막히면 실패합니다.
   * 그때 아무 안내가 없으면 지도가 '회색 네모'로 남아 고장 난 것처럼 보이므로,
   * 실패를 감지해 안내 문구를 띄우고 배경색이라도 보이게 합니다.
   */
  tileError.value = false
  const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
    // 타일을 못 받았을 때 깨진 이미지 아이콘 대신 투명 픽셀을 씁니다
    errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  })

  tileLayer.on('tileerror', () => {
    tileError.value = true
  })
  tileLayer.on('load', () => {
    tileError.value = false
  })

  tileLayer.addTo(mapInstance)

  // 커스텀 날씨 아이콘 마커
  const weatherIcon = L.divIcon({
    className: 'leaflet-custom-weather-icon',
    html: `
      <div class="map-weather-pin">
        <span class="pin-icon">${props.weather?.icon || '📍'}</span>
        <span class="pin-temp">${props.weather ? Math.round(props.weather.temp) + '°' : ''}</span>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  })

  markerInstance = L.marker([lat, lon], { icon: weatherIcon }).addTo(mapInstance)

  // 컨테이너 크기 재계산 (회색 렌더링 방지)
  nextTick(() => {
    if (mapInstance) {
      mapInstance.invalidateSize()
    }
  })
}

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
})

// 도시나 날씨 데이터 변경 시 지도 위치/마커 이동
watch(
  () => [props.city?.id, props.weather?.temp],
  () => {
    if (props.city && mapInstance) {
      mapInstance.setView([props.city.lat, props.city.lon], 11)
      if (markerInstance) {
        markerInstance.setLatLng([props.city.lat, props.city.lon])
      }
    } else {
      initMap()
    }
  },
)
</script>

<template>
  <div class="mini-map-card">
    <div class="map-header">
      <span class="map-title">📍 위치 및 커스텀 마커 지도</span>
      <span class="map-coord">{{ city.lat.toFixed(2) }}°, {{ city.lon.toFixed(2) }}°</span>
    </div>
    <!-- 반드시 명시적인 높이를 지정해야 Leaflet 지도가 렌더링됨 -->
    <div ref="mapContainer" class="leaflet-container-box"></div>

    <!-- 타일 서버 연결 실패 시 안내 (마커와 좌표는 그대로 보입니다) -->
    <p v-if="tileError" class="map-tile-error">
      ⚠️ 지도 배경 이미지를 불러오지 못했습니다 (네트워크 확인)
    </p>
  </div>
</template>

<style scoped>
.map-tile-error {
  padding: 8px 12px;
  font-size: 11px;
  color: #fbbf24;
  text-align: center;
}
</style>

<style>
/* Leaflet 커스텀 마커 전역 스타일 */
.leaflet-custom-weather-icon {
  background: transparent;
  border: none;
}

.map-weather-pin {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(10px);
  border: 1.5px solid #38bdf8;
  border-radius: 20px;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
  white-space: nowrap;
}

.pin-icon {
  font-size: 16px;
}

.pin-temp {
  color: #38bdf8;
}
</style>

<style scoped>
.mini-map-card {
  position: relative;
  width: 100%;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 12px 30px rgba(10, 40, 90, 0.28);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.map-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: rgba(15, 23, 42, 0.4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #f8fafc;
}

.map-title {
  font-size: 14px;
  font-weight: 600;
}

.map-coord {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.leaflet-container-box {
  width: 100%;
  height: 260px; /* 명시적 높이 필수 */
  z-index: 1;
}
</style>

import { onUnmounted } from 'vue'

/**
 * 🌧️❄️☀️ useWeatherEffect Composable
 *
 * Canvas API와 하나의 requestAnimationFrame 루프를 사용해
 * 날씨 그룹(rain, snow, clear, cloud, fog, storm)에 적합한 시각적 효과를 그립니다.
 */
export function useWeatherEffect() {
  let animId = null
  let canvas = null
  let ctx = null
  let particles = []
  let flashOpacity = 0
  let nextLightningTime = 0
  let isReducedMotion = false

  // 현재 그리고 있는 효과 (탭 복귀 시 그대로 이어 그리기 위해 기억해 둡니다)
  let currentGroup = 'clear'
  let currentIsDay = true
  let visibilityHandler = null

  // 화면 접근성 모션 줄이기 검사
  if (typeof window !== 'undefined') {
    isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  /**
   * 파티클 객체 초기화
   */
  const createParticles = (group, precipitation = 0, isDay = true) => {
    particles = []
    const width = canvas.width
    const height = canvas.height

    if (group === 'rain' || group === 'storm') {
      // 강수량과 강수확률에 따라 빗줄기 개수 결정 (최대 400개)
      const count = Math.min(400, Math.max(100, Math.floor((precipitation || 2) * 40)))
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          length: Math.random() * 20 + 15,
          speed: Math.random() * 12 + 15,
          opacity: Math.random() * 0.5 + 0.3,
          splashes: [],
        })
      }
    } else if (group === 'snow') {
      // 눈송이 3단계 원근감 (최대 200개)
      const count = 180
      for (let i = 0; i < count; i++) {
        const radius = Math.random() * 3.5 + 1
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius,
          speed: Math.random() * 1.5 + 0.5,
          swing: Math.random() * 0.05,
          swingAngle: Math.random() * Math.PI * 2,
          opacity: Math.random() * 0.7 + 0.3,
        })
      }
    } else if (group === 'clear' && !isDay) {
      // 밤인 경우 반짝이는 별 (100개)
      const count = 100
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * (height * 0.7),
          radius: Math.random() * 1.5 + 0.5,
          alpha: Math.random(),
          speed: Math.random() * 0.02 + 0.005,
        })
      }
    } else if (group === 'cloud') {
      // 구름 덩어리 6개
      for (let i = 0; i < 6; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * (height * 0.4),
          radius: Math.random() * 150 + 100,
          speed: Math.random() * 0.3 + 0.1,
          opacity: Math.random() * 0.15 + 0.08,
        })
      }
    }
  }

  /**
   * 메인 렌더링 루프
   */
  const render = (group, isDay) => {
    if (!ctx || !canvas) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const width = canvas.width
    const height = canvas.height

    // 1. 비 / 뇌우 효과
    if (group === 'rain' || group === 'storm') {
      ctx.strokeStyle = 'rgba(180, 220, 255, 0.6)'
      ctx.lineWidth = 1.2
      ctx.beginPath()

      particles.forEach((p) => {
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p.x - 3, p.y + p.length)

        p.y += p.speed
        p.x -= 0.6

        if (p.y > height) {
          p.y = -p.length
          p.x = Math.random() * width
        }
      })
      ctx.stroke()

      // 뇌우 시 2~5초 간격으로 번개 플래시 효과
      if (group === 'storm') {
        const now = Date.now()
        if (now > nextLightningTime) {
          flashOpacity = 0.85
          nextLightningTime = now + Math.random() * 3000 + 2000
        }

        if (flashOpacity > 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`
          ctx.fillRect(0, 0, width, height)
          flashOpacity -= 0.08
        }
      }
    }

    // 2. 눈 효과
    else if (group === 'snow') {
      ctx.fillStyle = '#ffffff'
      particles.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.globalAlpha = p.opacity
        ctx.fill()

        p.y += p.speed
        p.swingAngle += p.swing
        p.x += Math.sin(p.swingAngle) * 0.5

        if (p.y > height) {
          p.y = -p.radius
          p.x = Math.random() * width
        }
      })
      ctx.globalAlpha = 1
    }

    // 3. 맑음 (낮: 태양 광선 / 밤: 별 반짝임)
    else if (group === 'clear') {
      if (isDay) {
        // 햇살 God Ray 대각선 그라데이션
        const grad = ctx.createLinearGradient(width * 0.8, 0, width * 0.2, height)
        grad.addColorStop(0, 'rgba(254, 240, 138, 0.25)')
        grad.addColorStop(0.5, 'rgba(253, 224, 71, 0.08)')
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, width, height)

        /*
         * ⚡ 낮의 햇살은 '움직이지 않는 그림'입니다.
         * 그런데 예전에는 이 화면 전체 그라데이션을 1초에 60번 다시 칠했습니다.
         * 결과가 매번 똑같으므로 한 번만 그리고 루프를 끝냅니다.
         */
        return
      } else {
        // 별 반짝임
        ctx.fillStyle = '#ffffff'
        particles.forEach((p) => {
          p.alpha += p.speed
          if (p.alpha > 1 || p.alpha < 0.2) p.speed = -p.speed

          ctx.beginPath()
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
          ctx.globalAlpha = Math.max(0.1, Math.min(1, p.alpha))
          ctx.fill()
        })
        ctx.globalAlpha = 1
      }
    }

    // 4. 흐림 효과
    else if (group === 'cloud') {
      ctx.fillStyle = 'rgba(200, 215, 230, 0.2)'
      particles.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.globalAlpha = p.opacity
        ctx.fill()

        p.x += p.speed
        if (p.x - p.radius > width) {
          p.x = -p.radius
        }
      })
      ctx.globalAlpha = 1
    }

    // 탭이 활성화된 동안에만 루프 계속 실행 (성능 최적화)
    if (!document.hidden && !isReducedMotion) {
      animId = requestAnimationFrame(loop)
    }
  }

  // 매 프레임 새 함수를 만들지 않도록 루프용 함수를 한 번만 만들어 재사용합니다
  const loop = () => render(currentGroup, currentIsDay)

  /**
   * 효과 시작
   */
  const startEffect = (canvasEl, group = 'clear', precipitation = 0, isDay = true) => {
    stopEffect()
    if (!canvasEl || isReducedMotion) return

    canvas = canvasEl
    ctx = canvas.getContext('2d')
    currentGroup = group
    currentIsDay = isDay

    // 캔버스 해상도 맞추기
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    /*
     * 🐞 예전 버그 수정:
     * 렌더 루프는 document.hidden 이면 스스로 멈추는데,
     * 정작 탭으로 **돌아왔을 때 다시 켜주는 코드가 없었습니다.**
     * 그래서 다른 탭에 다녀오면 비/눈 효과가 영영 사라졌습니다.
     */
    if (!visibilityHandler) {
      visibilityHandler = () => {
        if (document.hidden) {
          if (animId) {
            cancelAnimationFrame(animId)
            animId = null
          }
        } else if (!animId && ctx) {
          loop() // 멈춰 있던 루프를 다시 굴립니다
        }
      }
      document.addEventListener('visibilitychange', visibilityHandler)
    }

    createParticles(group, precipitation, isDay)
    render(group, isDay)
  }

  /**
   * 효과 정지
   */
  const stopEffect = () => {
    if (animId) {
      cancelAnimationFrame(animId)
      animId = null
    }
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  onUnmounted(() => {
    stopEffect()
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler)
      visibilityHandler = null
    }
  })

  return {
    startEffect,
    stopEffect,
  }
}

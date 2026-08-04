import { computed, unref } from 'vue'

/**
 * 🤖 useWeatherBriefing — "오늘의 외출 팁" 자동 생성 컴포저블
 *
 * ▶ 이게 왜 컴포저블(Composable)인가요?
 * 화면에 그리는 일(HTML/CSS)과 문장을 만드는 일(로직)을 분리하기 위해서입니다.
 * 문장 만드는 규칙만 여기에 모아두면,
 *   - 카드에서도 쓰고, 나중에 알림 문구나 공유 텍스트로도 재사용할 수 있고
 *   - 규칙을 고칠 때 이 파일 하나만 열면 됩니다.
 *
 * ▶ 어떻게 문장을 만드나요? (규칙 기반 자연어 생성)
 * 거대한 AI 모델을 부르는 대신, 기상 전문가가 쓰는 판단 기준(임계값)을
 * if 조건으로 옮겨 적었습니다. 체감온도·강수확률·바람·자외선 값이
 * 어느 구간에 들어가는지 보고 그 구간에 맞는 문장을 골라 조립합니다.
 *
 * @param {import('vue').Ref|Object} weatherSource 상세 날씨 객체 (ref 또는 일반 객체)
 */
export function useWeatherBriefing(weatherSource) {
  /**
   * 체감온도 구간표
   * 위에서부터 순서대로 검사하여 처음 걸리는 구간을 사용합니다.
   */
  // phrase: 한 줄 요약 문장에 자연스럽게 끼워 넣을 수식어 ("~한 날씨입니다")
  // text  : 팁 목록에 그대로 쓰이는 완성 문장
  const TEMP_BANDS = [
    { min: 33, phrase: '푹푹 찌는 폭염', text: '한낮 외출은 피하고 물을 자주 드세요', emoji: '🥵' },
    { min: 28, phrase: '무더운', text: '덥습니다. 얇고 통풍 잘 되는 옷이 좋아요', emoji: '☀️' },
    { min: 23, phrase: '따뜻한', text: '반팔이 딱 좋은 따뜻한 날씨예요', emoji: '😎' },
    { min: 17, phrase: '쾌적한', text: '나들이하기 좋은 쾌적한 날씨입니다', emoji: '🙂' },
    { min: 11, phrase: '선선한', text: '선선해요. 얇은 겉옷 하나면 충분합니다', emoji: '🧥' },
    { min: 5, phrase: '쌀쌀한', text: '쌀쌀합니다. 자켓이나 니트를 챙기세요', emoji: '🧣' },
    { min: -5, phrase: '추운', text: '춥습니다. 두꺼운 외투와 목도리를 꼭 챙기세요', emoji: '🥶' },
    { min: -100, phrase: '매우 추운', text: '강추위입니다. 실외 활동은 짧게, 방한에 신경 쓰세요', emoji: '❄️' },
  ]

  /** 소수점을 없앤 정수 기온 (문장에 쓰기 좋게) */
  const round = (v) => Math.round(v ?? 0)

  /**
   * 한국어 조사 '은/는' 자동 선택
   *
   * 한글은 받침(종성)이 있으면 '은', 없으면 '는'을 씁니다.
   * (서울 → 서울은 / 도쿄 → 도쿄는)
   *
   * 유니코드에서 한글 음절은 0xAC00부터 28글자 주기로 종성이 반복되므로,
   * (코드 - 0xAC00) % 28 값이 0이면 받침이 없다는 뜻입니다.
   */
  const withTopicParticle = (name = '') => {
    const last = name.charCodeAt(name.length - 1)
    if (Number.isNaN(last) || last < 0xac00 || last > 0xd7a3) return `${name}는`
    const hasBatchim = (last - 0xac00) % 28 !== 0
    return `${name}${hasBatchim ? '은' : '는'}`
  }

  /**
   * 팁 목록: [{ icon, text }] 형태의 배열
   * 조건에 해당하는 항목만 push 되므로 날씨에 따라 개수가 달라집니다.
   */
  const tips = computed(() => {
    const w = unref(weatherSource)
    if (!w) return []

    const list = []
    const temp = w.temp ?? 0
    const feels = w.feelsLike ?? temp
    const pop = w.pop ?? 0
    const wind = w.wind ?? 0
    const uv = w.uv ?? 0
    const humidity = w.humidity ?? 0

    // 1) 체감온도 기반 기본 옷차림 조언
    const band = TEMP_BANDS.find((b) => feels >= b.min) ?? TEMP_BANDS[TEMP_BANDS.length - 1]
    list.push({ icon: band.emoji, text: `${band.text}.` })

    // 2) 실제 기온과 체감온도가 3도 이상 차이나면 따로 알려줍니다
    const gap = feels - temp
    if (gap >= 3) {
      list.push({
        icon: '💧',
        text: `습도 때문에 실제 기온(${round(temp)}°)보다 ${round(gap)}° 더 덥게 느껴져요.`,
      })
    } else if (gap <= -3) {
      list.push({
        icon: '🌬️',
        text: `바람 때문에 실제 기온(${round(temp)}°)보다 ${round(Math.abs(gap))}° 더 춥게 느껴져요.`,
      })
    }

    // 3) 강수 — 눈/비를 구분해서 안내
    const isSnow = w.group === 'snow'
    if (pop >= 70) {
      list.push(
        isSnow
          ? { icon: '❄️', text: `눈이 올 확률이 ${pop}%예요. 미끄럼 방지 신발을 신으세요.` }
          : { icon: '☔️', text: `비 올 확률이 ${pop}%로 높아요. 우산을 꼭 챙기세요.` },
      )
    } else if (pop >= 40) {
      list.push({ icon: '🌂', text: `강수확률 ${pop}%. 접이식 우산을 가방에 넣어두세요.` })
    } else if (pop >= 20) {
      list.push({ icon: '🌦️', text: `강수확률 ${pop}%로 낮지만 소나기가 지나갈 수 있어요.` })
    }

    // 4) 뇌우는 확률과 별개로 항상 강조
    if (w.group === 'storm') {
      list.push({ icon: '⛈️', text: '천둥·번개가 예보되어 있어요. 야외 활동은 미루는 게 좋습니다.' })
    }

    // 5) 바람 (m/s 기준 — 기상청 강풍주의보는 14m/s 내외)
    if (wind >= 14) {
      list.push({ icon: '🌪️', text: `초속 ${wind}m의 강풍입니다. 간판·낙하물을 조심하세요.` })
    } else if (wind >= 8) {
      list.push({ icon: '💨', text: `바람이 초속 ${wind}m로 꽤 붑니다. 우산이 뒤집힐 수 있어요.` })
    }

    // 6) 자외선 지수 (WHO 기준: 3 보통 / 6 높음 / 8 매우 높음 / 11+ 위험)
    if (uv >= 11) {
      list.push({ icon: '🛑', text: `자외선 지수 ${uv}(위험). 한낮에는 그늘에 머무르세요.` })
    } else if (uv >= 8) {
      list.push({ icon: '🕶️', text: `자외선 지수가 ${uv}로 매우 높아요. 선크림과 선글라스는 필수!` })
    } else if (uv >= 6) {
      list.push({ icon: '🧴', text: `자외선 지수 ${uv}(높음). 선크림을 발라주세요.` })
    }

    // 7) 습도
    if (humidity >= 80 && feels >= 24) {
      list.push({ icon: '🥵', text: `습도 ${humidity}%로 매우 눅눅해요. 통풍이 잘 되는 옷을 추천합니다.` })
    } else if (humidity > 0 && humidity <= 30) {
      list.push({ icon: '🧴', text: `습도 ${humidity}%로 건조해요. 보습과 수분 섭취를 챙기세요.` })
    }

    // 8) 가시거리 (안개)
    if (w.visibility !== undefined && w.visibility < 1) {
      list.push({ icon: '🌫️', text: `가시거리가 ${w.visibility}km로 짧습니다. 운전 시 감속하세요.` })
    }

    // 9) 일교차
    const dayGap = (w.tempMax ?? 0) - (w.tempMin ?? 0)
    if (dayGap >= 10) {
      list.push({ icon: '🧥', text: `일교차가 ${round(dayGap)}°나 됩니다. 겉옷을 챙기세요.` })
    }

    // 10) 밤이라면 마무리 인사
    if (w.isDay === false) {
      list.push({ icon: '🌙', text: '밤입니다. 기온이 더 내려갈 수 있으니 유의하세요.' })
    }

    return list
  })

  /**
   * 한 줄 요약 문장 (예시 형식)
   * "뉴욕은 현재 21°C로 쾌적하지만, 자외선 지수가 높으니 선글라스를 챙기세요! 🕶️"
   *
   * 위에서 만든 tips 중 "가장 중요한 주의사항 하나"를 골라 앞 문장과 이어붙입니다.
   */
  const headline = computed(() => {
    const w = unref(weatherSource)
    if (!w) return ''

    const feels = w.feelsLike ?? w.temp ?? 0
    const band = TEMP_BANDS.find((b) => feels >= b.min) ?? TEMP_BANDS[TEMP_BANDS.length - 1]

    // 앞부분: "서울은 현재 31°C로 무더운 날씨입니다"
    const front = `${withTopicParticle(w.name)} 현재 ${round(w.temp)}°C로 ${band.phrase} 날씨입니다`

    // 뒷부분: 기온 조언(첫 번째 팁)을 제외한 나머지 중 첫 번째 주의사항
    const caution = tips.value[1]
    if (!caution) return `${front}. ${band.text}! ${band.emoji}`

    return `${front}. ${caution.text} ${caution.icon}`
  })

  /**
   * 전반적인 분위기 (카드 색상 등에 사용)
   * 'good'(쾌적) | 'watch'(주의) | 'warn'(경고)
   */
  const tone = computed(() => {
    const w = unref(weatherSource)
    if (!w) return 'good'

    const feels = w.feelsLike ?? w.temp ?? 0
    const severe =
      w.group === 'storm' || (w.pop ?? 0) >= 70 || (w.uv ?? 0) >= 8 || feels >= 33 || feels <= -5
    if (severe) return 'warn'

    const watch = (w.pop ?? 0) >= 40 || (w.wind ?? 0) >= 8 || (w.uv ?? 0) >= 6 || feels >= 28
    return watch ? 'watch' : 'good'
  })

  return { headline, tips, tone }
}

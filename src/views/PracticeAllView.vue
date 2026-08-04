<script setup>
/*
 * [보관용 View] p.54 ~ p.157 까지 진행한 Code Challenge 실습 모음.
 *
 * 원래 App.vue 에 세로로 쌓여 있던 컴포넌트들을 이 View 로 통째로 옮겼다.
 * App.vue 는 이제 '내비게이션 바 + <RouterView/> 액자' 역할만 하므로,
 * 이전 실습 결과물은 /practices 주소에서 계속 확인할 수 있다.
 */

// [Code Challenge p.54] 학습환경 구성
import SampleOne from '@/components/practices/basic/SampleOne.vue'
import SampleTwo from '@/components/practices/basic/SampleTwo.vue'

// [Code Challenge p.75] Vue Directive
import VHtmlSample from '@/components/practices/basic/VHtmlSample.vue'
import VBindSample from '@/components/practices/basic/VBindSample.vue'
import VIfSample from '@/components/practices/basic/VIfSample.vue'
import VForSample from '@/components/practices/basic/VForSample.vue'
import VEtcSample from '@/components/practices/basic/VEtcSample.vue'

// [Code Challenge p.87] Vue Event Handling
import VOnSample from '@/components/practices/basic/VOnSample.vue'
import EventObjectSample from '@/components/practices/basic/EventObjectSample.vue'
import EventModifierSample from '@/components/practices/basic/EventModifierSample.vue'

// [Code Challenge p.97] Vue Form Handling & Vue Style
import VModelSample from '@/components/practices/basic/VModelSample.vue'
import FormElementsSample from '@/components/practices/basic/FormElementsSample.vue'
import VModelModifierSample from '@/components/practices/basic/VModelModifierSample.vue'
import VueStyleSample from '@/components/practices/basic/VueStyleSample.vue'

// [실습 과제 p.98] 날씨 Mockup
import WeatherMockup from '@/components/practices/challenge/WeatherMockup.vue'

// [Code Challenge p.107] Reactive State
import RefSample from '@/components/practices/basic/RefSample.vue'
import ReactiveSample from '@/components/practices/basic/ReactiveSample.vue'

// [Code Challenge p.125] Computed & Watchers
import ComputedSample from '@/components/practices/basic/ComputedSample.vue'
import WatchSample from '@/components/practices/basic/WatchSample.vue'
import MultiSourceWatchSample from '@/components/practices/basic/MultiSourceWatchSample.vue'
import DeepWatchSample from '@/components/practices/basic/DeepWatchSample.vue'
import ReactiveWatchSample from '@/components/practices/basic/ReactiveWatchSample.vue'
import WatchEffectSample from '@/components/practices/basic/WatchEffectSample.vue'

// [실습 과제 p.126] 날씨 (컴포지션)
import WeatherComposition from '@/components/practices/challenge/WeatherComposition.vue'

// [Code Challenge p.136] Component Lifecycle
import LifecycleSample from '@/components/practices/basic/LifecycleSample.vue'

// [Code Challenge p.152] Props & Emits
import PropsEmitsParent from '@/components/practices/basic/PropsEmitsParent.vue'

// [Code Challenge p.157] Component Slot
import SlotDefaultParent from '@/components/practices/basic/SlotDefaultParent.vue'
import SlotNamedParent from '@/components/practices/basic/SlotNamedParent.vue'
import SlotScopedParent from '@/components/practices/basic/SlotScopedParent.vue'

// [Code Challenge p.190] Pinia Store (counter.js)
import StoreCounter from '@/components/practices/library/StoreCounter.vue'

// [Code Challenge p.208] Axios — Weather Example / JSON Example
import AxiosWeather from '@/components/practices/library/AxiosWeather.vue'
import AxiosJson from '@/components/practices/library/AxiosJson.vue'
</script>

<template>
  <div class="practice-archive">
    <h2>📚 이전 실습 모음 (p.54 ~ p.208)</h2>
    <p class="desc">
      App.vue 에 쌓아두었던 Code Challenge 결과물입니다. 이제 <code>/practices</code> 주소로
      분리되어 필요할 때만 Lazy Loading 됩니다.
    </p>

    <SampleOne />
    <SampleTwo />

    <VHtmlSample />
    <VBindSample />
    <VIfSample />
    <VForSample />
    <VEtcSample />

    <VOnSample />
    <EventObjectSample />
    <EventModifierSample />

    <VModelSample />
    <FormElementsSample />
    <VModelModifierSample />
    <VueStyleSample />

    <WeatherMockup />

    <!-- p.107 Reactive State -->
    <RefSample />
    <ReactiveSample />

    <!-- p.125 Computed & Watchers -->
    <ComputedSample />
    <WatchSample />
    <MultiSourceWatchSample />
    <DeepWatchSample />
    <ReactiveWatchSample />
    <WatchEffectSample />

    <!-- p.126 날씨 (컴포지션) -->
    <WeatherComposition />

    <!-- p.136 Component Lifecycle -->
    <LifecycleSample />

    <!-- p.152 Props & Emits -->
    <PropsEmitsParent />

    <!-- p.157 Component Slot -->
    <SlotDefaultParent />
    <SlotNamedParent />
    <SlotScopedParent />

    <!-- p.190 Pinia Store -->
    <StoreCounter />

    <!-- p.208 Axios -->
    <AxiosWeather />
    <AxiosJson />
  </div>
</template>

<style scoped>
.practice-archive h2 {
  font-size: 1.15rem;
  margin: 0 0 4px;
}
.desc {
  font-size: 0.85rem;
  color: #777;
  margin: 0 0 16px;
}
.desc code {
  background: #f0f0f0;
  padding: 1px 5px;
  border-radius: 3px;
}
</style>

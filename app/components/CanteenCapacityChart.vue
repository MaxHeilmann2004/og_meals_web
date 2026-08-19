<template>
  <div v-if="hasData" class="capacity-chart">
    <VisXYContainer
      class="capacity-chart-container"
      :x-domain="xDomain"
      :y-domain="[0, 100]"
      :height="280"
      :aria-label="showActual ? 'Tatsächliche Auslastung und berechnete Erwartung' : 'Berechnete erwartete Auslastung'"
    >
      <VisLine
        v-if="actualData.length > 0"
        :data="actualData"
        :x="xAccessor"
        :y="yAccessor"
        color="var(--color-primary)"
        :line-width="3"
        :curve-type="'monotoneX'"
      />
      <VisLine
        v-if="predictionData.length > 0"
        :data="predictionData"
        :x="xAccessor"
        :y="yAccessor"
        color="var(--color-info)"
        :line-width="3"
        :line-dash-array="[8, 7]"
        :curve-type="'monotoneX'"
      />
      <VisAxis
        type="x"
        :tick-values="xTickValues"
        :tick-format="formatXAxisTick"
        :tick-text-color="'var(--color-text-muted)'"
        :grid-line="true"
        :domain-line="false"
        :tick-line="false"
      />
      <VisAxis
        type="y"
        :tick-values="[0, 25, 50, 75, 100]"
        :tick-format="formatYAxisTick"
        :tick-text-color="'var(--color-text-muted)'"
        :domain-line="false"
        :tick-line="false"
      />
    </VisXYContainer>

    <div class="capacity-chart-legend" aria-hidden="true">
      <span v-if="actualData.length > 0" class="capacity-chart-legend-item">
        <span class="capacity-chart-legend-line capacity-chart-legend-line--actual"></span>
        Heute
      </span>
      <span v-if="predictionData.length > 0" class="capacity-chart-legend-item">
        <span class="capacity-chart-legend-line capacity-chart-legend-line--prediction"></span>
        Erwartung
      </span>
    </div>
  </div>
  <p v-else class="capacity-chart-empty">
    {{ emptyMessage }}
  </p>
</template>

<script setup lang="ts">
import { VisAxis, VisLine, VisXYContainer } from '@unovis/vue'
import type { CanteenCapacityTimeline } from '~/types/meals'
import {
  actualPointToChartPoint,
  predictionPointToChartPoint,
  type CapacityChartPoint,
} from '~/utils/canteenCapacity'

// Unovis receives one data series per line while the container shares the x/y domains.
type ChartDatum = {
  x: number
  y: number
}

const props = withDefaults(defineProps<{
  timeline: CanteenCapacityTimeline
  showActual?: boolean
  emptyMessage?: string
}>(), {
  showActual: true,
  emptyMessage: 'Für heute sind noch keine Auslastungsdaten verfügbar.',
})

const actualPoints = computed(() => {
  if (!props.showActual) return []
  return props.timeline.observations
    .map(actualPointToChartPoint)
    .filter((point): point is CapacityChartPoint => point !== null)
    .sort((left, right) => left.date.getTime() - right.date.getTime())
})

const predictionPoints = computed(() => {
  if (!props.timeline.prediction) return []
  return props.timeline.prediction.points
    .map((point) => predictionPointToChartPoint(props.timeline.date, point))
    .filter((point): point is CapacityChartPoint => point !== null)
    .sort((left, right) => left.date.getTime() - right.date.getTime())
})

const actualData = computed<ChartDatum[]>(() => actualPoints.value.map((point) => ({
  x: point.date.getTime(),
  y: point.percent,
})))

const predictionData = computed<ChartDatum[]>(() => predictionPoints.value.map((point) => ({
  x: point.date.getTime(),
  y: point.percent,
})))

const hasData = computed(() => actualData.value.length > 0 || predictionData.value.length > 0)

const xDomain = computed<[number, number]>(() => {
  // Keep every capacity graph comparable: the visible window is the canteen's
  // usual service period. Unovis clips observations outside this range.
  const start = new Date(`${props.timeline.date}T08:00:00`)
  const end = new Date(`${props.timeline.date}T17:00:00`)
  return [start.getTime(), end.getTime()]
})

const CAPACITY_TICK_HOURS = [8, 10, 12, 14, 16, 17]

const xTickValues = computed(() => CAPACITY_TICK_HOURS.map((hour) => {
  const hourText = String(hour).padStart(2, '0')
  return new Date(`${props.timeline.date}T${hourText}:00:00`).getTime()
}))

const xAccessor = (datum: ChartDatum) => datum.x
const yAccessor = (datum: ChartDatum) => datum.y

const formatXAxisTick = (tick: number | Date) => {
  const date = tick instanceof Date ? tick : new Date(tick)
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const formatYAxisTick = (tick: number | Date) => `${Number(tick)}%`
</script>

<style scoped>
.capacity-chart {
  width: 100%;
}

.capacity-chart-container {
  width: 100%;
  --vis-axis-grid-color: var(--color-outline-variant);
  --vis-axis-tick-color: var(--color-outline-variant);
  --vis-axis-domain-color: var(--color-outline-variant);
}

.capacity-chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  margin-top: 2px;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}

.capacity-chart-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.capacity-chart-legend-line {
  width: 24px;
  height: 0;
  border-top: 3px solid var(--color-primary);
  border-radius: 2px;
}

.capacity-chart-legend-line--prediction {
  border-top-color: var(--color-info);
  border-top-style: dashed;
}

.capacity-chart-empty {
  margin: 0;
  padding: 48px 16px;
  color: var(--color-text-muted);
  text-align: center;
}
</style>

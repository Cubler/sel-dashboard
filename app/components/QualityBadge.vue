<template>
  <span :class="cls">{{ label }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { QualityValidity } from '~/types/api'

const props = defineProps<{ validity: QualityValidity | undefined }>()

const VARIANTS: Record<QualityValidity, string> = {
  good: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  questionable: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  invalid: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const LABELS: Record<QualityValidity, string> = {
  good: 'Good',
  questionable: 'Questionable',
  invalid: 'Invalid',
}

const key = computed(() => props.validity ?? 'invalid')
const cls = computed(() =>
  `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${VARIANTS[key.value]}`,
)
const label = computed(() => LABELS[key.value])
</script>

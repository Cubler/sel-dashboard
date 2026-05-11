<template>
  <span :class="cls">{{ label }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SymbolStatus } from '~/types/api'
import { getStatusLabel } from '~/utils/qualityHelpers'

const props = defineProps<{ status: SymbolStatus }>()

const VARIANTS: Record<SymbolStatus, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  stale: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
}

const cls = computed(() =>
  `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${VARIANTS[props.status]}`,
)

const label = computed(() => getStatusLabel(props.status))
</script>

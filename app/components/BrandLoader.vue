<template>
  <div class="brand-loader" role="status">
    <BrandLogo class="brand-loader-logo" />
    <span>{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string }>()
</script>

<style scoped>
.brand-loader {
  display: grid;
  justify-items: center;
  gap: .75rem;
  color: inherit;
  font-size: .9rem;
  font-weight: 750;
  text-align: center;
}

.brand-loader-logo :deep(.brand-logo) {
  gap: 0;
}

.brand-loader-logo :deep(.brand-logo-mark) {
  width: 3rem;
  height: 3rem;
}

.brand-loader-logo :deep(.brand-logo-name) {
  display: none;
}

.brand-loader :deep(.brand-logo-card) {
  transform-box: fill-box;
  transform-origin: center;
}

.brand-loader :deep(.brand-logo-card--left) {
  animation: brand-loader-card-left 1.35s ease-in-out infinite;
}

.brand-loader :deep(.brand-logo-card--right) {
  animation: brand-loader-card-right 1.35s ease-in-out .12s infinite;
}

.brand-loader :deep(.brand-logo-card--front) {
  animation: brand-loader-card-front 1.35s ease-in-out .24s infinite;
}

@keyframes brand-loader-card-left {
  0%, 100% { transform: none; }
  40%, 65% { transform: translate(-2px, -1px) rotate(-2deg); }
}

@keyframes brand-loader-card-right {
  0%, 100% { transform: none; }
  40%, 65% { transform: translate(2px, -1px) rotate(2deg); }
}

@keyframes brand-loader-card-front {
  0%, 100% { transform: none; }
  40%, 65% { transform: translateY(-2px); }
}

@media (prefers-reduced-motion: reduce) {
  .brand-loader :deep(.brand-logo-card) {
    animation: none;
    transform: none;
  }
}
</style>

<template>
  <span class="brand-logo" aria-hidden="true">
    <svg class="brand-logo-mark" viewBox="0 0 40 40" fill="none">
      <rect x="3" y="7" width="30" height="30" rx="10" fill="var(--blue)" stroke="var(--ink)" stroke-width="2" />
      <path d="M18 8v28M4 21h28" stroke="var(--paper)" stroke-linecap="round" stroke-width="2.5" />
      <path d="M18 13.5c0-2.1 1.5-3.5 3.4-3.5 1.8 0 3.2 1.4 3.2 3.2 0 .9-.4 1.7-1 2.3H18v-2Z" fill="var(--yellow)" stroke="var(--ink)" stroke-linejoin="round" stroke-width="1.6" />
      <path d="M9.5 21h2.8c.7.6 1.1 1.4 1.1 2.3 0 1.8-1.4 3.2-3.2 3.2-1.9 0-3.4-1.4-3.4-3.5V21h2.7Z" fill="var(--coral)" stroke="var(--ink)" stroke-linejoin="round" stroke-width="1.6" />
      <path d="M31 5.5c.6 1.7 1.4 2.5 3.1 3.1-1.7.6-2.5 1.4-3.1 3.1-.6-1.7-1.4-2.5-3.1-3.1 1.7-.6 2.5-1.4 3.1-3.1Z" fill="var(--yellow)" stroke="var(--ink)" stroke-linejoin="round" stroke-width="1.2" />
    </svg>
    <span class="brand-logo-name"><span>zima</span><span class="wordmark-blue">blue</span></span>
  </span>
</template>

<style scoped>
.brand-logo {
  display: inline-flex;
  align-items: center;
  gap: .48rem;
  color: var(--ink);
  font: 900 1.32rem/1 Inter, ui-sans-serif, system-ui, sans-serif;
  letter-spacing: -.065em;
  white-space: nowrap;
}

.brand-logo-mark {
  display: block;
  width: 2rem;
  height: 2rem;
  flex: none;
  overflow: visible;
  transition: transform .2s cubic-bezier(.2,.8,.2,1);
}

.brand-logo-name { display: inline-flex; }
.wordmark-blue { color: var(--blue); }

:global(.wordmark:hover) .brand-logo-mark { transform: rotate(-6deg) scale(1.06); }

@media (max-width: 470px) {
  .brand-logo { gap: .36rem; font-size: 1.08rem; }
  .brand-logo-mark { width: 1.8rem; height: 1.8rem; }
}

@media (prefers-reduced-motion: reduce) {
  .brand-logo-mark { transition: none; }
}
</style>

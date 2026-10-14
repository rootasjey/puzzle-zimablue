<template>
  <span class="brand-logo" aria-hidden="true">
    <svg class="brand-logo-mark" viewBox="0 0 40 40" fill="none">
      <path d="m7 5 28-.7.5 28.2-28 .8Z" fill="#18224E" />
      <path d="m3.5 3.5 28-.7.5 28.1-27.8.8Z" fill="#F7F5EE" />
      <path d="m3.5 3.5 28-.7.5 28.1-27.8.8Z" stroke="#18224E" stroke-width="1.8" />
      <path class="brand-logo-cell brand-logo-cell--top-left" d="m6.6 6.3 10.5-.2.1 9.5-10.5.2Z" fill="#3986FF" />
      <path class="brand-logo-cell brand-logo-cell--top-right" d="m18.4 6 10-.2.1 9.5-10 .2Z" fill="#BDB2FF" />
      <path class="brand-logo-cell brand-logo-cell--bottom-left" d="m6.7 17.1 10.5-.3.1 10.9-10.5.3Z" fill="#FED7E0" />
      <path class="brand-logo-cell brand-logo-cell--bottom-right" d="m18.4 16.8 10.2-.3.1 10.9-10.2.3Z" fill="#FFF4F4" />
      <path d="m6.6 15.8 21.8-.5M17.2 6.1l.2 21.9" stroke="#F7F5EE" stroke-width="1.6" />
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
}

.brand-logo-cell {
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 180ms cubic-bezier(.2,.8,.2,1);
}

.brand-logo:hover .brand-logo-cell--top-left,
:global(.wordmark:focus-visible) .brand-logo-cell--top-left { transform: translate(-2px, -2px) scale(1.4); }
.brand-logo:hover .brand-logo-cell--top-right,
:global(.wordmark:focus-visible) .brand-logo-cell--top-right { transform: translate(2px, -2px) scale(1.4); }
.brand-logo:hover .brand-logo-cell--bottom-left,
:global(.wordmark:focus-visible) .brand-logo-cell--bottom-left { transform: translate(-2px, 2px) scale(1.4); }
.brand-logo:hover .brand-logo-cell--bottom-right,
:global(.wordmark:focus-visible) .brand-logo-cell--bottom-right { transform: translate(2px, 2px) scale(1.4); }

.brand-logo-name { display: inline-flex; }
.wordmark-blue { color: var(--blue); }

@media (max-width: 470px) {
  .brand-logo { gap: .36rem; font-size: 1.08rem; }
  .brand-logo-mark { width: 1.8rem; height: 1.8rem; }
}

@media (prefers-reduced-motion: reduce) {
  .brand-logo-cell { transition: none; }
}
</style>

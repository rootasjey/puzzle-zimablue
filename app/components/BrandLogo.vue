<template>
  <span class="brand-logo" aria-hidden="true">
    <svg class="brand-logo-mark" viewBox="0 0 40 40" fill="none">
      <g class="brand-logo-card brand-logo-card--right">
        <rect x="13" y="7" width="23" height="23" rx="2" transform="rotate(10 24.5 18.5)" fill="#18224E" />
        <rect x="11" y="5" width="23" height="23" rx="2" transform="rotate(10 22.5 16.5)" fill="#FFDC4B" stroke="#18224E" stroke-width="1.6" />
      </g>
      <g class="brand-logo-card brand-logo-card--left">
        <rect x="6" y="9" width="23" height="23" rx="2" transform="rotate(-11 17.5 20.5)" fill="#18224E" />
        <rect x="4" y="7" width="23" height="23" rx="2" transform="rotate(-11 15.5 18.5)" fill="#65D0F4" stroke="#18224E" stroke-width="1.6" />
      </g>
      <g class="brand-logo-card brand-logo-card--front">
        <rect x="10" y="11" width="23" height="23" rx="2" fill="#18224E" />
        <rect x="8" y="9" width="23" height="23" rx="2" fill="#3986FF" stroke="#18224E" stroke-width="1.8" />
      </g>
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

@media (prefers-reduced-motion: no-preference) {
  .brand-logo-card {
    transform-box: fill-box;
    transform-origin: center;
    transition: transform 190ms cubic-bezier(.2,.8,.2,1);
  }

  .wordmark-blue {
    transition: color 190ms cubic-bezier(.2,.8,.2,1);
  }

  .brand-logo:hover .brand-logo-card--left,
  :global(.wordmark:focus-visible) .brand-logo-card--left {
    transform: translate(-2px, -1px) rotate(-2deg);
  }

  .brand-logo:hover .brand-logo-card--right,
  :global(.wordmark:focus-visible) .brand-logo-card--right {
    transform: translate(2px, -1px) rotate(2deg);
  }

  .brand-logo:hover .brand-logo-card--front,
  :global(.wordmark:focus-visible) .brand-logo-card--front {
    transform: translateY(-1px);
  }

  .brand-logo:hover .wordmark-blue,
  :global(.wordmark:focus-visible) .wordmark-blue {
    color: #65D0F4;
  }
}

.brand-logo-name { display: inline-flex; }
.wordmark-blue { color: var(--blue); }

@media (max-width: 470px) {
  .brand-logo { gap: .36rem; font-size: 1.08rem; }
  .brand-logo-mark { width: 1.8rem; height: 1.8rem; }
}

</style>

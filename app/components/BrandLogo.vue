<template>
  <span class="brand-logo" aria-hidden="true">
    <svg class="brand-logo-mark" viewBox="0 0 40 40" fill="none">
      <rect x="10" y="7" width="21" height="27" rx="3.5" transform="rotate(13 20.5 20.5)" fill="#18224E" />
      <g class="brand-logo-card brand-logo-card--right">
        <rect x="14" y="4" width="21" height="27" rx="3.5" transform="rotate(13 24.5 17.5)" fill="#FFDC4B" stroke="#18224E" stroke-width="1.6" />
      </g>
      <g class="brand-logo-card brand-logo-card--left">
        <rect x="3" y="6" width="21" height="27" rx="3.5" transform="rotate(-14 13.5 19.5)" fill="#65D0F4" stroke="#18224E" stroke-width="1.6" />
      </g>
      <g class="brand-logo-card brand-logo-card--front">
        <rect x="8" y="8" width="21" height="27" rx="3.5" fill="#3986FF" stroke="#18224E" stroke-width="1.8" />
        <path d="M11 11.5h7" stroke="#F7F5EE" stroke-width="2" stroke-linecap="round" />
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

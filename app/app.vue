<template>
  <div class="site-shell">
    <header class="site-header page-wrap">
      <NuxtLink to="/" class="wordmark" aria-label="Puzzle Zimablue, accueil">
        <span>zima</span><span class="wordmark-blue">blue</span><i aria-hidden="true">·</i>
      </NuxtLink>
      <nav aria-label="Navigation principale">
        <NuxtLink class="nav-link" to="/">Le puzzle du jour</NuxtLink>
        <NuxtLink class="nav-link" to="/archive">Archives</NuxtLink>
      </nav>
    </header>
    <NuxtPage />
    <footer class="site-footer page-wrap">
      <span>Un jeu quotidien autour des illustrations de <a href="https://zimablue.cc" target="_blank" rel="noreferrer">Zimablue</a>.</span>
      <span>Une image, neuf pièces, un moment à soi.</span>
    </footer>
  </div>
</template>

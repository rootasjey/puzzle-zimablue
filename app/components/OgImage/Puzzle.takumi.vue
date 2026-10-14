<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  image?: string
  imageAlt?: string
}>(), {
  title: 'Puzzle Zimablue',
  image: '/og-puzzle-zimablue.jpg',
  imageAlt: 'Pièces de puzzle colorées sur fond bleu et crème',
})
</script>

<template>
  <div class="canvas">
    <div class="copy">
      <div class="brand">
        <span class="mark" aria-hidden="true">
          <span class="mark-cell mark-cell--blue" />
          <span class="mark-cell mark-cell--lavender" />
          <span class="mark-cell mark-cell--pink" />
          <span class="mark-cell mark-cell--cream" />
        </span>
        Puzzle Zimablue
      </div>
      <div class="eyebrow">UN PUZZLE PAR JOUR</div>
      <h1>{{ title }}</h1>
      <div class="caption">Une illustration de Zimablue à reconstituer chaque jour.</div>
    </div>
    <div class="art-frame">
      <img :src="image" :alt="imageAlt">
    </div>
    <div class="shape shape-one" />
    <div class="shape shape-two" />
  </div>
</template>

<style>
.canvas {
  position: relative;
  display: flex;
  width: 1200px;
  height: 630px;
  box-sizing: border-box;
  overflow: hidden;
  align-items: center;
  justify-content: space-between;
  padding: 72px;
  background: #eaf4f7;
  color: #182a32;
  font-family: Inter, sans-serif;
}
.copy { z-index: 1; display: flex; width: 485px; flex-direction: column; align-items: flex-start; }
.brand { display: flex; align-items: center; gap: 12px; margin-bottom: 82px; font-size: 25px; font-weight: 700; }
.mark { position: relative; display: grid; width: 38px; height: 38px; box-sizing: border-box; grid-template-columns: 1fr 1fr; gap: 2px; padding: 4px; border: 2px solid #18224e; background: #f7f5ee; box-shadow: 4px 4px 0 #18224e; }
.mark-cell--blue { background: #3986ff; }
.mark-cell--lavender { background: #bdb2ff; }
.mark-cell--pink { background: #fed7e0; }
.mark-cell--cream { background: #fff4f4; }
.eyebrow { margin-bottom: 18px; color: #547883; font-size: 16px; font-weight: 700; letter-spacing: 3px; }
h1 { margin: 0; font-size: 54px; line-height: 1.08; letter-spacing: -2px; }
.caption { margin-top: 24px; color: #54717b; font-size: 21px; line-height: 1.4; }
.art-frame { z-index: 1; display: flex; width: 475px; height: 475px; overflow: hidden; align-items: center; justify-content: center; border: 12px solid #fff; border-radius: 32px; background: #fff; box-shadow: 0 26px 70px #32586824; }
.art-frame img { width: 100%; height: 100%; object-fit: cover; }
.shape { position: absolute; border-radius: 50%; background: #d3e9ef; }
.shape-one { top: -250px; right: 120px; width: 500px; height: 500px; }
.shape-two { bottom: -385px; left: 260px; width: 560px; height: 560px; background: #f7e6b6; }
</style>

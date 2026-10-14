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
      <div class="brand"><span class="mark">✳</span> Puzzle Zimablue</div>
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
.mark { display: flex; width: 38px; height: 38px; align-items: center; justify-content: center; border-radius: 12px; background: #f4c95d; color: #19323c; font-size: 23px; }
.eyebrow { margin-bottom: 18px; color: #547883; font-size: 16px; font-weight: 700; letter-spacing: 3px; }
h1 { margin: 0; font-size: 54px; line-height: 1.08; letter-spacing: -2px; }
.caption { margin-top: 24px; color: #54717b; font-size: 21px; line-height: 1.4; }
.art-frame { z-index: 1; display: flex; width: 475px; height: 475px; overflow: hidden; align-items: center; justify-content: center; border: 12px solid #fff; border-radius: 32px; background: #fff; box-shadow: 0 26px 70px #32586824; }
.art-frame img { width: 100%; height: 100%; object-fit: cover; }
.shape { position: absolute; border-radius: 50%; background: #d3e9ef; }
.shape-one { top: -250px; right: 120px; width: 500px; height: 500px; }
.shape-two { bottom: -385px; left: 260px; width: 560px; height: 560px; background: #f7e6b6; }
</style>

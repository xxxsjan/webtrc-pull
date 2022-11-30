<template>
  <div>
    <div class="flex">
      本地视频
      <video
        autoplay
        playsinline
        style="width: 400px"
        src="/niganmaya.mp4"
        loop
        muted
        id="video"
        ref="videoRef"
      ></video>

      canvas画的
      <canvas ref="canvasRef" width="400" height="250" style="width: 400px"></canvas>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue';

let videoRef: any = ref(null);
let canvasRef: any = ref(null);

// canvas画视频帧  videoDom -> canvas
function video2Canvas(dom: HTMLVideoElement) {
  const ctx: CanvasRenderingContext2D = (canvasRef.value as HTMLCanvasElement).getContext('2d')!;
  const { width, height } = canvasRef.value;

  ctx.drawImage(dom, 0, 0, width, height);
  const stream = canvasRef.value.captureStream(30); // 30 fps
  // console.log(stream);
}
// canvas 2 stream 2 videoObj
function canvas2Stream2VideoObj(canvas) {
  let videoDom = document.querySelector('#virtual-video') as HTMLVideoElement;
  const stream = canvas.captureStream(30); // 30 fps
  videoDom.srcObject = stream;
}

onMounted(() => {
  videoRef.value.addEventListener('loadedmetadata', () => {
    setInterval(() => {
      video2Canvas(videoRef.value);
    }, 1000 / 40);
  });
});
</script>

<style scoped>
.flex {
  display: flex;
  flex-direction: column;
}
</style>

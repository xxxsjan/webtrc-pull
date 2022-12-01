<template>
  <h1>使用tensorflow 用模型抠图</h1>
  <div id="contentHolder">
    <video id="video" autoplay style="background-color: #000"></video>
  </div>
  <div class="w-1/2 m-5 flex items-center">
    <el-button id="btn_snap" @click="takePhoto">拍照</el-button>
    <input type="color" v-model="inputColor" />
  </div>

  <div v-loading="loading" element-loading-text="模型训练中，马上扣完">
    <canvas id="canvas"></canvas>
    <canvas id="canvas_bg" style="display: none"></canvas>
  </div>

  <img id="imgXX" src="" />
</template>

<script lang="ts" setup>
import * as tf from '@tensorflow/tfjs';
import { ref, onMounted } from 'vue';

const loading = ref(true);
const inputColor = ref('#0066cc');
const canvas = ref();
const canvasBg = ref();

function changeBgColor(ctxBg, cvs) {
  ctxBg.clearRect(0, 0, cvs.width, cvs.height);
  ctxBg.fillStyle = inputColor.value || '#06c';
  ctxBg.fillRect(0, 0, cvs.width, cvs.height);
}
function takePhoto() {
  document.getElementById('imgXX').src = canvas.value.toDataURL('image/png');
}

onMounted(async () => {
  // const loading = ElLoading.service({});
  const cvs = (canvas.value = document.getElementById('canvas') as HTMLCanvasElement);
  const video = document.getElementById('video');
  canvasBg.value = document.getElementById('canvas_bg');
  const width = 400,
    height = 250;

  cvs.width = video.width = canvasBg.value.width = width;
  cvs.height = video.height = canvasBg.value.height = height;

  const ctxBg = canvasBg.value.getContext('2d');

  changeBgColor(ctxBg, cvs);

  main();
  //   调用模型进行去除背景化处理
  async function main() {
    const video = document.querySelector('video')!;
    const canvas = document.getElementById('canvas');

    const webcam = await tf.data.webcam(video);
    const model = await tf.loadGraphModel('./model/model.json');

    let [r1i, r2i, r3i, r4i] = [tf.tensor(0), tf.tensor(0), tf.tensor(0), tf.tensor(0)];

    const downsample_ratio = tf.tensor(0.5);
    while (true) {
      await tf.nextFrame();
      const img = await webcam.capture();
      const src = tf.tidy(() => img.expandDims(0).div(255));
      const [fgr, pha, r1o, r2o, r3o, r4o] = await model.executeAsync({ src, r1i, r2i, r3i, r4i, downsample_ratio }, [
        'fgr',
        'pha',
        'r1o',
        'r2o',
        'r3o',
        'r4o',
      ]);
      loading.value = false;

      drawMatte(fgr.clone(), pha.clone(), canvas);
      tf.dispose([img, src, fgr, pha, r1i, r2i, r3i, r4i]);
      [r1i, r2i, r3i, r4i] = [r1o, r2o, r3o, r4o];
    }
  }
  async function drawMatte(fgr, pha, canvas) {
    const rgba = tf.tidy(() => {
      const rgb =
        fgr !== null ? fgr.squeeze(0).mul(255).cast('int32') : tf.fill([pha.shape[1], pha.shape[2], 3], 255, 'int32');
      const a =
        pha !== null ? pha.squeeze(0).mul(255).cast('int32') : tf.fill([fgr.shape[1], fgr.shape[2], 1], 255, 'int32');
      return tf.concat([rgb, a], -1);
    });

    fgr && fgr.dispose();
    pha && pha.dispose();
    const [height, width] = rgba.shape.slice(0, 2);
    const pixelData = new Uint8ClampedArray(await rgba.data());
    const imageData = new ImageData(pixelData, width, height);
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext('2d');
    context.putImageData(imageData, 0, 0);
    context.getImageData(0, 0, width, height);
    context.globalCompositeOperation = 'destination-over';
    context.drawImage(canvasBg.value, 0, 0); // 上背景
    rgba.dispose();
  }
});
</script>

<style scoped></style>

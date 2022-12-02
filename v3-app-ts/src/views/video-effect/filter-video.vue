<template>
  <div class="flex justify-center flex-col items-center">
    <div class="flex">
      摄像头
      <video ref="cameraRef" id="videoEl" autoplay playsinline muted style="width: 400px"></video>
    </div>
    <div class="flex">
      <div class="m-10">
        选择滤镜
        <el-select name="filter" id="filter-select" v-model="selectVal" @change="onChange">
          <el-option v-for="(item, idx) in filterList" :key="item" :value="idx" :label="item">{{ item }}</el-option>
        </el-select>
      </div>
      <canvas ref="canvasRef" width="400" height="250" style="width: 400px"></canvas>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue';
import { random } from 'lodash-es';

let cameraRef: any = ref(null);
let canvasRef: any = ref(null);
const filterList = reactive([
  'blur(5px)', // 模糊
  'brightness(0.5)', // 亮度
  'contrast(200%)', // 对比度
  'grayscale(100%)', // 灰度
  'hue-rotate(90deg)', // 色相旋转
  'invert(100%)', // 反色
  'opacity(90%)', // 透明度
  'saturate(200%)', // 饱和度
  'saturate(20%)', // 饱和度
  'sepia(100%)', // 褐色
  'drop-shadow(4px 4px 8px blue)', // 阴影
]);
const idx = random(0, filterList.length);
const selectVal = ref(idx);
// 添加滤镜
function handleCanvas(ctx) {
  ctx.filter = filterList[selectVal.value];
}
// canvas画视频帧
function canvas2Video(dom) {
  const ctx = (canvasRef.value as HTMLCanvasElement).getContext('2d');
  const { width, height } = canvasRef.value;
  handleCanvas(ctx);
  ctx.drawImage(dom, 0, 0, width, height);
  const stream = canvasRef.value.captureStream(30); // 30 fps
  // console.log(stream);
}

function onChange(e) {
  console.log(e.target.value);
}
onMounted(async () => {
  const stream = await window.navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      width: 480,
      height: 300,
    },
  });
  cameraRef.value.srcObject = stream;
  cameraRef.value.addEventListener('loadedmetadata', () => {
    setInterval(() => {
      canvas2Video(cameraRef.value);
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

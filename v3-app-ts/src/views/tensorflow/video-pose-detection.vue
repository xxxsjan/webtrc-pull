<template>
  <div>
    <canvas id="output"></canvas>
    <video id="video" playsinline autoplay width="360" height="270" v-show="1"></video>
    <!-- <video id="video" autoplay playsinline muted class="w-[360px] h-[270px] object-fill"></video> -->
  </div>
</template>

<script lang="ts" setup>
import { PoseDetector } from '@tensorflow-models/pose-detection';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import { onMounted, onUnmounted } from 'vue';

onMounted(() => {
  init();
});
// 其他地方要用到的公共变量
let videoEl: HTMLVideoElement;
let canvasEl: HTMLCanvasElement;
let canvasCtx: CanvasRenderingContext2D;
let detector: PoseDetector;
let model = poseDetection.SupportedModels.PoseNet;

let afId: any;
// 初始化
const init = async () => {
  canvasEl = document.getElementById('output') as HTMLCanvasElement;
  canvasCtx = canvasEl.getContext('2d')!;

  videoEl = document.getElementById('video') as HTMLVideoElement;
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true,
  });
  videoEl.srcObject = stream;

  videoEl.onloadeddata = async function () {
    console.log('onloadeddata: ');

    const { width, height } = videoEl.getBoundingClientRect();
    console.log('width, height: ', width, height);
    canvasEl.width = width;
    canvasEl.height = height;
    // 加载模型
    detector = await poseDetection.createDetector(model, {
      modelType: 'full',
      // quantBytes: 4,
      // architecture: 'MobileNetV1',
      // outputStride: 16,
      // inputResolution: { width, height },
      // multiplier: 0.75,
    });
    // 开始检测
    detectPose();
  };
};

// 开始检测
const detectPose = async () => {
  const video = document.getElementById('video') as HTMLVideoElement;

  // 检测画布动作
  const poses = await detector.estimatePoses(canvasEl, {
    flipHorizontal: false, // 是否水平翻转
    maxPoses: 1, // 最大检测人数
    // scoreThreshold: 0.5, // 置信度
    // nmsRadius: 20, // 非极大值抑制
  });
  // 将 pose 上的 17 个关键点的坐标信息存入 pointList
  const pointList = poses[0]?.keypoints || [];

  // 绘制视频
  canvasCtx.drawImage(video, 0, 0, canvasEl.width, canvasEl.height);

  // 将这 17 个关键点的坐标信息 画到 canvas 上

  // 画出所有关键点
  pointList.forEach(({ x, y, score, name }: any) => {
    if (score > 0.5) {
      // 画点
      drawPoint(x, y, 5, '#f00000', canvasCtx);
    }
  });

  // 获取相邻的关键点信息
  const adjacentPairs = poseDetection.util.getAdjacentPairs(model);
  // 画出所有连线
  adjacentPairs.forEach(([i, j]: any) => {
    const kp1 = pointList[i];
    const kp2 = pointList[j];
    // score 不为空就画线
    const score1 = kp1.score != null ? kp1.score : 1;
    const score2 = kp2.score != null ? kp2.score : 1;
    if (score1 >= 0.5 && score2 >= 0.5) {
      // 画出所有连线
      drawSegment([kp1.x, kp1.y], [kp2.x, kp2.y], 'aqua', 1, canvasCtx);
    }
  });

  afId = requestAnimationFrame(() => detectPose());
};

// 画点
function drawPoint(x: number, y: number, r: number, color: string, ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  // x, y, radius, startAngle, endAngle, anticlockwise
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}
// 画线段
function drawSegment(
  [ax, ay]: number[],
  [bx, by]: number[],
  color: string,
  scale: number,
  ctx: CanvasRenderingContext2D
) {
  ctx.beginPath();
  ctx.moveTo(ax * scale, ay * scale);
  ctx.lineTo(bx * scale, by * scale);
  ctx.lineWidth = 4;
  ctx.strokeStyle = color;
  ctx.stroke();
}

onUnmounted(() => {
  detector.dispose();
  detector = null;
  cancelAnimationFrame(afId);
});
</script>

<style scoped></style>

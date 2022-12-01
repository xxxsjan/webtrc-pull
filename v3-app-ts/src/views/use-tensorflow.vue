<template>
  <div>
    <video id="video" autoplay playsinline class="w-[360px] h-[270px] object-fill"></video>
    <canvas id="output" width="360" height="270"></canvas>
  </div>
</template>

<script lang="ts" setup>
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import { ref, onMounted } from 'vue';

onMounted(() => {
  init();
});
// 其他地方要用到的公共变量
let posenetInput: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;
let posenetOutput: HTMLCanvasElement;
let posenetOutputCtx: CanvasRenderingContext2D;
let detector: PoseDetector;
let model: poseDetection.SupportedModels.PoseNet;

// 初始化
const init = async () => {
  // 获取 canvas 元素
  posenetOutput = document.getElementById('output') as HTMLCanvasElement;
  posenetOutputCtx = posenetOutput.getContext('2d')!;
  // 获取视频流
  posenetInput = document.getElementById('video') as HTMLVideoElement;
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true,
  });
  posenetInput.srcObject = stream;
  // 定义模型
  model = poseDetection.SupportedModels.PoseNet;
  // 加载模型
  detector = await poseDetection.createDetector(model, {
    modelType: 'full',
  });
  console.log(detector);
  // 开始检测
  detectPose();
};

async function getPose() {
  const video = document.getElementById('video') as HTMLVideoElement;
  const canvas = document.getElementById('output') as HTMLCanvasElement;
  const ctx = posenetOutput.getContext('2d')!;

  const poses = await detector.estimatePoses(posenetInput, {
    flipHorizontal: false, // 是否水平翻转
    maxPoses: 1, // 最大检测人数
    scoreThreshold: 0.5, // 置信度
    nmsRadius: 20, // 非极大值抑制
  });
}
// 开始检测
const detectPose = async () => {
  console.log('posenetInput: ', posenetInput);
  // 获取检测结果
  const poses = await detector.estimatePoses(posenetInput, {
    flipHorizontal: false, // 是否水平翻转
    maxPoses: 1, // 最大检测人数
    // scoreThreshold: 0.5, // 置信度
    // nmsRadius: 20, // 非极大值抑制
  });
  console.log(poses);
  // 将 pose 上的 17 个关键点的坐标信息存入 pointList
  const pointList = poses[0]?.keypoints || [];
  console.log('🚀🚀🚀 / pointList', pointList);

  // 绘制视频
  posenetOutputCtx.drawImage(posenetInput, 0, 0, canvas.width, canvas.height);
  // 将这 17 个关键点的坐标信息 画到 canvas 上

  // 画出所有关键点
  pointList.forEach(({ x, y, score, name }: any) => {
    if (score > 0.5) {
      // 画点
      drawPoint(x, y, 5, '#f00000', posenetOutputCtx);
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
      drawSegment([kp1.x, kp1.y], [kp2.x, kp2.y], 'aqua', 1, posenetOutputCtx);
    }
  });

  // requestAnimationFrame(() => detectPose(detector))
  setTimeout(() => {
    detectPose();
  }, 50);
};

// 画点
function drawPoint(x: number, y: number, r: number, color: string, ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
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
</script>

<style scoped></style>

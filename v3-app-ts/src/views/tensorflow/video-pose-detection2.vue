<template>
  <div>
    <canvas id="output"></canvas>
    <video id="video" playsinline autoplay width="640" height="480" v-show="1"></video>
    <!-- <video id="video" autoplay playsinline muted class="w-[360px] h-[270px] object-fill"></video> -->
    <el-button @click="onStart">开始</el-button>
  </div>
</template>

<script lang="ts" setup>
import { PoseDetector } from '@tensorflow-models/pose-detection';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import { onMounted, onUnmounted } from 'vue';

let videoEl: HTMLVideoElement;
let canvasEl: HTMLCanvasElement;
let canvasCtx: CanvasRenderingContext2D;
let detector: PoseDetector;
let model = poseDetection.SupportedModels.PoseNet;

const DEFAULT_LINE_WIDTH = 2;
const DEFAULT_RADIUS = 4;
const SCORE_THRESHOLD = 0.5;

let requestID: any; // requestAnimationFrame
function onStart() {}
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
    const { width, height } = videoEl.getBoundingClientRect();
    canvasEl.width = width;
    canvasEl.height = height;
    // 加载模型
    detector = await poseDetection.createDetector(model, {
      quantBytes: 4,
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: { width, height },
      multiplier: 0.75,
    });
    // 开始检测
    startDetect();
  };
};

// 开始检测
async function startDetect() {
  const video = document.getElementById('video') as HTMLVideoElement;

  // 检测画布动作
  const poses = await detector.estimatePoses(canvasEl, {
    flipHorizontal: false, // 是否水平翻转
    maxPoses: 1, // 最大检测人数
    // scoreThreshold: 0.5, // 置信度
    // nmsRadius: 20, // 非极大值抑制
  });
  // 绘制视频
  canvasCtx.drawImage(video, 0, 0, canvasEl.width, canvasEl.height);
  // 画第一个人的姿势
  drawKeypoints(canvasCtx, poses[0].keypoints);
  drawSkeleton(canvasCtx, poses[0].keypoints, poses.id);

  requestID = requestAnimationFrame(() => startDetect());
}
// 画点
function drawKeypoints(ctx: CanvasRenderingContext2D, keypoints) {
  const keypointInd = poseDetection.util.getKeypointIndexBySide(model);
  ctx.strokeStyle = 'White';
  ctx.lineWidth = DEFAULT_LINE_WIDTH;
  ctx.fillStyle = 'Red';

  for (const i of keypointInd.middle) {
    drawKeypoint(ctx, keypoints[i]);
  }

  ctx.fillStyle = 'Green';
  for (const i of keypointInd.left) {
    drawKeypoint(ctx, keypoints[i]);
  }

  ctx.fillStyle = 'Orange';
  for (const i of keypointInd.right) {
    drawKeypoint(ctx, keypoints[i]);
  }
}
function drawKeypoint(ctx: CanvasRenderingContext2D, keypoint) {
  // If score is null, just show the keypoint.
  const score = keypoint.score != null ? keypoint.score : 1;

  if (score >= SCORE_THRESHOLD) {
    const circle = new Path2D();
    circle.arc(keypoint.x, keypoint.y, DEFAULT_RADIUS, 0, 2 * Math.PI);
    ctx.fill(circle);
    ctx.stroke(circle);
  }
}
// 画骨架
function drawSkeleton(ctx: CanvasRenderingContext2D, keypoints: any, poseId?: any) {
  // Each poseId is mapped to a color in the color palette.
  const color = 'White';

  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = DEFAULT_LINE_WIDTH;

  poseDetection.util.getAdjacentPairs(model).forEach(([i, j]) => {
    const kp1 = keypoints[i];
    const kp2 = keypoints[j];

    // If score is null, just show the keypoint.
    const score1 = kp1.score != null ? kp1.score : 1;
    const score2 = kp2.score != null ? kp2.score : 1;

    if (score1 >= SCORE_THRESHOLD && score2 >= SCORE_THRESHOLD) {
      ctx.beginPath();
      ctx.moveTo(kp1.x, kp1.y);
      ctx.lineTo(kp2.x, kp2.y);
      ctx.stroke();
    }
  });
}
onMounted(() => {
  init();
});
onUnmounted(() => {
  detector.dispose();
  detector = null;
  cancelAnimationFrame(requestID);
});
</script>

<style scoped></style>

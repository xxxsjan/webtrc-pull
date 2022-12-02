<template>
  <div id="stats"></div>
  <el-button @click="closeStats">关闭stats</el-button>

  <div id="main">
    <div class="container">
      <div class="canvas-wrapper">
        <canvas id="output"></canvas>
        <video
          id="video"
          playsinline
          style="transform: scaleX(-1); visibility: visible; width: auto; height: auto"
        ></video>
      </div>
      <div id="scatter-gl-container"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// https://github.com/tensorflow/tfjs-models/tree/master/pose-detection/demos/live_video
import { onMounted, onUnmounted } from 'vue';
import '@tensorflow/tfjs-backend-webgl';
// import '@tensorflow/tfjs-backend-webgpu';
import * as mpPose from '@mediapipe/pose';

// import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';
// tfjsWasm.setWasmPaths(`https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${tfjsWasm.version_wasm}/dist/`);

import * as posedetection from '@tensorflow-models/pose-detection';
import { Camera } from './camera';
import { setupDatGui } from './option_panel';
import { STATE } from './params';
import { setupStats } from './stats_panel';
import { setBackendAndEnvFlags } from './util';

let detector, camera, stats, gui;
let startInferenceTime,
  numInferences = 0;
let inferenceTimeSum = 0,
  lastPanelUpdate = 0;
let rafId;
function closeStats() {}
onUnmounted(() => {
  gui.destroy();
  detector.dispose();
  detector = null;
});
async function createDetector() {
  switch (STATE.model) {
    case posedetection.SupportedModels.PoseNet:
      console.log(STATE.model, {
        quantBytes: 4,
        architecture: 'MobileNetV1',
        outputStride: 16,
        inputResolution: { width: 500, height: 500 },
        multiplier: 0.75,
      });
      return posedetection.createDetector(STATE.model, {
        quantBytes: 4,
        architecture: 'MobileNetV1',
        outputStride: 16,
        inputResolution: { width: 500, height: 500 },
        multiplier: 0.75,
      });
    case posedetection.SupportedModels.BlazePose:
      const runtime = STATE.backend.split('-')[0];
      if (runtime === 'mediapipe') {
        return posedetection.createDetector(STATE.model, {
          runtime,
          modelType: STATE.modelConfig.type,
          solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${mpPose.VERSION}`,
        });
      } else if (runtime === 'tfjs') {
        return posedetection.createDetector(STATE.model, { runtime, modelType: STATE.modelConfig.type });
      }
    case posedetection.SupportedModels.MoveNet:
      let modelType;
      if (STATE.modelConfig.type == 'lightning') {
        modelType = posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING;
      } else if (STATE.modelConfig.type == 'thunder') {
        modelType = posedetection.movenet.modelType.SINGLEPOSE_THUNDER;
      } else if (STATE.modelConfig.type == 'multipose') {
        modelType = posedetection.movenet.modelType.MULTIPOSE_LIGHTNING;
      }
      const modelConfig = { modelType };

      if (STATE.modelConfig.customModel !== '') {
        modelConfig.modelUrl = STATE.modelConfig.customModel;
      }
      if (STATE.modelConfig.type === 'multipose') {
        modelConfig.enableTracking = STATE.modelConfig.enableTracking;
      }
      return posedetection.createDetector(STATE.model, modelConfig);
  }
}

async function checkGuiUpdate() {
  if (STATE.isTargetFPSChanged || STATE.isSizeOptionChanged) {
    camera = await Camera.setupCamera(STATE.camera);
    STATE.isTargetFPSChanged = false;
    STATE.isSizeOptionChanged = false;
  }

  if (STATE.isModelChanged || STATE.isFlagChanged || STATE.isBackendChanged) {
    STATE.isModelChanged = true;

    window.cancelAnimationFrame(rafId);

    if (detector != null) {
      detector.dispose();
    }

    if (STATE.isFlagChanged || STATE.isBackendChanged) {
      await setBackendAndEnvFlags(STATE.flags, STATE.backend);
    }

    try {
      detector = await createDetector(STATE.model);
    } catch (error) {
      detector = null;
      alert(error);
    }

    STATE.isFlagChanged = false;
    STATE.isBackendChanged = false;
    STATE.isModelChanged = false;
  }
}

function beginEstimatePosesStats() {
  startInferenceTime = (performance || Date).now();
}

function endEstimatePosesStats() {
  const endInferenceTime = (performance || Date).now();
  inferenceTimeSum += endInferenceTime - startInferenceTime;

  ++numInferences;

  const panelUpdateMilliseconds = 1000;
  if (endInferenceTime - lastPanelUpdate >= panelUpdateMilliseconds) {
    const averageInferenceTime = inferenceTimeSum / numInferences;
    inferenceTimeSum = 0;
    numInferences = 0;
    stats.customFpsPanel.update(1000.0 / averageInferenceTime, 120 /* maxValue */);
    lastPanelUpdate = endInferenceTime;
  }
}

async function renderResult() {
  if (camera.video.readyState < 2) {
    await new Promise((resolve) => {
      camera.video.onloadeddata = () => {
        resolve(video);
      };
    });
  }

  let poses = null;

  // Detector can be null if initialization failed (for example when loading
  // from a URL that does not exist).
  if (detector != null) {
    // FPS only counts the time it takes to finish estimatePoses.
    beginEstimatePosesStats();

    // Detectors can throw errors, for example when using custom URLs that
    // contain a model that doesn't provide the expected output.
    try {
      poses = await detector.estimatePoses(camera.video, {
        maxPoses: STATE.modelConfig.maxPoses,
        flipHorizontal: false,
      });
    } catch (error) {
      detector.dispose();
      detector = null;
      alert(error);
    }

    endEstimatePosesStats();
  }

  camera.drawCtx();

  // The null check makes sure the UI is not in the middle of changing to a
  // different model. If during model change, the result is from an old model,
  // which shouldn't be rendered.
  if (poses && poses.length > 0 && !STATE.isModelChanged) {
    camera.drawResults(poses);
  }
}

async function renderPrediction() {
  await checkGuiUpdate();

  if (!STATE.isModelChanged) {
    await renderResult();
  }

  rafId = requestAnimationFrame(renderPrediction);
}

async function app() {
  const urlParams = new URLSearchParams('?model=posenet');
  // if (!urlParams.has('model')) {
  //   alert('Cannot find model in the query string.');
  //   return;
  // }
  
  console.log('STATE: ', STATE);
  gui = await setupDatGui(urlParams);
  console.log('STATE: ', STATE);


  !stats && (stats = setupStats());

  camera = await Camera.setupCamera(STATE.camera);

  await setBackendAndEnvFlags(STATE.flags, STATE.backend);
  console.log('STATE: ', STATE);

  detector = await createDetector();

  renderPrediction();
}
onMounted(() => {
  app();
});
</script>

<style scoped>
#stats {
  position: relative;
  width: 100%;
  height: 80px;
}
#main {
  position: relative;
  margin: 0;
}
#canvas-wrapper,
#scatter-gl-container {
  position: relative;
}
</style>

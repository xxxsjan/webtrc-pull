<template>
  <div>
    <!-- <VideoMeeting /> -->
    <!-- <VideoMeeting2 /> -->
    <MediaRecorderPage />
  </div>
</template>

<script lang="ts" setup>
import VideoMeeting from './views/VideoMeeting/index.vue';
import VideoMeeting2 from './views/VideoMeeting2.vue';
import MediaRecorderPage from './views/MediaRecorder.vue';
</script>
<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>

<template>
  <div class="WebRTC">
    <div style="margin-top: 20px">
      <p>我的画面 （{{ mineSocketId }}）</p>
      <video ref="localVideoRef" autoPlay playsInline id="localVideoRef"></video>
    </div>
    <div>
      <el-input v-model="roomId" style="width: 200px" :disabled="isJoin"></el-input>
      <el-button @click="toJoin" v-if="!isJoin">加入大厅群聊</el-button>
      <div v-else>已加入</div>
    </div>
    <div style="margin-top: 20px">
      <p>其他人的画面</p>
      <div style="display: grid; grid-template-rows: repeat(3, 1fr); grid-template-columns: repeat(3, 1fr)">
        <div v-for="user in userList" :key="user">
          <video autoPlay playsInline :id="user" width="200"></video>
          <div>{{ user }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import VideoMeeting from './VideoMeeting';
const roomId = ref('');
const localVideoRef = ref<any>(null);
const { mineSocketId, userList, isJoin, emitJoin } = VideoMeeting(localVideoRef);
function toJoin() {
  emitJoin(roomId.value);
}
</script>

<style>
.WebRTC {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>

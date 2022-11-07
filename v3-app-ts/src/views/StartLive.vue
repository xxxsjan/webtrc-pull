<template>
  <div>
    <div>
      <video ref="openVideoRef" autoPlay playsInline id="openVideoRef"></video>
    </div>
    <div>
      <button @click="onLook">看直播</button>
    </div>
    <div>
      <video ref="lookVideoRef" autoPlay playsInline width="600"></video>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { io, Socket } from 'socket.io-client';
const openVideoRef: any = ref(null);
const lookVideoRef = ref(null);
let localStream: any;
let connection1: any;
let connection2: any;
let socket: Socket | undefined = undefined;
const socketId = ref('');

async function initSocket() {
  const server = 'https://192.168.1.103:3001';
  let socket = io(server, {
    query: {
      room: 'room',
      userId: 'userId',
      nick: '昵称',
    },
  });
  socket.on('connect', async () => {
    console.log(`${socket.id}已连接`);
    socketId.value = socket.id;
  });
  socket.on('live-msg', (data) => {
    console.log(data);
  });
  socket.on('offer', (data) => {
    console.log('有观众了', data);
  });
  return socket;
}

onMounted(async () => {
  const { clientWidth } = document.documentElement;
  // getDisplayMedia getUserMedia
  localStream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: clientWidth * 0.8,
    },
    audio: false,
  });
  openVideoRef.value.srcObject = localStream;

  connection1 = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
  localStream.getTracks().forEach((track: MediaStreamTrack) => {
    connection1.addTrack(track, localStream);
  });
  connection1.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
    if (e.candidate) {
      connection2.addIceCandidate(e.candidate);
    }
  };

  connection2 = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  });
  localStream.getTracks().forEach((track: MediaStreamTrack) => {
    connection2.addTrack(track, localStream);
  });
  connection2.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
    if (e.candidate) {
      connection1.addIceCandidate(e.candidate);
    }
  };
  // 本地的话 1 2 都行
  connection1.ontrack = (track: RTCTrackEvent) => {
    console.log(track.streams[0]);
    lookVideoRef.value.srcObject = track.streams[0];
  };
});
async function onLook() {
  const offer = await connection2.createOffer();
  await connection2.setLocalDescription(offer);

  await connection1.setRemoteDescription(offer);
  const answer = await connection1.createAnswer();
  console.log(answer);
  await connection1.setLocalDescription(answer);

  connection2.setRemoteDescription(answer);
}
</script>

<style scoped></style>

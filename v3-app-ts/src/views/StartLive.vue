<template>
  <div>
    <div v-if="role === ''">
      <button @click="onClickLiver" class="btn">我是主播</button>
      <button @click="onClickAudience" class="btn">我是观众</button>
    </div>
    <div>
      <video ref="localVideoRef" autoPlay playsInline id="localVideoRef"></video>
      local
    </div>
  </div>
</template>

<script lang="ts" setup>
import 'webrtc-adapter';
import { ref, onMounted } from 'vue';
import { io, Socket } from 'socket.io-client';
const localVideoRef: any = ref(null);
let localStream: any;

let socket: Socket | undefined = undefined;

const socketId = ref('');
const role = ref('');

function onClickAudience() {
  role.value = 'audience';
  socket?.emit('enter-live', {
    roomId: '123',
    id: socketId.value,
  });
}

function sendCandidate(msg) {
  console.log('sendCandidate: ');
  socket?.emit('live-candidate', msg);
}

const pcMap = new Map();

function getPc(id: string) {
  console.log(id);
  if (pcMap.get(id)) {
    return pcMap.get(id);
  }
  console.log(id);
  const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
  localStream.getTracks().forEach((track: MediaStreamTrack) => {
    pc.addTrack(track, localStream);
  });
  pc.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
    if (e.candidate) {
      const msg = { candidate: e.candidate, origin: socketId.value, id };
      sendCandidate(msg);
    }
  };
  pc.ontrack = (track: RTCTrackEvent) => {
    if (track.track.kind === 'video') {
      const video = document.createElement('video');
      video.srcObject = track.streams[0];
      video.autoplay = true;
      video.style.setProperty('width', '400px');
      video.style.setProperty('aspect-ratio', '16 / 9');
      video.setAttribute('id', track.track.id);
      document.body.appendChild(video);
    }
    if (track.track.kind === 'audio') {
      const audio = document.createElement('audio');
      audio.srcObject = track.streams[0];
      audio.autoplay = true;
      audio.setAttribute('id', track.track.id);
      document.body.appendChild(audio);
    }
  };
  pcMap.set(id, pc);
  return pc;
}
async function onClickLiver() {
  role.value = 'liver';
  socket?.emit('open-live', {
    roomId: '123',
    openId: socketId.value,
  });
}
function initSocket() {
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
  socket.on('new', async (offerId) => {
    console.log('new: ', offerId);
    // B进来 触发A生成B的通道
    const pc = getPc(offerId);
    console.log(pcMap);
    pc.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
      if (e.candidate) {
        const msg = { candidate: e.candidate, origin: socketId.value, id: offerId };
        sendCandidate(msg);
      }
    };
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    // 发送给B
    socket.emit('live-offer', { offer, origin: socketId.value, id: offerId });
  });
  socket.on('offer', async (data) => {
    // B收到offer，建立A通道
    console.log('offer', data, data.origin);
    const pc = getPc(data.origin);
    pc.setRemoteDescription(data.offer);
    const answer = await pc.createAnswer();
    pc.setLocalDescription(answer);
    // 返回answer 给A
    socket.emit('live-answer', { answer, origin: socketId.value, id: data.origin });
  });
  socket.on('answer', async (data) => {
    console.log('answer: ', data);
    // A收到 建立B的通道
    const pc = getPc(data.origin);
    pc.setRemoteDescription(data.answer);
    console.log(data.origin, 'currentRemoteDescription', pc.currentRemoteDescription);
  });
  socket.on('candidate', (data) => {
    console.log('candidate: ', data);
    const pc = getPc(data.origin);
    pc.addIceCandidate(data.candidate);
  });
  return socket;
}

onMounted(async () => {
  const { clientWidth } = document.documentElement;
  // getDisplayMedia getUserMedia
  localStream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: clientWidth * 0.5,
    },
    audio: false,
  });
  localVideoRef.value.srcObject = localStream;
  socket = initSocket();
});
</script>

<style scoped></style>

<template>
  <div class="video-meeting">
    <div style="margin-top: 20px">
      <div>VideoMeeting2</div>
      <p>我的画面 -- {{ socketId }}</p>
      <video ref="localVideoRef" autoPlay playsInline id="localVideoRef"></video>
    </div>
    <button @click="emitJoin" v-if="!isJoin">加入大厅群聊</button>
    <div v-else>已加入</div>
    <div style="margin-top: 20px">
      <p>其他人的画面</p>
      <div style="display: grid; grid-template-rows: repeat(3, 1fr); grid-template-columns: repeat(3, 1fr)">
        <div v-for="user in userlist" :key="user">
          <video autoPlay playsInline :id="user" width="200"></video>
          <div>{{ user }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// https://juejin.cn/post/7129763930779418654
import { ref, reactive, onMounted } from 'vue';
import { io, Socket } from 'socket.io-client';

// import { v4 as uuid } from 'uuid';
// const myUserId = ref(uuid());

const localVideoRef = ref<any>(null);
const isJoin = ref(false);
const userlist = reactive([]);

const localStream = ref<any>(null);
let socket: Socket | undefined = undefined;
const socketId = ref('');
function sendMsg(eventName: string, data?: any, cb?: () => void) {
  socket?.emit(eventName, { ...data, originId: socketId.value }, cb);
}
const allConnection = new Map();
function getConnection(id: string, stream = localStream.value) {
  console.log(allConnection);
  let connection = allConnection.get(id);
  if (connection) {
    return connection;
  }
  connection = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
  stream.getTracks().forEach((track: MediaStreamTrack) => {
    connection.addTrack(track, stream);
  });
  connection.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
    if (e.candidate) {
      // 发送 candidate --> 其他端 id是其他端
      sendMsg('candidate', { sdp: e.candidate, id });
    }
  };
  if (id !== socketId.value) {
    connection.ontrack = (track: RTCTrackEvent) => {
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
  }
  allConnection.set(id, connection);
  console.log(allConnection);
  return connection;
}
async function initSocket() {
  const server = 'https://192.168.1.103:3001';
  socket = io(server, {
    query: {
      room: 'room',
      // userId通过uuid获取
      userId: 'idididi',
      nick: '昵称',
    },
  });

  socket.on('connect', async () => {
    socketId.value = socket!.id;
    console.log(`${socket!.id}已连接`);
  });

  socket.on('offer', async (offer: { sdp: RTCSessionDescription; id: string; originId: string }) => {
    console.log('-offer-', 'originId', offer.originId, 'id', offer.id);
    console.log(allConnection.get(offer.originId));
    const _connect = getConnection(offer.originId);
    await _connect.setRemoteDescription(offer.sdp);
    const answer = await _connect.createAnswer();
    await _connect.setLocalDescription(answer);
    // answer 返回 offer方
    sendMsg('answer', { sdp: answer, id: offer.originId });
  });

  socket.on('answer', async (data: { sdp: any; id: string; originId: string }) => {
    console.log('answer');
    // if (socketId.value == data.originId) return;
    const connection = getConnection(data.originId);
    await connection.setRemoteDescription(data.sdp);
  });
  // 接收其他端的candidate
  socket.on('candidate', async (data: { sdp: RTCIceCandidate; id: string; originId: string }) => {
    console.log('candidate', data);
    // if (socketId.value == data.originId) return;
    const _connect = getConnection(data.originId);
    await _connect.addIceCandidate(data.sdp);
  });

  socket.on('new', async (newId) => {
    if (newId == socketId.value) {
      console.log('加入大厅成功');
    } else {
      console.log('new user:', newId);
      const _connect = getConnection(newId);
      const offer = await _connect.createOffer();
      await _connect.setLocalDescription(offer);
      sendMsg('offer', { sdp: offer, id: newId }); // 发送offer
    }
  });
  return socket;
}
async function getLocalStream() {
  if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
    alert('你的浏览器不支持访问用户媒体设备');
    return false;
  } else {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    return stream;
  }
}
onMounted(async () => {
  const _stream = await getLocalStream();
  localStream.value = _stream;
  if (localVideoRef.value) {
    localVideoRef.value.srcObject = localStream.value;
  }
  initSocket();
});

async function emitJoin() {
  sendMsg('join');
}
</script>

<style></style>

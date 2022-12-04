import { reactive, ref, onMounted, onUnmounted, Ref } from 'vue';
import { io, Socket } from 'socket.io-client';
import ConnectWebrtc from './webrtc';

let server = 'https://192.168.1.103:3001';

const mediaStreamConstraints = {
  video: {
    width: 400,
    height: 400,
  },
  audio: false,
};
export default function VideoMeeting(localVideoRef: Ref<HTMLVideoElement> /** 播放本地流的video标签 */) {
  const isJoin = ref(false);
  //本地流
  const localStream = ref<MediaStream>();

  //保存多个连接实例对象
  const connectList = ref<{ [target: string]: any }>({});
  //连接用户的列表
  let userList: any[] = reactive([]);

  //socket.io实例
  let socket = ref<Socket>();

  //发送消息到指定对等方
  const sendMessage = (data: any, target?: string | null) => {
    console.log('sendMessage', data, target);
    socket.value?.emit('message', {
      target,
      data,
    });
  };

  // 将对等方传来的媒体流添加到指定video标签中
  const handeStreamAdd = (originId: string) => (event: any) => {
    let video = document.getElementById(originId) as HTMLVideoElement;
    if (video) {
      video.srcObject = event.streams[0];
    }
  };

  //获取与指定对等方WebRTC连接实例，如果不存在，则创建
  const getConnection = (originId: string) => {
    let connection = connectList.value?.[originId];
    if (!connection) {
      connection = new ConnectWebrtc();
      connection.create(
        handeStreamAdd(originId),
        () => {},
        (candidate: RTCIceCandidate) => {
          sendMessage(
            {
              type: 'candidate',
              label: candidate.sdpMLineIndex,
              id: candidate.sdpMid,
              candidate: candidate.candidate,
            },
            originId
          );
        }
      );

      //优先将媒体流添加到连接中
      connection.addTrack(localStream.value);
      connectList.value[originId] = connection;
    }
    return connection;
  };
  let mineSocketId = ref('');
  //创建与信令服务的socket.io连接
  const handleConnectIo = () => {
    socket.value = io(server);
    socket.value.on('connect', () => {
      mineSocketId.value = (socket.value && socket.value.id) || '';
      console.log(mineSocketId.value + '建立连接');
    });
    //监听消息
    socket.value.on('message', function (message) {
      console.log('client:message', message.data.type, message);

      // 添加对等方
      if (!userList.includes(message.originId)) {
        userList.push(message.originId);
        console.log(userList);
      }
      // originId 为 socket来源
      let connection = getConnection(message.originId);

      // 当作为接收方时，设置远端描述，并创建answer sdp
      if (message.data.type === 'offer') {
        connection.setRemoteDescription(message.data);
        connection.createAnswer((sdp: any) => {
          sendMessage(sdp, message.originId);
        });
      }
      // 当作为发起方时，收到answer sdp则设置为远端描述
      else if (message.data.type === 'answer') {
        connection.setRemoteDescription(message.data);
      }
      // 当收到候选人信息时，将候选人信息加入到连接中
      else if (message.data.type === 'candidate') {
        connection.setCandidate(message.data);
      }
    });

    // 当收到新用户加入房间时，主动发起WebRTC连接  newId --> socketId,每个socket一个
    socket.value.on('new', (newId, roomId) => {
      console.log('new', newId, mineSocketId.value);
      if (newId === mineSocketId.value) {
        console.log('加入大厅成功', roomId);
        console.log('roomId: ', roomId);
        isJoin.value = true;
      } else {
        const connection = getConnection(newId);
        connection.createOffer((sdp: RTCSessionDescription) => {
          console.log(mineSocketId.value, 'createOffer', sdp, newId);
          sendMessage(sdp, newId);
        });
        if (!userList.includes(newId)) {
          userList.push(newId);
          console.log(userList);
        }
      }
    });
  };

  //打开本地媒体设备并设置到video标签中进行播放
  const handleGetLocalStream = (callback: () => void) => {
    navigator.mediaDevices
      .getUserMedia(mediaStreamConstraints)
      .then((mediaStream) => {
        localStream.value = mediaStream;
        if (localVideoRef.value) {
          localVideoRef.value.srcObject = mediaStream;
        }
        callback();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  //   组件挂载是优先打开媒体设备然后再建立socket.io连接
  onMounted(() => {
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
      alert('你的浏览器不支持访问用户媒体设备');
    } else {
      handleGetLocalStream(handleConnectIo);
    }
  });
  onUnmounted(() => {
    socket.value?.emit('leave', mineSocketId.value);
  });
  window.addEventListener('beforeunload', function () {
    console.log('beforeunload');
    socket.value?.emit('leave', mineSocketId.value);
  });

  function emitJoin(roomId: string) {
    if (!roomId) return;
    socket.value?.emit('join', roomId);
  }

  return {
    mineSocketId,
    userList,
    isJoin,
    emitJoin,
  };
}

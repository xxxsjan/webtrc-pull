<template>
  <div>
    <div class="flex justify-center">
      <video ref="localVideoRef" autoPlay playsInline width="400" class="border-4 border-dashed"></video>
    </div>
    <div class="flex justify-center flex-col items-center">
      <div>
        <el-button @click="getStream">获取屏幕数据</el-button>
        <el-button @click="startLocalRecord">开始录制</el-button>
        <el-button @click="endLocalRecord">结束录制</el-button>
        <el-button @click="replayLocalRecord">回放视频</el-button>
        <el-button @click="downloadLocalRecord">下载视频</el-button>
      </div>
      <div class="w-1/2">
        log:
        <ul>
          <li v-for="log in logList">{{ log }}</li>
        </ul>
      </div>
      <div>
        <video id="screenVideo" autoplay muted></video>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      count: 0,
      blobMedia: [],
      screenStream: '',
      mediaRecord: '',
      logList: [],
    };
  },
  methods: {
    async getStream() {
      try {
        this.screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: 400,
          },
        });
        this.$refs.localVideoRef.srcObject = this.screenStream;
        this.logList.unshift(`获取屏幕成功`);
        this.screenStream.getVideoTracks()[0].addEventListener('ended', () => {
          this.logList.unshift('用户中断了屏幕共享');
          this.endLocalRecord();
        });
      } catch (error) {
        this.logList.unshift(`获取屏幕数据失败->${error}`);
      }
    },
    async startLocalRecord() {
      if (!this.screenStream) {
        console.log('未获取视频数据');
        this.logList.unshift(`未获取视频数据`);
        return;
      }
      this.blobMedia = [];
      try {
        this.mediaRecord = new MediaRecorder(this.screenStream, { mimeType: 'video/webm' });
        this.mediaRecord.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            this.blobMedia.push(e.data);
          }
        };
        this.mediaRecord.start(500);
        this.logList.unshift(`开始录制`);
      } catch (e) {
        this.logList.unshift(`屏幕共享失败->${e}`);
      }
    },
    async endLocalRecord() {
      if (!this.mediaRecord || this.mediaRecord.state !== 'recording') {
        this.logList.unshift('录制还未开始');
        return;
      }
      this.mediaRecord.stop();
      this.screenStream.getTracks().forEach((track) => track.stop());
    },
    async replayLocalRecord() {
      if (this.blobMedia.length) {
        const scVideo = document.querySelector('#screenVideo');
        const blob = new Blob(this.blobMedia, { type: 'video/webm' });
        if (scVideo) {
          scVideo.src = URL.createObjectURL(blob);
        }
      } else {
        this.logList.unshift('没有录制文件');
      }
    },

    async downloadLocalRecord() {
      if (!this.blobMedia.length) {
        this.logList.unshift('没有录制文件');
        return;
      }
      const blob = new Blob(this.blobMedia, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '录屏_' + Date.now() + '.webm';
      a.click();
    },
  },
};
</script>

<style>
#screenVideo {
  height: 200px;
}
</style>

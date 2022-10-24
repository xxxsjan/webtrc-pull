<template>
  <div>
    <div>
      <video ref="localVideoRef" autoPlay playsInline width="400"></video>
    </div>

    <button @click="startLocalRecord">开始录制</button>
    <button @click="endLocalRecord">结束录制</button>
    <button @click="replayLocalRecord">回放视频</button>
    <button @click="downloadLocalRecord">下载视频</button>
    <div>log: {{ logList }}</div>
    <div>
      <video id="screenVideo" autoplay muted></video>
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
    async startLocalRecord() {
      this.blobMedia = [];

      try {
        this.screenStream = await navigator.mediaDevices.getDisplayMedia();
        this.$refs.localVideoRef.srcObject = this.screenStream;

        this.screenStream.getVideoTracks()[0].addEventListener('ended', () => {
          this.logList.push('用户中断了屏幕共享');
          this.endLocalRecord();
        });

        this.mediaRecord = new MediaRecorder(this.screenStream, { mimeType: 'video/webm' });

        this.mediaRecord.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            this.blobMedia.push(e.data);
          }
        };

        this.mediaRecord.start(500);
      } catch (e) {
        this.logList.push(`屏幕共享失败->${e}`);
      }
    },
    async endLocalRecord() {
      if (!this.mediaRecord || this.mediaRecord.state !== 'recording') {
        this.logList.push('录制还未开始');
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
        this.logList.push('没有录制文件');
      }
    },

    async downloadLocalRecord() {
      if (!this.blobMedia.length) {
        this.logList.push('没有录制文件');
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

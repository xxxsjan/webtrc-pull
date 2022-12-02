const routes = {
  name: '视频相关',
  children: [
    {
      path: '/CanvasToVideo',
      name: 'CanvasToVideo',
      component: () => import('@/views/video-effect/CanvasToVideo.vue'),
    },
    {
      path: '/filter-video',
      name: 'filter-video',
      component: () => import('@/views/video-effect/filter-video.vue'),
    },
    {
      path: '/MediaRecorder',
      name: 'MediaRecorder',
      component: () => import('@/views/video-effect/MediaRecorder.vue'),
    },
  ],
};
export default routes;

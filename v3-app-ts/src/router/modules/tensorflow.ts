const tensorflowRoutes = {
  name: 'tensorflow应用',
  children: [
    {
      path: '/live-video',
      name: 'live-video',
      component: () => import('@/views/tensorflow/live-video/index.vue'),
    },
    {
      path: '/video-pose-detection',
      name: 'video-pose-detection',
      component: () => import('@/views/tensorflow/video-pose-detection.vue'),
    },
    {
      path: '/video-pose-detection2',
      name: 'video-pose-detection2',
      component: () => import('@/views/tensorflow/video-pose-detection2.vue'),
    },
    {
      path: '/video-remove-back',
      name: 'video-remove-back',
      component: () => import('@/views/tensorflow/video-remove-back.vue'),
    },
    {
      path: '/video-face-landmarks-detection',
      name: 'video-face-landmarks-detection',
      component: () => import('@/views/tensorflow/video-face-landmarks-detection.vue'),
    },
  ],
};
export default tensorflowRoutes;

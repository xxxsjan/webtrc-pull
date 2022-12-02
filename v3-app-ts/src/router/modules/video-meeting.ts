const routes = {
  name: 'webRTC',
  children: [
    {
      path: '/VideoMeeting',
      name: 'VideoMeeting',
      component: () => import('@/views/video-meeting/VideoMeeting/index.vue'),
    },
    {
      path: '/VideoMeeting2',
      name: 'VideoMeeting2',
      component: () => import('@/views/video-meeting/VideoMeeting2.vue'),
    },
    {
      path: '/StartLive',
      name: 'StartLive',
      component: () => import('@/views/video-meeting/StartLive.vue'),
    },
  ],
};
export default routes;

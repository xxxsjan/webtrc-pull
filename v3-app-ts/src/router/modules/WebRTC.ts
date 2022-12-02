const routes = {
  name: 'webRTC',
  children: [
    {
      path: '/VideoMeeting',
      name: 'VideoMeeting',
      component: () => import('@/views/WebRTC/VideoMeeting/index.vue'),
    },
    {
      path: '/VideoMeeting2',
      name: 'VideoMeeting2',
      component: () => import('@/views/WebRTC/VideoMeeting2.vue'),
    },
  ],
};
export default routes;

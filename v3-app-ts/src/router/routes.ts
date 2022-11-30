import VideoMeeting from '@/views/VideoMeeting/index.vue';
import VideoMeeting2 from '@/views/VideoMeeting2.vue';
import MediaRecorderPage from '@/views/MediaRecorder.vue';
import Layout from '@/layout.vue';
import { RouteRecordRaw } from 'vue-router';
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: Layout,
    redirect: '/VideoMeeting',
    children: [
      {
        path: '/VideoMeeting',
        name: 'VideoMeeting',
        component: VideoMeeting,
      },
      {
        path: '/video-meeting2',
        name: 'VideoMeeting2',
        component: VideoMeeting2,
      },
      {
        path: '/MediaRecorderPage',
        name: 'MediaRecorderPage',
        meta: {
          title: '视频录制',
        },
        component: MediaRecorderPage,
      },
      {
        path: '/CanvasToVideo',
        name: 'CanvasToVideo',
        component: () => import('@/views/CanvasToVideo.vue'),
      },
      {
        path: '/PortraitVideo',
        name: 'PortraitVideo',
        component: () => import('@/views/PortraitVideo.vue'),
      },
    ],
  },
];

export default routes;
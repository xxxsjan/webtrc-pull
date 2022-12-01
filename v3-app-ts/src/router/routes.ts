import VideoMeeting from '@/views/VideoMeeting/index.vue';
import Layout from '@/layout.vue';
import { RouteRecordRaw } from 'vue-router';
// import fg from 'fast-glob';
// fg.sync('**', {
//   onlyFiles: false,
//   cwd: getPath(p),
//   deep: 1,
//   ignore: ['*.md'],
// });
const _routes: RouteRecordRaw[] = [];
const files: any = require.context('../views', false, /\.vue$/);
files.keys().map((key: string) => {
  const content = files(key).default;
  if (key.match(/^.\/(.*?).vue$/)) {
    const name = key.match(/^.\/(.*?).vue$/)?.[1];
    _routes.push({
      path: '/' + name,
      name,
      component: content,
    });
  }
});

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
      ..._routes,
      {
        path: '/live-video',
        name: 'live-video',
        component: () => import('@/views/live-video/index.vue'),
      },
    ],
  },
];

export default routes;

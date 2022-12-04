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
export const modules: any = [];
const modulesFiles = require.context('./modules', false, /\.ts$/);
modulesFiles.keys().map((key) => {
  const content = modulesFiles(key).default;
  modules.push(content);
});

function flatRoutes(list: any) {
  return list.reduce((pre: any, cur: any) => {
    if (cur.children && cur.children.length > 0) {
      pre.push(...cur.children);
    } else {
      pre.push(cur);
    }
    return pre;
  }, []);
}
flatRoutes(modules);

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: Layout,
    redirect: '/VideoMeeting',
    children: [...flatRoutes(modules)],
  },
  {
    path: '/:pathMatch(.*)',
    name: 'NotFound',
    component: () => import('@/views/404.vue'),
  },
];

export default routes;

export const menuList = [...modules];

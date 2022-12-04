<template>
  <div>
    <el-menu
      :default-active="activeIndex2"
      class="el-menu-demo"
      mode="horizontal"
      background-color="#545c64"
      text-color="#fff"
      active-text-color="#ffd04b"
      router
    >
      <template v-for="item in list">
        <template v-if="item.children">
          <el-sub-menu :index="item.name" :key="item.name">
            <template #title>{{ item.name }}</template>
            <el-menu-item :index="sub.path" v-for="sub in item.children" :key="sub.name">{{
              sub?.meta?.title || sub.name
            }}</el-menu-item>
          </el-sub-menu>
        </template>
        <template v-else>
          <el-menu-item :index="item.path" :key="item.name">{{ item?.meta?.title || item.name }}</el-menu-item>
        </template>
      </template>
    </el-menu>
    <router-view></router-view>
  </div>
</template>

<script lang="ts" setup>
import { menuList } from '@/router/routes';

import { ref, computed } from 'vue';

const activeIndex2 = ref('/VideoMeeting');
console.log('menuList: ', menuList);
const list = ref(menuList);
</script>

<style scoped></style>

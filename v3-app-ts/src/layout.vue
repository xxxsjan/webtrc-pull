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
      <el-menu-item :index="item.path" v-for="item in list" :key="item.name">{{
        item?.meta?.title || item.name
      }}</el-menu-item>
    </el-menu>
    <router-view></router-view>
  </div>
</template>

<script lang="ts" setup>
import routes from '@/router/routes';
import { ref, computed } from 'vue';

const activeIndex2 = ref('/live-video');

const list = ref(routes[0].children);
</script>

<style scoped></style>

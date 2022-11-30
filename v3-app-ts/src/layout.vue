<template>
  <div>
    <div class="flex justify-center items-center">
      <div
        class="mr-10 border-b-2"
        :class="{ 'bg-red-200': routeName === item.name }"
        v-for="item in list"
        :key="item.name"
      >
        <router-link :to="item.path">{{ item?.meta?.title || item.name }}</router-link>
      </div>
    </div>
    <router-view></router-view>
  </div>
</template>

<script lang="ts" setup>
import routes from '@/router/routes';
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';

const routeName = computed(() => {
  return useRoute().name;
});

const list = ref(routes[0].children);
</script>

<style scoped></style>

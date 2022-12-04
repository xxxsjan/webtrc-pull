<template>
  <div class="h-screen flex justify-center items-center flex-col">
    <h1>404</h1>
    <h1>即将跳转首页</h1>
  </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
console.log('useRouter(): ', useRouter());
const router = useRouter();
onMounted(() => {
  setTimeout(() => {
    router.push('/');
  }, 1000);
});
</script>

<style scoped></style>

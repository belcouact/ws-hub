<template>
  <div class="responsive-layout">
    <!-- PC端布局 -->
    <AppLayout v-if="!isMobile" />
    
    <!-- 移动端布局 -->
    <MobileLayout v-else />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import AppLayout from './AppLayout.vue'
import MobileLayout from './MobileLayout.vue'

// 是否是移动端
const isMobile = ref(false)

// 移动端断点宽度
const MOBILE_BREAKPOINT = 768

// 检查是否是移动端
const checkIsMobile = () => {
  isMobile.value = window.innerWidth < MOBILE_BREAKPOINT
}

// 监听窗口大小变化
const handleResize = () => {
  checkIsMobile()
}

// 组件挂载时
onMounted(() => {
  checkIsMobile()
  window.addEventListener('resize', handleResize)
})

// 组件卸载时
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped lang="scss">
.responsive-layout {
  width: 100%;
  height: 100%;
}
</style>
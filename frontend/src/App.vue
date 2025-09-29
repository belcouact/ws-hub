<template>
  <el-container style="height:100vh">
    <el-header>
      <Header />
    </el-header>
    <el-container>
      <el-aside width="220px">
        <Sidebar />
      </el-aside>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Header from './components/Layout/Header.vue'
import Sidebar from './components/Layout/Sidebar.vue'

export default defineComponent({
  components: { Header, Sidebar }
})
</script>

<style>
html,body,#app{height:100%;margin:0}
</style>

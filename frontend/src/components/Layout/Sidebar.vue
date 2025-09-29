<template>
  <el-menu default-active="/" class="el-menu-vertical-demo" router>
    <el-menu-item index="/">Dashboard</el-menu-item>
    <el-submenu index="/knowledge">
      <template #title>Knowledge</template>
      <el-menu-item index="/knowledge">Articles</el-menu-item>
      <el-menu-item index="/knowledge/edit">Create</el-menu-item>
    </el-submenu>
    <el-submenu index="/repairs">
      <template #title>Repairs</template>
      <el-menu-item index="/repairs">List</el-menu-item>
      <el-menu-item index="/repairs/create">Create</el-menu-item>
    </el-submenu>
    <el-menu-item index="/machines">Machines</el-menu-item>
    <el-menu-item index="/technicians">Technicians</el-menu-item>
    <el-menu-item index="/search">Search</el-menu-item>
  </el-menu>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({})
</script>

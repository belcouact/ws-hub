<template>
  <el-card>
    <div style="font-size:12px;color:#888">{{ title }}</div>
    <div style="font-size:28px;font-weight:600">{{ value }}</div>
  </el-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: { title: String, value: [String, Number] }
})
</script>

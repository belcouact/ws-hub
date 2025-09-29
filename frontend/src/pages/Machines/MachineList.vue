<template>
  <div>
    <h2>Machines</h2>
    <el-table :data="machines">
      <el-table-column prop="id" label="ID"/>
      <el-table-column prop="name" label="Name"/>
    </el-table>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  setup() {
    // placeholder until backend added
    const machines = [{ id: 'm1', name: 'Cutter 3000' }, { id: 'm2', name: 'Lathe X' }]
    return { machines }
  }
})
</script>

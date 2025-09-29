<template>
  <div>
    <h2>Technicians</h2>
    <el-table :data="users">
      <el-table-column prop="username" label="Username"/>
      <el-table-column prop="name" label="Name"/>
      <el-table-column prop="role" label="Role"/>
    </el-table>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { api } from '../../services/api'

export default defineComponent({
  setup() {
    const users = ref([] as any[])
    onMounted(async () => { users.value = await api.users.list() })
    return { users }
  }
})
</script>

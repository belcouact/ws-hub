<template>
  <div>
    <h2>Repairs</h2>
    <el-button type="primary" @click="$router.push('/repairs/create')">Create Repair</el-button>
    <el-table :data="repairs" style="margin-top:12px">
      <el-table-column prop="id" label="ID" width="120"/>
      <el-table-column prop="machineId" label="Machine"/>
      <el-table-column prop="technicianId" label="Technician"/>
      <el-table-column prop="symptoms" label="Symptoms"/>
      <el-table-column label="Actions">
        <template #default="{row}">
          <el-button type="text" @click="$router.push(`/repairs/${row.id}`)">View</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { api } from '../../services/api'

export default defineComponent({
  setup() {
    const repairs = ref([] as any[])
    async function load() { const res = await api.repairs.list(); repairs.value = res.data }
    onMounted(load)
    return { repairs }
  }
})
</script>

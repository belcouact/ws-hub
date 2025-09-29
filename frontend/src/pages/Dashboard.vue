<template>
  <div>
    <h2>Dashboard</h2>
    <el-row :gutter="20">
      <el-col :span="8">
        <StatsCard title="Articles" :value="articlesCount" />
      </el-col>
      <el-col :span="8">
        <StatsCard title="Repairs" :value="repairsCount" />
      </el-col>
      <el-col :span="8">
        <StatsCard title="Technicians" :value="usersCount" />
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { api } from '../services/api'
import StatsCard from '../components/widgets/StatsCard.vue'

export default defineComponent({
  components: { StatsCard },
  setup() {
    const articlesCount = ref(0)
    const repairsCount = ref(0)
    const usersCount = ref(0)
    onMounted(async () => {
      const a = await api.articles.list()
      const r = await api.repairs.list()
      const u = await api.users.list()
      articlesCount.value = a.data.length
      repairsCount.value = r.data.length
      usersCount.value = u.length
    })
    return { articlesCount, repairsCount, usersCount }
  }
})
</script>

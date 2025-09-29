<template>
  <div>
    <h2>Search</h2>
    <el-input v-model="q" placeholder="Search articles and repairs" style="width:400px" @keyup.enter="doSearch" />
    <el-button @click="doSearch">Search</el-button>

    <div v-if="articles.length">
      <h3>Articles</h3>
      <el-list>
        <el-list-item v-for="a in articles" :key="a.id">{{ a.title }}</el-list-item>
      </el-list>
    </div>

    <div v-if="repairs.length">
      <h3>Repairs</h3>
      <el-list>
        <el-list-item v-for="r in repairs" :key="r.id">{{ r.symptoms }}</el-list-item>
      </el-list>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { api } from '../services/api'

export default defineComponent({
  setup() {
    const q = ref('')
    const articles = ref([] as any[])
    const repairs = ref([] as any[])
    async function doSearch() {
      const a = await api.articles.list(q.value)
      const r = await api.repairs.list()
      articles.value = a.data
      repairs.value = r.data.filter(x => x.symptoms.toLowerCase().includes(q.value.toLowerCase()))
    }
    return { q, doSearch, articles, repairs }
  }
})
</script>

<template>
  <div>
    <h2>Knowledge Articles</h2>
    <el-input v-model="q" placeholder="search" clearable style="width:360px;margin-bottom:12px" @input="search" />
    <el-button type="primary" @click="create">Create</el-button>
    <el-table :data="articles" style="margin-top:12px">
      <el-table-column prop="title" label="Title" />
      <el-table-column prop="authorId" label="Author" />
      <el-table-column label="Actions">
        <template #default="{row}">
          <el-button type="text" @click="view(row.id)">View</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { api } from '../../services/api'
import { useRouter } from 'vue-router'

export default defineComponent({
  setup() {
    const articles = ref([] as any[])
    const q = ref('')
    const router = useRouter()
    async function load() { const res = await api.articles.list(); articles.value = res.data }
    async function search() { const res = await api.articles.list(q.value); articles.value = res.data }
    function view(id: string) { router.push(`/knowledge/${id}`) }
    function create() { router.push('/knowledge/edit') }
    onMounted(load)
    return { articles, q, search, view, create }
  }
})
</script>

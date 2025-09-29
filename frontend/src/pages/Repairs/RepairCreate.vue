<template>
  <div style="max-width:720px">
    <h2>Create Repair</h2>
    <el-form :model="form">
      <el-form-item label="Machine ID">
        <el-input v-model="form.machineId" />
      </el-form-item>
      <el-form-item label="Symptoms">
        <el-input type="textarea" v-model="form.symptoms" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submit">Create</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue'
import { api } from '../../services/api'
import { useRouter } from 'vue-router'

export default defineComponent({
  setup() {
    const form = reactive({ machineId: 'm1', symptoms: '' })
    const router = useRouter()
    async function submit() {
      const r = await api.repairs.create(form)
      router.push(`/repairs/${r.id}`)
    }
    return { form, submit }
  }
})
</script>

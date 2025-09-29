<template>
  <div style="max-width:420px;margin:60px auto">
    <el-card>
      <h3>Sign in</h3>
      <el-form :model="form" @submit.native.prevent="submit">
        <el-form-item>
          <el-input v-model="form.username" placeholder="username" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" placeholder="password" type="password" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submit">Login</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue'
import { api } from '../services/api'
import { useAuthStore } from '../store'
import { useRouter } from 'vue-router'

export default defineComponent({
  setup() {
    const form = reactive({ username: 'alice', password: 'x' })
    const auth = useAuthStore()
    const router = useRouter()
    async function submit() {
      try {
        const res = await api.auth.login(form.username, form.password)
        auth.login(res.token, res.user)
        router.push('/')
      } catch (e) { console.error(e); alert('login failed') }
    }
    return { form, submit }
  }
})
</script>

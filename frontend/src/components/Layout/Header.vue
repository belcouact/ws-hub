<template>
  <div style="display:flex;align-items:center;justify-content:space-between">
    <div style="display:flex;align-items:center;gap:12px">
      <img src="/logo192.png" alt="logo" width="36" />
      <h3 style="margin:0;color:#fff">Tech Maintenance Hub</h3>
    </div>
    <div>
      <el-button type="text" @click="goProfile">Profile</el-button>
      <el-button type="text" @click="logout">Logout</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../store'

export default defineComponent({
  setup() {
    const router = useRouter()
    const auth = useAuthStore()
    function logout() { auth.logout(); router.push('/login') }
    function goProfile() { router.push('/technicians') }
    return { logout, goProfile }
  }
})
</script>

<style scoped>
:host{color:#fff}
el-header{background:#409EFF}
</style>

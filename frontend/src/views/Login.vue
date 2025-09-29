<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-box card">
        <div class="login-header">
          <h1>设备维修知识管理系统</h1>
          <p>欢迎使用，请登录您的账户</p>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          @keyup.enter="handleLogin"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              :prefix-icon="User"
              clearable
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              show-password
              clearable
            />
          </el-form-item>

          <el-form-item>
            <div class="form-options">
              <el-checkbox v-model="form.remember">记住我</el-checkbox>
              <el-button type="text" @click="forgotPassword">忘记密码?</el-button>
            </div>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              class="login-button"
              :loading="loading"
              @click="handleLogin"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>

        <div class="login-footer">
          <p>还没有账号? <el-button type="text" @click="goToRegister">立即注册</el-button></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 表单引用
const formRef = ref<FormInstance>()

// 加载状态
const loading = ref(false)

// 表单数据
const form = reactive({
  username: '',
  password: '',
  remember: false
})

// 表单验证规则
const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

// 处理登录
const handleLogin = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.login(form.username, form.password)
        
        ElMessage.success('登录成功')
        
        // 获取重定向地址，如果没有则默认跳转到首页
        const redirect = route.query.redirect as string || '/'
        router.replace(redirect)
      } catch (error) {
        console.error('Login failed:', error)
      } finally {
        loading.value = false
      }
    }
  })
}

// 忘记密码
const forgotPassword = () => {
  ElMessage.info('请联系管理员重置密码')
}

// 跳转到注册页面
const goToRegister = () => {
  router.push('/register')
}

// 页面加载时检查是否已登录
onMounted(() => {
  // 如果已经登录，直接跳转到首页
  if (userStore.isLoggedIn) {
    router.replace('/')
  }
})
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  
  .login-container {
    width: 100%;
    max-width: 400px;
    padding: 20px;
    
    .login-box {
      padding: 30px;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
      
      .login-header {
        text-align: center;
        margin-bottom: 30px;
        
        h1 {
          font-size: 24px;
          color: #303133;
          margin: 0 0 10px 0;
        }
        
        p {
          color: #909399;
          margin: 0;
        }
      }
      
      .form-options {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }
      
      .login-button {
        width: 100%;
        padding: 12px 0;
        font-size: 16px;
      }
      
      .login-footer {
        text-align: center;
        margin-top: 20px;
        
        p {
          color: #909399;
          margin: 0;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .login-page {
    .login-container {
      padding: 15px;
      
      .login-box {
        padding: 20px;
      }
    }
  }
}
</style>
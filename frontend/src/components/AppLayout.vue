<template>
  <div class="app-layout">
    <!-- 顶部导航栏 -->
    <el-header class="app-header" height="60px">
      <div class="header-container">
        <div class="logo-container" @click="goHome">
          <div class="logo-icon">
            <el-icon><Tools /></el-icon>
          </div>
          <div class="logo-text">
            <h1>维修知识库</h1>
          </div>
        </div>

        <div class="nav-menu">
          <el-menu
            :default-active="activeRoute"
            mode="horizontal"
            router
            :ellipsis="false"
          >
            <el-menu-item index="/">首页</el-menu-item>
            <el-menu-item index="/reports">维修报告</el-menu-item>
            <el-menu-item index="/ai-diagnose">AI诊断</el-menu-item>
            <el-menu-item v-if="userStore.isAdmin" index="/tags">标签管理</el-menu-item>
          </el-menu>
        </div>

        <div class="user-actions">
          <!-- 搜索框 -->
          <div class="search-box">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索维修报告..."
              :prefix-icon="Search"
              clearable
              @keyup.enter="handleSearch"
            />
          </div>

          <!-- 用户菜单 -->
          <el-dropdown v-if="userStore.isLoggedIn" trigger="click">
            <div class="user-avatar">
              <el-avatar :size="36" :src="userStore.currentUser?.avatar">
                {{ userStore.currentUser?.username?.charAt(0)?.toUpperCase() || 'U' }}
              </el-avatar>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="goToProfile">
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- 登录按钮 -->
          <el-button v-else type="primary" @click="goToLogin">登录</el-button>
        </div>
      </div>
    </el-header>

    <!-- 主要内容区域 -->
    <el-main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </el-main>

    <!-- 底部 -->
    <el-footer class="app-footer" height="50px">
      <div class="footer-container">
        <div class="copyright">
          © {{ currentYear }} 设备维修知识管理系统
        </div>
        <div class="footer-links">
          <a href="#" @click.prevent="showAbout">关于我们</a>
          <a href="#" @click.prevent="showHelp">使用帮助</a>
        </div>
      </div>
    </el-footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Tools, Search, User, SwitchButton } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 搜索关键词
const searchKeyword = ref('')

// 当前年份
const currentYear = computed(() => new Date().getFullYear())

// 当前激活的路由
const activeRoute = computed(() => route.path)

// 跳转到首页
const goHome = () => {
  router.push('/')
}

// 处理搜索
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  
  router.push({
    path: '/reports',
    query: { keyword: searchKeyword.value }
  })
}

// 跳转到登录页面
const goToLogin = () => {
  router.push('/login')
}

// 跳转到个人中心
const goToProfile = () => {
  router.push('/profile')
}

// 处理退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要退出登录吗?',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Logout failed:', error)
    }
  }
}

// 显示关于信息
const showAbout = () => {
  ElMessageBox.alert(
    '设备维修知识管理系统是一个基于Cloudflare免费服务构建的知识管理平台，旨在收集、整理和利用同事们的维修报告，通过AI辅助分析提供故障诊断和解决方案建议。',
    '关于我们',
    {
      confirmButtonText: '确定',
      type: 'info'
    }
  )
}

// 显示帮助信息
const showHelp = () => {
  ElMessageBox.alert(
    '使用帮助:\n\n1. 首页可以查看系统统计数据和最新报告\n2. 维修报告页面可以查看、创建和编辑维修报告\n3. AI诊断页面可以使用AI辅助分析故障问题\n4. 标签管理页面可以管理系统中的故障标签\n5. 个人中心可以管理个人信息和查看使用统计',
    '使用帮助',
    {
      confirmButtonText: '确定',
      type: 'info'
    }
  )
}

// 页面加载时初始化
onMounted(async () => {
  // 如果已登录，获取当前用户信息
  if (userStore.isLoggedIn) {
    try {
      await userStore.getCurrentUser()
    } catch (error) {
      console.error('Failed to get current user:', error)
    }
  }
})
</script>

<style scoped lang="scss">
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  
  .app-header {
    background-color: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 0;
    z-index: 1000;
    
    .header-container {
      max-width: 1400px;
      margin: 0 auto;
      height: 100%;
      display: flex;
      align-items: center;
      padding: 0 20px;
      
      .logo-container {
        display: flex;
        align-items: center;
        cursor: pointer;
        margin-right: 30px;
        
        .logo-icon {
          margin-right: 10px;
          
          .el-icon {
            font-size: 28px;
            color: #409EFF;
          }
        }
        
        .logo-text {
          h1 {
            font-size: 20px;
            color: #303133;
            margin: 0;
          }
        }
      }
      
      .nav-menu {
        flex: 1;
        
        .el-menu {
          border-bottom: none;
        }
      }
      
      .user-actions {
        display: flex;
        align-items: center;
        gap: 15px;
        
        .search-box {
          width: 200px;
          
          @media (max-width: 768px) {
            display: none;
          }
        }
        
        .user-avatar {
          cursor: pointer;
        }
      }
    }
  }
  
  .app-main {
    flex: 1;
    padding: 20px;
    background-color: #f5f7fa;
    
    @media (max-width: 768px) {
      padding: 10px;
    }
  }
  
  .app-footer {
    background-color: #fff;
    border-top: 1px solid #e4e7ed;
    
    .footer-container {
      max-width: 1400px;
      margin: 0 auto;
      height: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 20px;
      
      .copyright {
        color: #909399;
        font-size: 14px;
      }
      
      .footer-links {
        display: flex;
        gap: 20px;
        
        a {
          color: #909399;
          text-decoration: none;
          font-size: 14px;
          
          &:hover {
            color: #409EFF;
          }
        }
      }
    }
  }
}

// 页面切换动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .app-layout {
    .app-header {
      .header-container {
        .logo-container {
          margin-right: 15px;
          
          .logo-text {
            h1 {
              font-size: 16px;
            }
          }
        }
        
        .nav-menu {
          .el-menu {
            .el-menu-item {
              padding: 0 10px;
            }
          }
        }
      }
    }
    
    .app-footer {
      .footer-container {
        flex-direction: column;
        justify-content: center;
        gap: 10px;
      }
    }
  }
}
</style>
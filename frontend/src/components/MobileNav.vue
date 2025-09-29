<template>
  <div class="mobile-nav">
    <el-drawer
      v-model="drawerVisible"
      title="菜单"
      direction="ltr"
      size="70%"
      :with-header="true"
      :before-close="handleClose"
    >
      <div class="nav-content">
        <!-- 用户信息 -->
        <div v-if="userStore.isLoggedIn" class="user-info">
          <div class="user-avatar">
            <el-avatar :size="60" :src="userStore.currentUser?.avatar">
              {{ userStore.currentUser?.username?.charAt(0)?.toUpperCase() || 'U' }}
            </el-avatar>
          </div>
          <div class="user-details">
            <h3>{{ userStore.currentUser?.username }}</h3>
            <p>{{ userStore.currentUser?.email || '未设置邮箱' }}</p>
          </div>
        </div>

        <!-- 导航菜单 -->
        <el-menu
          :default-active="activeRoute"
          router
          class="nav-menu"
        >
          <el-menu-item index="/" @click="closeDrawer">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/reports" @click="closeDrawer">
            <el-icon><Document /></el-icon>
            <span>维修报告</span>
          </el-menu-item>
          <el-menu-item index="/ai-diagnose" @click="closeDrawer">
            <el-icon><MagicStick /></el-icon>
            <span>AI诊断</span>
          </el-menu-item>
          <el-menu-item v-if="userStore.isAdmin" index="/tags" @click="closeDrawer">
            <el-icon><PriceTag /></el-icon>
            <span>标签管理</span>
          </el-menu-item>
        </el-menu>

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

        <!-- 用户操作 -->
        <div class="user-actions">
          <template v-if="userStore.isLoggedIn">
            <el-button type="primary" class="action-button" @click="goToProfile">
              <el-icon><User /></el-icon>
              个人中心
            </el-button>
            <el-button type="danger" class="action-button" @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-button>
          </template>
          <template v-else>
            <el-button type="primary" class="action-button" @click="goToLogin">
              <el-icon><UserFilled /></el-icon>
              登录
            </el-button>
          </template>
        </div>

        <!-- 其他链接 -->
        <div class="other-links">
          <div class="link-item" @click="showAbout">
            <el-icon><InfoFilled /></el-icon>
            <span>关于我们</span>
          </div>
          <div class="link-item" @click="showHelp">
            <el-icon><QuestionFilled /></el-icon>
            <span>使用帮助</span>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  HomeFilled,
  Document,
  MagicStick,
  PriceTag,
  Search,
  User,
  SwitchButton,
  UserFilled,
  InfoFilled,
  QuestionFilled
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

// 定义组件属性
interface Props {
  modelValue: boolean
}

// 定义组件事件
interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

// 定义组件属性
const props = defineProps<Props>()

// 定义组件事件
const emit = defineEmits<Emits>()

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 搜索关键词
const searchKeyword = ref('')

// 抽屉可见性
const drawerVisible = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

// 当前激活的路由
const activeRoute = computed(() => route.path)

// 关闭抽屉
const closeDrawer = () => {
  drawerVisible.value = false
}

// 处理关闭
const handleClose = () => {
  closeDrawer()
}

// 处理搜索
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  
  closeDrawer()
  router.push({
    path: '/reports',
    query: { keyword: searchKeyword.value }
  })
}

// 跳转到登录页面
const goToLogin = () => {
  closeDrawer()
  router.push('/login')
}

// 跳转到个人中心
const goToProfile = () => {
  closeDrawer()
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
    
    closeDrawer()
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
</script>

<style scoped lang="scss">
.mobile-nav {
  .nav-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    
    .user-info {
      display: flex;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #ebeef5;
      
      .user-avatar {
        margin-right: 15px;
      }
      
      .user-details {
        h3 {
          font-size: 18px;
          color: #303133;
          margin: 0 0 5px 0;
        }
        
        p {
          font-size: 14px;
          color: #909399;
          margin: 0;
        }
      }
    }
    
    .nav-menu {
      border-right: none;
      margin-top: 10px;
      
      .el-menu-item {
        height: 50px;
        line-height: 50px;
        
        .el-icon {
          margin-right: 10px;
          font-size: 18px;
        }
      }
    }
    
    .search-box {
      margin: 20px;
    }
    
    .user-actions {
      margin-top: auto;
      padding: 20px;
      border-top: 1px solid #ebeef5;
      
      .action-button {
        width: 100%;
        margin-bottom: 10px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .el-icon {
          margin-right: 5px;
        }
      }
    }
    
    .other-links {
      padding: 15px 20px;
      border-top: 1px solid #ebeef5;
      
      .link-item {
        display: flex;
        align-items: center;
        padding: 10px 0;
        cursor: pointer;
        
        .el-icon {
          margin-right: 10px;
          color: #909399;
        }
        
        span {
          color: #606266;
        }
        
        &:hover {
          span {
            color: #409EFF;
          }
        }
      }
    }
  }
}
</style>
<template>
  <div class="mobile-layout">
    <!-- 顶部导航栏 -->
    <div class="mobile-header">
      <div class="header-container">
        <div class="menu-button" @click="toggleDrawer">
          <el-icon size="24"><Expand /></el-icon>
        </div>
        <div class="logo-container" @click="goHome">
          <div class="logo-text">
            <h1>维修知识库</h1>
          </div>
        </div>
        <div class="header-actions">
          <!-- 搜索按钮 -->
          <div class="search-button" @click="showSearch = true">
            <el-icon size="20"><Search /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索弹窗 -->
    <el-dialog
      v-model="showSearch"
      title="搜索"
      width="90%"
      center
      :before-close="handleSearchClose"
    >
      <div class="search-container">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索维修报告..."
          :prefix-icon="Search"
          clearable
          @keyup.enter="handleSearch"
          ref="searchInputRef"
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showSearch = false">取消</el-button>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 主要内容区域 -->
    <div class="mobile-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>

    <!-- 底部导航栏 -->
    <div class="mobile-footer">
      <div class="footer-nav">
        <div
          v-for="item in navItems"
          :key="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
          @click="navigateTo(item.path)"
        >
          <el-icon size="20">
            <component :is="item.icon" />
          </el-icon>
          <span>{{ item.title }}</span>
        </div>
      </div>
    </div>

    <!-- 移动端导航抽屉 -->
    <MobileNav v-model="drawerVisible" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Expand, Search, HomeFilled, Document, MagicStick, PriceTag, User } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import MobileNav from './MobileNav.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 抽屉可见性
const drawerVisible = ref(false)

// 搜索弹窗可见性
const showSearch = ref(false)

// 搜索关键词
const searchKeyword = ref('')

// 搜索输入框引用
const searchInputRef = ref()

// 导航项
const navItems = computed(() => {
  const items = [
    { path: '/', title: '首页', icon: HomeFilled },
    { path: '/reports', title: '报告', icon: Document },
    { path: '/ai-diagnose', title: 'AI诊断', icon: MagicStick }
  ]
  
  // 如果是管理员，添加标签管理
  if (userStore.isAdmin) {
    items.push({ path: '/tags', title: '标签', icon: PriceTag })
  }
  
  // 添加个人中心
  items.push({ path: '/profile', title: '我的', icon: User })
  
  return items
})

// 切换抽屉
const toggleDrawer = () => {
  drawerVisible.value = !drawerVisible.value
}

// 跳转到首页
const goHome = () => {
  router.push('/')
}

// 处理搜索关闭
const handleSearchClose = () => {
  showSearch.value = false
  searchKeyword.value = ''
}

// 处理搜索
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  
  showSearch.value = false
  router.push({
    path: '/reports',
    query: { keyword: searchKeyword.value }
  })
}

// 判断是否是当前路径
const isActive = (path: string) => {
  return route.path === path
}

// 导航到指定路径
const navigateTo = (path: string) => {
  router.push(path)
}

// 监听搜索弹窗显示状态，自动聚焦输入框
watch(showSearch, (newVal) => {
  if (newVal) {
    nextTick(() => {
      searchInputRef.value?.focus()
    })
  }
})
</script>

<style scoped lang="scss">
.mobile-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f7fa;
  
  .mobile-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 56px;
    background-color: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    
    .header-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 100%;
      padding: 0 15px;
      
      .menu-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        cursor: pointer;
        
        &:active {
          background-color: #f2f6fc;
        }
      }
      
      .logo-container {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        
        .logo-text {
          h1 {
            font-size: 18px;
            color: #303133;
            margin: 0;
          }
        }
      }
      
      .header-actions {
        display: flex;
        align-items: center;
        
        .search-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          
          &:active {
            background-color: #f2f6fc;
          }
        }
      }
    }
  }
  
  .mobile-main {
    flex: 1;
    padding-top: 56px;
    padding-bottom: 56px;
    overflow-y: auto;
  }
  
  .mobile-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 56px;
    background-color: #fff;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    
    .footer-nav {
      display: flex;
      height: 100%;
      
      .nav-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        
        .el-icon {
          color: #909399;
          margin-bottom: 2px;
        }
        
        span {
          font-size: 12px;
          color: #909399;
        }
        
        &.active {
          .el-icon {
            color: #409EFF;
          }
          
          span {
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

// 搜索弹窗样式
.search-container {
  margin-bottom: 20px;
}
</style>
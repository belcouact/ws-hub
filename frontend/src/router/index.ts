import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页', requiresAuth: true }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@/views/Reports.vue'),
    meta: { title: '维修报告', requiresAuth: true }
  },
  {
    path: '/reports/:id',
    name: 'ReportDetail',
    component: () => import('@/views/ReportDetail.vue'),
    meta: { title: '报告详情', requiresAuth: true }
  },
  {
    path: '/reports/create',
    name: 'CreateReport',
    component: () => import('@/views/CreateReport.vue'),
    meta: { title: '创建报告', requiresAuth: true, roles: ['editor', 'admin'] }
  },
  {
    path: '/reports/:id/edit',
    name: 'EditReport',
    component: () => import('@/views/EditReport.vue'),
    meta: { title: '编辑报告', requiresAuth: true, roles: ['editor', 'admin'] }
  },
  {
    path: '/ai/diagnose',
    name: 'AIDiagnose',
    component: () => import('@/views/AIDiagnose.vue'),
    meta: { title: 'AI诊断', requiresAuth: true }
  },
  {
    path: '/tags',
    name: 'Tags',
    component: () => import('@/views/Tags.vue'),
    meta: { title: '故障标签', requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { title: '个人中心', requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册', requiresAuth: false }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在', requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title} - 设备维修知识管理系统`
  
  const userStore = useUserStore()
  const requiresAuth = to.meta.requiresAuth as boolean
  const requiredRoles = to.meta.roles as string[] || []
  
  // 初始化用户状态
  if (!userStore.isInitialized) {
    userStore.initialize()
  }
  
  // 如果需要认证但用户未登录，重定向到登录页
  if (requiresAuth && !userStore.isLoggedIn) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
    return
  }
  
  // 如果需要特定角色但用户角色不符，重定向到首页
  if (requiredRoles.length > 0 && !requiredRoles.includes(userStore.role)) {
    next({ path: '/' })
    return
  }
  
  // 如果用户已登录但访问的是登录或注册页，重定向到首页
  if (userStore.isLoggedIn && (to.path === '/login' || to.path === '/register')) {
    next({ path: '/' })
    return
  }
  
  next()
})

export default router
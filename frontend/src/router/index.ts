import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Dashboard', component: () => import('../pages/Dashboard.vue') },
  { path: '/login', name: 'Login', component: () => import('../pages/Login.vue') },
  { path: '/knowledge', name: 'KnowledgeList', component: () => import('../pages/Knowledge/KnowledgeList.vue') },
  { path: '/knowledge/:id', name: 'KnowledgeDetail', component: () => import('../pages/Knowledge/KnowledgeList.vue') },
  { path: '/knowledge/edit/:id?', name: 'KnowledgeEditor', component: () => import('../pages/Knowledge/KnowledgeList.vue') },
  { path: '/repairs', name: 'RepairList', component: () => import('../pages/Repairs/RepairList.vue') },
  { path: '/repairs/create', name: 'RepairCreate', component: () => import('../pages/Repairs/RepairCreate.vue') },
  { path: '/repairs/:id', name: 'RepairDetail', component: () => import('../pages/Repairs/RepairDetail.vue') },
  { path: '/technicians', name: 'Technicians', component: () => import('../pages/Technicians/TechnicianList.vue') },
  { path: '/machines', name: 'Machines', component: () => import('../pages/Machines/MachineList.vue') },
  { path: '/search', name: 'Search', component: () => import('../pages/Search.vue') },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('../pages/NotFound.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

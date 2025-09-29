<template>
  <div class="profile-page">
    <div class="page-container">
      <div class="page-header">
        <h1>个人中心</h1>
        <el-button @click="$router.go(-1)">返回</el-button>
      </div>

      <div class="profile-container">
        <div class="profile-sidebar">
          <div class="user-info card">
            <div class="avatar-container">
              <el-avatar :size="80" :src="userStore.currentUser?.avatar">
                {{ userStore.currentUser?.username?.charAt(0)?.toUpperCase() || 'U' }}
              </el-avatar>
            </div>
            <div class="user-details">
              <h2>{{ userStore.currentUser?.username || '未登录' }}</h2>
              <p>{{ userStore.currentUser?.email || '未设置邮箱' }}</p>
              <el-tag :type="getRoleType(userStore.currentUser?.role)">
                {{ getRoleText(userStore.currentUser?.role) }}
              </el-tag>
            </div>
          </div>

          <div class="ai-usage card">
            <h3>AI使用统计</h3>
            <div class="usage-info">
              <div class="usage-item">
                <span class="label">今日使用次数</span>
                <span class="value">{{ aiStore.todayUsageCount || 0 }}</span>
              </div>
              <div class="usage-item">
                <span class="label">本月使用次数</span>
                <span class="value">{{ aiStore.monthUsageCount || 0 }}</span>
              </div>
              <div class="usage-item">
                <span class="label">总使用次数</span>
                <span class="value">{{ aiStore.totalUsageCount || 0 }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="profile-content">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="基本信息" name="info">
              <div class="info-form card">
                <h3>基本信息</h3>
                <el-form
                  ref="formRef"
                  :model="form"
                  :rules="rules"
                  label-width="100px"
                  label-position="top"
                >
                  <el-form-item label="用户名" prop="username">
                    <el-input
                      v-model="form.username"
                      placeholder="请输入用户名"
                      :disabled="!userStore.isAdmin"
                    />
                  </el-form-item>
                  <el-form-item label="邮箱" prop="email">
                    <el-input
                      v-model="form.email"
                      placeholder="请输入邮箱"
                    />
                  </el-form-item>
                  <el-form-item label="角色" prop="role">
                    <el-select
                      v-model="form.role"
                      placeholder="请选择角色"
                      :disabled="!userStore.isAdmin"
                    >
                      <el-option label="查看者" value="viewer" />
                      <el-option label="编辑者" value="editor" />
                      <el-option label="管理员" value="admin" />
                    </el-select>
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" :loading="submitting" @click="submitForm">
                      保存修改
                    </el-button>
                  </el-form-item>
                </el-form>
              </div>
            </el-tab-pane>

            <el-tab-pane label="修改密码" name="password">
              <div class="password-form card">
                <h3>修改密码</h3>
                <el-form
                  ref="passwordFormRef"
                  :model="passwordForm"
                  :rules="passwordRules"
                  label-width="100px"
                  label-position="top"
                >
                  <el-form-item label="当前密码" prop="currentPassword">
                    <el-input
                      v-model="passwordForm.currentPassword"
                      type="password"
                      placeholder="请输入当前密码"
                      show-password
                    />
                  </el-form-item>
                  <el-form-item label="新密码" prop="newPassword">
                    <el-input
                      v-model="passwordForm.newPassword"
                      type="password"
                      placeholder="请输入新密码"
                      show-password
                    />
                  </el-form-item>
                  <el-form-item label="确认新密码" prop="confirmPassword">
                    <el-input
                      v-model="passwordForm.confirmPassword"
                      type="password"
                      placeholder="请再次输入新密码"
                      show-password
                    />
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" :loading="changingPassword" @click="changePassword">
                      修改密码
                    </el-button>
                  </el-form-item>
                </el-form>
              </div>
            </el-tab-pane>

            <el-tab-pane label="我的报告" name="reports">
              <div class="my-reports card">
                <h3>我的报告</h3>
                <div class="filter-section">
                  <el-form :model="reportFilter" inline>
                    <el-form-item label="关键词">
                      <el-input
                        v-model="reportFilter.keyword"
                        placeholder="设备名称或描述"
                        clearable
                        @keyup.enter="fetchMyReports"
                      />
                    </el-form-item>
                    <el-form-item>
                      <el-button type="primary" @click="fetchMyReports">搜索</el-button>
                      <el-button @click="resetReportFilter">重置</el-button>
                    </el-form-item>
                  </el-form>
                </div>

                <el-table
                  v-loading="reportStore.loading"
                  :data="reportStore.reports"
                  style="width: 100%"
                >
                  <el-table-column prop="device_name" label="设备名称" min-width="150" />
                  <el-table-column prop="fault_category" label="故障类别" width="120" />
                  <el-table-column prop="created_at" label="创建时间" width="180">
                    <template #default="{ row }">
                      {{ formatDate(row.created_at) }}
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="180" fixed="right">
                    <template #default="{ row }">
                      <el-button
                        type="primary"
                        link
                        @click="viewReport(row.id)"
                      >
                        查看
                      </el-button>
                      <el-button
                        type="primary"
                        link
                        @click="editReport(row.id)"
                      >
                        编辑
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>

                <div class="pagination-container">
                  <el-pagination
                    v-model:current-page="reportPagination.page"
                    v-model:page-size="reportPagination.size"
                    :page-sizes="[10, 20, 50, 100]"
                    :total="reportPagination.total"
                    layout="total, sizes, prev, pager, next, jumper"
                    @size-change="handleReportSizeChange"
                    @current-change="handleReportCurrentChange"
                  />
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane v-if="userStore.isAdmin" label="AI使用统计" name="ai-stats">
              <div class="ai-stats card">
                <h3>AI使用统计</h3>
                <div class="stats-filter">
                  <el-form :model="statsFilter" inline>
                    <el-form-item label="用户">
                      <el-select
                        v-model="statsFilter.userId"
                        placeholder="选择用户"
                        clearable
                        filterable
                      >
                        <el-option
                          v-for="user in userStore.users"
                          :key="user.id"
                          :label="user.username"
                          :value="user.id"
                        />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="日期范围">
                      <el-date-picker
                        v-model="statsFilter.dateRange"
                        type="daterange"
                        range-separator="至"
                        start-placeholder="开始日期"
                        end-placeholder="结束日期"
                        format="YYYY-MM-DD"
                        value-format="YYYY-MM-DD"
                      />
                    </el-form-item>
                    <el-form-item>
                      <el-button type="primary" @click="fetchAIStats">查询</el-button>
                      <el-button @click="resetStatsFilter">重置</el-button>
                    </el-form-item>
                  </el-form>
                </div>

                <div v-if="aiStore.aiStats.length > 0" class="stats-table">
                  <el-table
                    :data="aiStore.aiStats"
                    style="width: 100%"
                    :default-sort="{ prop: 'request_count', order: 'descending' }"
                  >
                    <el-table-column prop="username" label="用户名" min-width="120" />
                    <el-table-column prop="usage_date" label="日期" width="120" />
                    <el-table-column prop="request_count" label="请求次数" width="120" sortable />
                    <el-table-column prop="last_request_at" label="最后请求时间" width="180">
                      <template #default="{ row }">
                        {{ row.last_request_at ? formatDateTime(row.last_request_at) : '-' }}
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
                <div v-else class="empty-stats">
                  <el-empty description="暂无统计数据" />
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useReportStore } from '@/stores/report'
import { useAIStore } from '@/stores/ai'
import { formatDate, formatDateTime } from '@/utils/date'
import type { User, AIUsageStatsParams } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const reportStore = useReportStore()
const aiStore = useAIStore()

// 当前激活的标签页
const activeTab = ref('info')

// 表单引用
const formRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()

// 提交状态
const submitting = ref(false)
const changingPassword = ref(false)

// 基本信息表单
const form = reactive({
  username: '',
  email: '',
  role: 'viewer'
})

// 密码表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 基本信息表单验证规则
const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// 密码表单验证规则
const passwordRules: FormRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 报告筛选
const reportFilter = reactive({
  keyword: ''
})

// 报告分页
const reportPagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

// AI统计筛选
const statsFilter = reactive<AIUsageStatsParams>({
  userId: undefined,
  startDate: undefined,
  endDate: undefined,
  dateRange: []
})

// 获取角色类型
const getRoleType = (role?: string) => {
  switch (role) {
    case 'admin': return 'danger'
    case 'editor': return 'warning'
    default: return 'info'
  }
}

// 获取角色文本
const getRoleText = (role?: string) => {
  switch (role) {
    case 'admin': return '管理员'
    case 'editor': return '编辑者'
    default: return '查看者'
  }
}

// 提交基本信息表单
const submitForm = async () => {
  if (!formRef.value || !userStore.currentUser) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await userStore.updateUser(userStore.currentUser.id, {
          username: form.username,
          email: form.email,
          role: form.role
        })
        ElMessage.success('个人信息更新成功')
      } catch (error) {
        console.error('Failed to update user info:', error)
      } finally {
        submitting.value = false
      }
    }
  })
}

// 修改密码
const changePassword = async () => {
  if (!passwordFormRef.value) return
  
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      changingPassword.value = true
      try {
        await userStore.changePassword({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
        ElMessage.success('密码修改成功')
        passwordFormRef.value?.resetFields()
      } catch (error) {
        console.error('Failed to change password:', error)
      } finally {
        changingPassword.value = false
      }
    }
  })
}

// 获取我的报告
const fetchMyReports = async () => {
  try {
    await reportStore.fetchReports({
      keyword: reportFilter.keyword,
      authorId: userStore.currentUser?.id,
      page: reportPagination.page,
      size: reportPagination.size
    })
    reportPagination.total = reportStore.total
  } catch (error) {
    console.error('Failed to fetch reports:', error)
  }
}

// 重置报告筛选
const resetReportFilter = () => {
  reportFilter.keyword = ''
  reportPagination.page = 1
  fetchMyReports()
}

// 处理报告分页大小变化
const handleReportSizeChange = async (val: number) => {
  reportPagination.size = val
  await fetchMyReports()
}

// 处理报告页码变化
const handleReportCurrentChange = async (val: number) => {
  reportPagination.page = val
  await fetchMyReports()
}

// 查看报告
const viewReport = (id: number) => {
  router.push(`/reports/${id}`)
}

// 编辑报告
const editReport = (id: number) => {
  router.push(`/reports/${id}/edit`)
}

// 获取AI使用统计
const fetchAIStats = async () => {
  try {
    await aiStore.fetchAIUsageStats({
      userId: statsFilter.userId,
      startDate: statsFilter.dateRange?.[0],
      endDate: statsFilter.dateRange?.[1]
    })
  } catch (error) {
    console.error('Failed to fetch AI stats:', error)
  }
}

// 重置AI统计筛选
const resetStatsFilter = () => {
  statsFilter.userId = undefined
  statsFilter.dateRange = []
  fetchAIStats()
}

// 页面加载时初始化数据
onMounted(async () => {
  try {
    // 获取当前用户信息
    await userStore.getCurrentUser()
    
    if (userStore.currentUser) {
      // 初始化表单数据
      form.username = userStore.currentUser.username
      form.email = userStore.currentUser.email || ''
      form.role = userStore.currentUser.role
      
      // 获取我的报告
      await fetchMyReports()
      
      // 获取AI使用统计
      await aiStore.fetchAIUsage()
      
      // 如果是管理员，获取用户列表
      if (userStore.isAdmin) {
        await userStore.fetchUsers()
        await fetchAIStats()
      }
    }
  } catch (error) {
    console.error('Failed to initialize profile page:', error)
  }
})
</script>

<style scoped lang="scss">
.profile-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h1 {
      font-size: 24px;
      color: #303133;
      margin: 0;
    }
  }
  
  .profile-container {
    display: flex;
    gap: 20px;
    
    .profile-sidebar {
      width: 300px;
      flex-shrink: 0;
      
      .user-info {
        .avatar-container {
          display: flex;
          justify-content: center;
          margin-bottom: 15px;
        }
        
        .user-details {
          text-align: center;
          
          h2 {
            font-size: 20px;
            color: #303133;
            margin: 0 0 5px 0;
          }
          
          p {
            color: #606266;
            margin: 0 0 10px 0;
          }
        }
      }
      
      .ai-usage {
        margin-top: 20px;
        
        h3 {
          font-size: 18px;
          color: #303133;
          margin: 0 0 15px 0;
        }
        
        .usage-info {
          .usage-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            
            &:last-child {
              margin-bottom: 0;
            }
            
            .label {
              color: #606266;
            }
            
            .value {
              font-weight: bold;
              color: #409EFF;
            }
          }
        }
      }
    }
    
    .profile-content {
      flex: 1;
      
      .info-form, .password-form, .my-reports, .ai-stats {
        h3 {
          font-size: 18px;
          color: #303133;
          margin: 0 0 20px 0;
        }
      }
      
      .filter-section {
        margin-bottom: 20px;
      }
      
      .pagination-container {
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
      }
      
      .stats-filter {
        margin-bottom: 20px;
      }
      
      .empty-stats {
        padding: 40px 0;
        text-align: center;
      }
    }
  }
}

@media (max-width: 992px) {
  .profile-page {
    .profile-container {
      flex-direction: column;
      
      .profile-sidebar {
        width: 100%;
        
        .user-info {
          display: flex;
          align-items: center;
          text-align: left;
          
          .avatar-container {
            margin-right: 20px;
            margin-bottom: 0;
          }
          
          .user-details {
            text-align: left;
          }
        }
        
        .ai-usage {
          margin-top: 20px;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .profile-page {
    .page-header {
      flex-direction: column;
      align-items: flex-start;
      
      .el-button {
        margin-top: 10px;
        width: 100%;
      }
    }
    
    .profile-container {
      .profile-sidebar {
        .user-info {
          flex-direction: column;
          text-align: center;
          
          .avatar-container {
            margin-right: 0;
            margin-bottom: 15px;
          }
          
          .user-details {
            text-align: center;
          }
        }
      }
      
      .profile-content {
        .filter-section {
          .el-form {
            .el-form-item {
              width: 100%;
              margin-right: 0;
              
              .el-input {
                width: 100%;
              }
            }
          }
        }
        
        .pagination-container {
          justify-content: center;
        }
      }
    }
  }
}
</style>
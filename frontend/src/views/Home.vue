<template>
  <div class="home-page">
    <div class="page-container">
      <div class="welcome-section card">
        <h1>欢迎使用设备维修知识管理系统</h1>
        <p>收集、整理和利用维修报告，通过AI辅助分析提供故障诊断和解决方案建议</p>
      </div>

      <div class="stats-section">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6">
            <div class="stat-card card">
              <div class="stat-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.reportsCount }}</div>
                <div class="stat-label">维修报告</div>
              </div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <div class="stat-card card">
              <div class="stat-icon">
                <el-icon><PriceTag /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.tagsCount }}</div>
                <div class="stat-label">故障标签</div>
              </div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <div class="stat-card card">
              <div class="stat-icon">
                <el-icon><User /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.usersCount }}</div>
                <div class="stat-label">注册用户</div>
              </div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <div class="stat-card card">
              <div class="stat-icon">
                <el-icon><MagicStick /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.aiUsageCount }}</div>
                <div class="stat-label">AI诊断次数</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <div class="quick-actions-section">
        <h2>快速操作</h2>
        <div class="action-buttons">
          <el-button type="primary" size="large" @click="$router.push('/reports/create')">
            <el-icon><Plus /></el-icon>
            创建维修报告
          </el-button>
          <el-button type="success" size="large" @click="$router.push('/ai/diagnose')">
            <el-icon><MagicStick /></el-icon>
            AI故障诊断
          </el-button>
          <el-button size="large" @click="$router.push('/reports')">
            <el-icon><Document /></el-icon>
            查看维修报告
          </el-button>
        </div>
      </div>

      <div class="recent-reports-section">
        <div class="section-header">
          <h2>最新维修报告</h2>
          <el-button type="text" @click="$router.push('/reports')">查看全部</el-button>
        </div>
        <div v-if="reportStore.loading && reportStore.reports.length === 0" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>
        <div v-else-if="reportStore.hasReports" class="reports-list">
          <div v-for="report in recentReports" :key="report.id" class="report-item card" @click="$router.push(`/reports/${report.id}`)">
            <div class="report-header">
              <h3>{{ report.device_name }}</h3>
              <span class="report-date">{{ formatDate(report.created_at) }}</span>
            </div>
            <div class="report-tags">
              <el-tag v-for="tag in report.fault_tags" :key="tag" size="small" class="tag-item">
                {{ tag }}
              </el-tag>
            </div>
            <div class="report-category">
              <el-tag :type="getCategoryTagType(report.fault_category)" size="small">
                {{ report.fault_category }}
              </el-tag>
            </div>
            <div class="report-description">
              {{ truncateText(report.description, 100) }}
            </div>
            <div class="report-footer">
              <span class="reporter">报告人: {{ report.reporter }}</span>
              <span v-if="report.duration_minutes" class="duration">
                耗时: {{ report.duration_minutes }}分钟
              </span>
            </div>
          </div>
        </div>
        <div v-else class="empty-container">
          <el-empty description="暂无维修报告" />
          <el-button type="primary" @click="$router.push('/reports/create')">创建第一个报告</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Document, PriceTag, User, MagicStick, Plus } from '@element-plus/icons-vue'
import { useReportStore } from '@/stores/report'
import { formatDate, truncateText } from '@/utils/date'

const reportStore = useReportStore()

// 统计数据
const stats = computed(() => ({
  reportsCount: 42, // 实际应从API获取
  tagsCount: 15,   // 实际应从API获取
  usersCount: 8,   // 实际应从API获取
  aiUsageCount: 23 // 实际应从API获取
}))

// 最新报告（只显示前5条）
const recentReports = computed(() => reportStore.reports.slice(0, 5))

// 根据故障类别获取标签类型
const getCategoryTagType = (category: string) => {
  const categoryMap: Record<string, string> = {
    '硬件故障': 'danger',
    '软件故障': 'warning',
    '网络故障': 'info',
    '其他': 'default'
  }
  return categoryMap[category] || 'default'
}

// 页面加载时获取报告列表
onMounted(async () => {
  try {
    await reportStore.fetchReports({ page: 1, size: 5 })
  } catch (error) {
    console.error('Failed to fetch reports:', error)
  }
})
</script>

<style scoped lang="scss">
.home-page {
  .welcome-section {
    text-align: center;
    padding: 30px;
    margin-bottom: 30px;
    
    h1 {
      font-size: 28px;
      margin-bottom: 15px;
      color: #303133;
    }
    
    p {
      font-size: 16px;
      color: #606266;
      line-height: 1.6;
    }
  }
  
  .stats-section {
    margin-bottom: 30px;
    
    .stat-card {
      display: flex;
      align-items: center;
      padding: 20px;
      
      .stat-icon {
        font-size: 32px;
        color: #409EFF;
        margin-right: 15px;
      }
      
      .stat-content {
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #303133;
        }
        
        .stat-label {
          font-size: 14px;
          color: #909399;
          margin-top: 5px;
        }
      }
    }
  }
  
  .quick-actions-section {
    margin-bottom: 30px;
    
    h2 {
      font-size: 20px;
      margin-bottom: 15px;
      color: #303133;
    }
    
    .action-buttons {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }
  }
  
  .recent-reports-section {
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      
      h2 {
        font-size: 20px;
        color: #303133;
      }
    }
    
    .reports-list {
      .report-item {
        margin-bottom: 15px;
        cursor: pointer;
        transition: all 0.3s;
        
        &:hover {
          box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15);
        }
        
        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          
          h3 {
            font-size: 18px;
            color: #303133;
            margin: 0;
          }
          
          .report-date {
            font-size: 14px;
            color: #909399;
          }
        }
        
        .report-tags {
          margin-bottom: 8px;
          
          .tag-item {
            margin-right: 8px;
          }
        }
        
        .report-category {
          margin-bottom: 10px;
        }
        
        .report-description {
          color: #606266;
          line-height: 1.5;
          margin-bottom: 10px;
        }
        
        .report-footer {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: #909399;
        }
      }
    }
    
    .loading-container,
    .empty-container {
      padding: 30px;
      text-align: center;
    }
  }
}

@media (max-width: 768px) {
  .home-page {
    .quick-actions-section {
      .action-buttons {
        flex-direction: column;
        
        .el-button {
          width: 100%;
        }
      }
    }
    
    .recent-reports-section {
      .report-item {
        .report-header {
          flex-direction: column;
          align-items: flex-start;
          
          .report-date {
            margin-top: 5px;
          }
        }
        
        .report-footer {
          flex-direction: column;
          align-items: flex-start;
          
          .duration {
            margin-top: 5px;
          }
        }
      }
    }
  }
}
</style>
<template>
  <div class="report-detail-page">
    <div class="page-container">
      <div v-if="reportStore.loading && !reportStore.currentReport" class="loading-container">
        <el-skeleton :rows="10" animated />
      </div>
      <div v-else-if="reportStore.currentReport" class="report-content">
        <div class="report-header card">
          <div class="header-top">
            <h1>{{ reportStore.currentReport.device_name }}</h1>
            <div class="header-actions">
              <el-button v-if="userStore.isEditor" type="primary" @click="$router.push(`/reports/${reportStore.currentReport.id}/edit`)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button v-if="userStore.isAdmin" type="danger" @click="handleDelete">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
              <el-button @click="$router.go(-1)">返回</el-button>
            </div>
          </div>
          <div class="header-meta">
            <div class="meta-item">
              <span class="label">报告人:</span>
              <span class="value">{{ reportStore.currentReport.reporter }}</span>
            </div>
            <div class="meta-item">
              <span class="label">创建时间:</span>
              <span class="value">{{ formatDate(reportStore.currentReport.created_at) }}</span>
            </div>
            <div v-if="reportStore.currentReport.updated_at !== reportStore.currentReport.created_at" class="meta-item">
              <span class="label">更新时间:</span>
              <span class="value">{{ formatDate(reportStore.currentReport.updated_at) }}</span>
            </div>
            <div v-if="reportStore.currentReport.duration_minutes" class="meta-item">
              <span class="label">维修时长:</span>
              <span class="value">{{ reportStore.currentReport.duration_minutes }} 分钟</span>
            </div>
          </div>
        </div>

        <div class="report-info card">
          <div class="info-section">
            <h2>故障类别</h2>
            <el-tag :type="getCategoryTagType(reportStore.currentReport.fault_category)" size="large">
              {{ reportStore.currentReport.fault_category }}
            </el-tag>
          </div>
          
          <div class="info-section">
            <h2>故障标签</h2>
            <div class="tags-container">
              <el-tag
                v-for="tag in reportStore.currentReport.fault_tags"
                :key="tag"
                size="large"
                class="tag-item"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </div>

        <div class="report-description card">
          <h2>故障描述与解决方案</h2>
          <div class="description-content">
            {{ reportStore.currentReport.description }}
          </div>
        </div>

        <div v-if="reportStore.currentReport.attachments && reportStore.currentReport.attachments.length > 0" class="report-attachments card">
          <h2>附件</h2>
          <div class="attachments-list">
            <div
              v-for="(attachment, index) in reportStore.currentReport.attachments"
              :key="index"
              class="attachment-item"
            >
              <el-icon><Document /></el-icon>
              <span class="attachment-name">{{ getAttachmentName(attachment) }}</span>
              <el-button type="primary" size="small" @click="downloadAttachment(attachment)">
                下载
              </el-button>
            </div>
          </div>
        </div>

        <div class="ai-analysis card">
          <h2>AI 分析</h2>
          <div class="ai-actions">
            <el-button type="primary" @click="performAIDiagnosis">
              <el-icon><MagicStick /></el-icon>
              AI 故障诊断
            </el-button>
            <el-button @click="performAISummary">
              <el-icon><Document /></el-icon>
              AI 内容摘要
            </el-button>
          </div>
          
          <div v-if="aiStore.diagnosing" class="ai-loading">
            <el-skeleton :rows="5" animated />
          </div>
          <div v-else-if="aiStore.diagnosisResult" class="ai-result">
            <div class="result-section">
              <h3>诊断结果</h3>
              <p>{{ aiStore.diagnosisResult.diagnosis }}</p>
            </div>
            
            <div v-if="aiStore.diagnosisResult.possible_causes && aiStore.diagnosisResult.possible_causes.length > 0" class="result-section">
              <h3>可能原因</h3>
              <ul>
                <li v-for="(cause, index) in aiStore.diagnosisResult.possible_causes" :key="index">
                  {{ cause }}
                </li>
              </ul>
            </div>
            
            <div v-if="aiStore.diagnosisResult.suggested_solutions && aiStore.diagnosisResult.suggested_solutions.length > 0" class="result-section">
              <h3>建议解决方案</h3>
              <ul>
                <li v-for="(solution, index) in aiStore.diagnosisResult.suggested_solutions" :key="index">
                  {{ solution }}
                </li>
              </ul>
            </div>
            
            <div class="confidence-section">
              <span>置信度: </span>
              <el-progress
                :percentage="Math.round(aiStore.diagnosisResult.confidence * 100)"
                :color="getConfidenceColor(aiStore.diagnosisResult.confidence)"
              />
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-container">
        <el-empty description="报告不存在" />
        <el-button type="primary" @click="$router.push('/reports')">返回报告列表</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete, MagicStick, Document } from '@element-plus/icons-vue'
import { useReportStore } from '@/stores/report'
import { useUserStore } from '@/stores/user'
import { useAIStore } from '@/stores/ai'
import { formatDate } from '@/utils/date'

const route = useRoute()
const router = useRouter()
const reportStore = useReportStore()
const userStore = useUserStore()
const aiStore = useAIStore()

// 获取报告ID
const reportId = computed(() => Number(route.params.id))

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

// 获取附件名称
const getAttachmentName = (attachment: string) => {
  // 从URL中提取文件名
  const urlParts = attachment.split('/')
  return urlParts[urlParts.length - 1] || '附件'
}

// 下载附件
const downloadAttachment = (attachment: string) => {
  // 实际项目中应该调用下载API
  window.open(attachment, '_blank')
}

// 获取置信度颜色
const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return '#67c23a'
  if (confidence >= 0.6) return '#e6a23c'
  return '#f56c6c'
}

// 执行AI诊断
const performAIDiagnosis = async () => {
  if (!reportStore.currentReport) return
  
  try {
    await aiStore.diagnose({
      device_name: reportStore.currentReport.device_name,
      fault_description: reportStore.currentReport.description,
      fault_tags: reportStore.currentReport.fault_tags
    })
    ElMessage.success('AI诊断完成')
  } catch (error) {
    console.error('AI诊断失败:', error)
  }
}

// 执行AI摘要
const performAISummary = async () => {
  if (!reportStore.currentReport) return
  
  try {
    // 实际项目中应该调用摘要API
    ElMessage.info('AI摘要功能开发中')
  } catch (error) {
    console.error('AI摘要失败:', error)
  }
}

// 删除报告
const handleDelete = async () => {
  if (!reportStore.currentReport) return
  
  try {
    await ElMessageBox.confirm(
      `确定要删除报告"${reportStore.currentReport.device_name}"吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await reportStore.deleteReport(reportStore.currentReport.id)
    ElMessage.success('报告已删除')
    router.push('/reports')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除报告失败:', error)
    }
  }
}

// 页面加载时获取报告详情
onMounted(async () => {
  try {
    await reportStore.fetchReportById(reportId.value)
  } catch (error) {
    console.error('Failed to fetch report:', error)
  }
})
</script>

<style scoped lang="scss">
.report-detail-page {
  .report-content {
    .report-header {
      margin-bottom: 20px;
      
      .header-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 15px;
        
        h1 {
          font-size: 28px;
          color: #303133;
          margin: 0;
        }
        
        .header-actions {
          display: flex;
          gap: 10px;
        }
      }
      
      .header-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
        
        .meta-item {
          display: flex;
          align-items: center;
          
          .label {
            color: #909399;
            margin-right: 5px;
          }
          
          .value {
            color: #606266;
          }
        }
      }
    }
    
    .report-info {
      margin-bottom: 20px;
      
      .info-section {
        margin-bottom: 20px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        h2 {
          font-size: 18px;
          color: #303133;
          margin-bottom: 10px;
        }
        
        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          
          .tag-item {
            margin-right: 0;
          }
        }
      }
    }
    
    .report-description {
      margin-bottom: 20px;
      
      h2 {
        font-size: 18px;
        color: #303133;
        margin-bottom: 15px;
      }
      
      .description-content {
        color: #606266;
        line-height: 1.8;
        white-space: pre-wrap;
      }
    }
    
    .report-attachments {
      margin-bottom: 20px;
      
      h2 {
        font-size: 18px;
        color: #303133;
        margin-bottom: 15px;
      }
      
      .attachments-list {
        .attachment-item {
          display: flex;
          align-items: center;
          padding: 10px;
          border: 1px solid #ebeef5;
          border-radius: 4px;
          margin-bottom: 10px;
          
          &:last-child {
            margin-bottom: 0;
          }
          
          .el-icon {
            margin-right: 10px;
            color: #409EFF;
          }
          
          .attachment-name {
            flex: 1;
            color: #606266;
          }
        }
      }
    }
    
    .ai-analysis {
      h2 {
        font-size: 18px;
        color: #303133;
        margin-bottom: 15px;
      }
      
      .ai-actions {
        margin-bottom: 20px;
        display: flex;
        gap: 10px;
      }
      
      .ai-loading {
        padding: 20px 0;
      }
      
      .ai-result {
        .result-section {
          margin-bottom: 20px;
          
          &:last-child {
            margin-bottom: 0;
          }
          
          h3 {
            font-size: 16px;
            color: #303133;
            margin-bottom: 10px;
          }
          
          p {
            color: #606266;
            line-height: 1.6;
          }
          
          ul {
            padding-left: 20px;
            
            li {
              color: #606266;
              line-height: 1.6;
              margin-bottom: 5px;
            }
          }
        }
        
        .confidence-section {
          display: flex;
          align-items: center;
          margin-top: 20px;
          
          span {
            margin-right: 10px;
            color: #606266;
          }
          
          .el-progress {
            flex: 1;
          }
        }
      }
    }
  }
  
  .loading-container,
  .empty-container {
    padding: 30px;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .report-detail-page {
    .report-content {
      .report-header {
        .header-top {
          flex-direction: column;
          
          .header-actions {
            margin-top: 15px;
            width: 100%;
            
            .el-button {
              flex: 1;
            }
          }
        }
        
        .header-meta {
          flex-direction: column;
          gap: 8px;
        }
      }
      
      .ai-analysis {
        .ai-actions {
          flex-direction: column;
          
          .el-button {
            width: 100%;
          }
        }
      }
    }
  }
}
</style>
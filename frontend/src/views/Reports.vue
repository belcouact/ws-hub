<template>
  <div class="reports-page">
    <div class="page-container">
      <div class="page-header">
        <h1>维修报告</h1>
        <el-button type="primary" @click="$router.push('/reports/create')">
          <el-icon><Plus /></el-icon>
          创建报告
        </el-button>
      </div>

      <div class="filters-section card">
        <el-form :model="filterForm" inline>
          <el-form-item label="关键词">
            <el-input
              v-model="filterForm.keyword"
              placeholder="搜索设备名称或描述"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="故障类别">
            <el-select v-model="filterForm.fault_category" placeholder="选择故障类别" clearable>
              <el-option label="硬件故障" value="硬件故障" />
              <el-option label="软件故障" value="软件故障" />
              <el-option label="网络故障" value="网络故障" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>
          <el-form-item label="故障标签">
            <el-select
              v-model="filterForm.tag_id"
              placeholder="选择故障标签"
              clearable
              filterable
            >
              <el-option
                v-for="tag in tagStore.tags"
                :key="tag.id"
                :label="tag.name"
                :value="tag.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="报告人">
            <el-input
              v-model="filterForm.reporter"
              placeholder="输入报告人"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="日期范围">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="reports-section">
        <div v-if="reportStore.loading && reportStore.reports.length === 0" class="loading-container">
          <el-skeleton :rows="5" animated />
        </div>
        <div v-else-if="reportStore.hasReports" class="reports-list">
          <div v-for="report in reportStore.reports" :key="report.id" class="report-item card" @click="$router.push(`/reports/${report.id}`)">
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
              {{ truncateText(report.description, 150) }}
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

        <div v-if="reportStore.hasReports" class="pagination-container">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.size"
            :page-sizes="[10, 20, 50, 100]"
            :total="reportStore.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { useReportStore } from '@/stores/report'
import { useTagStore } from '@/stores/tag'
import { formatDate, truncateText } from '@/utils/date'
import type { ReportQueryParams } from '@/types'

const reportStore = useReportStore()
const tagStore = useTagStore()

// 分页参数
const pagination = reactive({
  page: 1,
  size: 10
})

// 筛选表单
const filterForm = reactive({
  keyword: '',
  fault_category: '',
  tag_id: undefined as number | undefined,
  reporter: ''
})

// 日期范围
const dateRange = ref<[string, string] | null>(null)

// 监听日期范围变化，更新筛选表单
watch(dateRange, (newVal) => {
  if (newVal && newVal.length === 2) {
    filterForm.start_date = newVal[0]
    filterForm.end_date = newVal[1]
  } else {
    filterForm.start_date = undefined
    filterForm.end_date = undefined
  }
})

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

// 处理搜索
const handleSearch = () => {
  pagination.page = 1
  fetchReports()
}

// 重置筛选条件
const resetFilters = () => {
  Object.assign(filterForm, {
    keyword: '',
    fault_category: '',
    tag_id: undefined,
    reporter: ''
  })
  dateRange.value = null
  pagination.page = 1
  fetchReports()
}

// 处理页码变化
const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchReports()
}

// 处理每页条数变化
const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.page = 1
  fetchReports()
}

// 获取报告列表
const fetchReports = async () => {
  try {
    const params: ReportQueryParams = {
      page: pagination.page,
      size: pagination.size,
      keyword: filterForm.keyword || undefined,
      fault_category: filterForm.fault_category || undefined,
      tag_id: filterForm.tag_id,
      reporter: filterForm.reporter || undefined,
      start_date: filterForm.start_date,
      end_date: filterForm.end_date
    }
    
    await reportStore.fetchReports(params)
  } catch (error) {
    console.error('Failed to fetch reports:', error)
  }
}

// 页面加载时获取数据
onMounted(async () => {
  try {
    await Promise.all([
      fetchReports(),
      tagStore.fetchTags()
    ])
  } catch (error) {
    console.error('Failed to initialize data:', error)
  }
})
</script>

<style scoped lang="scss">
.reports-page {
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
  
  .filters-section {
    margin-bottom: 20px;
    padding: 15px;
  }
  
  .reports-section {
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
    
    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: center;
    }
  }
}

@media (max-width: 768px) {
  .reports-page {
    .page-header {
      flex-direction: column;
      align-items: flex-start;
      
      .el-button {
        margin-top: 10px;
        width: 100%;
      }
    }
    
    .filters-section {
      .el-form {
        .el-form-item {
          width: 100%;
          margin-right: 0;
          margin-bottom: 10px;
          
          .el-select,
          .el-date-editor {
            width: 100%;
          }
        }
      }
    }
    
    .reports-section {
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
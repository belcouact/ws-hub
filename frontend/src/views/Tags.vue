<template>
  <div class="tags-page">
    <div class="page-container">
      <div class="page-header">
        <h1>故障标签管理</h1>
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新建标签
        </el-button>
      </div>

      <div class="tags-container">
        <div class="filter-section card">
          <el-form :model="filterForm" inline>
            <el-form-item label="搜索标签">
              <el-input
                v-model="filterForm.keyword"
                placeholder="输入标签名称"
                clearable
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">搜索</el-button>
              <el-button @click="resetFilter">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="tags-list card">
          <el-table
            v-loading="tagStore.loading"
            :data="tagStore.tags"
            style="width: 100%"
            :default-sort="{ prop: 'usage_count', order: 'descending' }"
          >
            <el-table-column prop="name" label="标签名称" min-width="150">
              <template #default="{ row }">
                <el-tag :color="row.color" effect="dark">{{ row.name }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="color" label="颜色" width="100">
              <template #default="{ row }">
                <div class="color-preview" :style="{ backgroundColor: row.color }"></div>
              </template>
            </el-table-column>
            <el-table-column prop="usage_count" label="使用次数" width="120" sortable>
              <template #default="{ row }">
                <el-tag type="info">{{ row.usage_count }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  link
                  @click="handleEdit(row)"
                >
                  编辑
                </el-button>
                <el-button
                  type="danger"
                  link
                  @click="handleDelete(row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-container">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.size"
              :page-sizes="[10, 20, 50, 100]"
              :total="pagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑标签对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingTag ? '编辑标签' : '新建标签'"
      width="500px"
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="标签名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入标签名称"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="标签颜色" prop="color">
          <div class="color-picker-container">
            <el-color-picker v-model="form.color" show-alpha />
            <el-input
              v-model="form.color"
              placeholder="请输入颜色值"
              style="margin-left: 10px; flex: 1"
            >
              <template #append>
                <el-button @click="randomColor">随机</el-button>
              </template>
            </el-input>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submitForm">
            {{ editingTag ? '更新' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useTagStore } from '@/stores/tag'
import type { FaultTag } from '@/types'

const tagStore = useTagStore()

// 对话框状态
const showCreateDialog = ref(false)
const editingTag = ref<FaultTag | null>(null)
const submitting = ref(false)

// 表单引用
const formRef = ref<FormInstance>()

// 表单数据
const form = reactive({
  name: '',
  color: '#409EFF'
})

// 表单验证规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { min: 1, max: 20, message: '标签名称长度在 1 到 20 个字符', trigger: 'blur' }
  ],
  color: [
    { required: true, message: '请选择标签颜色', trigger: 'change' }
  ]
}

// 筛选表单
const filterForm = reactive({
  keyword: ''
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 处理搜索
const handleSearch = async () => {
  pagination.page = 1
  await fetchTags()
}

// 重置筛选条件
const resetFilter = () => {
  filterForm.keyword = ''
  handleSearch()
}

// 处理分页大小变化
const handleSizeChange = async (val: number) => {
  pagination.size = val
  await fetchTags()
}

// 处理页码变化
const handleCurrentChange = async (val: number) => {
  pagination.page = val
  await fetchTags()
}

// 获取标签列表
const fetchTags = async () => {
  try {
    await tagStore.fetchTags({
      keyword: filterForm.keyword,
      page: pagination.page,
      size: pagination.size
    })
    pagination.total = tagStore.total
  } catch (error) {
    console.error('Failed to fetch tags:', error)
  }
}

// 处理编辑标签
const handleEdit = (tag: FaultTag) => {
  editingTag.value = tag
  form.name = tag.name
  form.color = tag.color
  showCreateDialog.value = true
}

// 处理删除标签
const handleDelete = async (tag: FaultTag) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除标签 "${tag.name}" 吗？此操作不可撤销。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await tagStore.deleteTag(tag.id)
    ElMessage.success('标签删除成功')
    await fetchTags()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete tag:', error)
    }
  }
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  form.name = ''
  form.color = '#409EFF'
  editingTag.value = null
  submitting.value = false
}

// 生成随机颜色
const randomColor = () => {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  form.color = color
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (editingTag.value) {
          // 更新标签
          await tagStore.updateTag(editingTag.value.id, {
            name: form.name,
            color: form.color
          })
          ElMessage.success('标签更新成功')
        } else {
          // 创建标签
          await tagStore.createTag({
            name: form.name,
            color: form.color
          })
          ElMessage.success('标签创建成功')
        }
        
        showCreateDialog.value = false
        await fetchTags()
      } catch (error) {
        console.error('Failed to submit form:', error)
      } finally {
        submitting.value = false
      }
    }
  })
}

// 页面加载时获取标签列表
onMounted(async () => {
  await fetchTags()
})
</script>

<style scoped lang="scss">
.tags-page {
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
  
  .tags-container {
    .filter-section {
      margin-bottom: 20px;
    }
    
    .tags-list {
      .color-preview {
        width: 30px;
        height: 20px;
        border-radius: 4px;
        display: inline-block;
      }
      
      .pagination-container {
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
      }
    }
  }
}

.color-picker-container {
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  .tags-page {
    .page-header {
      flex-direction: column;
      align-items: flex-start;
      
      .el-button {
        margin-top: 10px;
        width: 100%;
      }
    }
    
    .tags-container {
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
      
      .tags-list {
        .pagination-container {
          justify-content: center;
        }
      }
    }
  }
}
</style>
<template>
  <div class="create-report-page">
    <div class="page-container">
      <div class="page-header">
        <h1>创建维修报告</h1>
        <el-button @click="$router.go(-1)">返回</el-button>
      </div>

      <div class="form-container card">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="120px"
          label-position="top"
        >
          <el-form-item label="设备名称" prop="device_name">
            <el-input
              v-model="form.device_name"
              placeholder="请输入设备名称"
              clearable
            />
          </el-form-item>

          <el-form-item label="故障类别" prop="fault_category">
            <el-select
              v-model="form.fault_category"
              placeholder="请选择故障类别"
              clearable
              style="width: 100%"
            >
              <el-option label="硬件故障" value="硬件故障" />
              <el-option label="软件故障" value="软件故障" />
              <el-option label="网络故障" value="网络故障" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>

          <el-form-item label="故障标签" prop="fault_tags">
            <div class="tags-container">
              <div class="tags-input">
                <el-select
                  v-model="selectedTag"
                  placeholder="选择或创建标签"
                  filterable
                  allow-create
                  default-first-option
                  clearable
                  @change="handleTagChange"
                >
                  <el-option
                    v-for="tag in tagStore.tags"
                    :key="tag.id"
                    :label="tag.name"
                    :value="tag.name"
                  />
                </el-select>
              </div>
              <div class="selected-tags">
                <el-tag
                  v-for="(tag, index) in form.fault_tags"
                  :key="index"
                  closable
                  @close="removeTag(index)"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </el-form-item>

          <el-form-item label="维修时长（分钟）" prop="duration_minutes">
            <el-input-number
              v-model="form.duration_minutes"
              :min="1"
              :max="1440"
              placeholder="请输入维修时长"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="故障描述与解决方案" prop="description">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="8"
              placeholder="请详细描述故障现象、原因分析以及解决方案"
              show-word-limit
              maxlength="5000"
            />
          </el-form-item>

          <el-form-item label="附件">
            <el-upload
              action="#"
              :auto-upload="false"
              :file-list="fileList"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              multiple
              limit="5"
            >
              <el-button type="primary">
                <el-icon><Upload /></el-icon>
                上传附件
              </el-button>
              <template #tip>
                <div class="el-upload__tip">
                  支持任意类型文件，单个文件不超过10MB，最多上传5个文件
                </div>
              </template>
            </el-upload>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="submitting" @click="submitForm">
              提交报告
            </el-button>
            <el-button @click="resetForm">重置</el-button>
            <el-button @click="$router.go(-1)">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules, type UploadFile, type UploadFiles } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'
import { useReportStore } from '@/stores/report'
import { useTagStore } from '@/stores/tag'
import type { CreateReportParams } from '@/types'

const router = useRouter()
const reportStore = useReportStore()
const tagStore = useTagStore()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const selectedTag = ref('')
const fileList = ref<UploadFile[]>([])

// 表单数据
const form = reactive<CreateReportParams>({
  device_name: '',
  fault_tags: [],
  duration_minutes: undefined,
  fault_category: '',
  description: '',
  attachments: []
})

// 表单验证规则
const rules: FormRules = {
  device_name: [
    { required: true, message: '请输入设备名称', trigger: 'blur' },
    { min: 2, max: 100, message: '设备名称长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  fault_category: [
    { required: true, message: '请选择故障类别', trigger: 'change' }
  ],
  fault_tags: [
    { required: true, message: '请至少选择一个故障标签', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入故障描述与解决方案', trigger: 'blur' },
    { min: 10, max: 5000, message: '描述长度在 10 到 5000 个字符', trigger: 'blur' }
  ]
}

// 处理标签变化
const handleTagChange = (value: string) => {
  if (value && !form.fault_tags.includes(value)) {
    form.fault_tags.push(value)
  }
  selectedTag.value = ''
}

// 移除标签
const removeTag = (index: number) => {
  form.fault_tags.splice(index, 1)
}

// 处理文件变化
const handleFileChange = (file: UploadFile, uploadFiles: UploadFiles) => {
  fileList.value = uploadFiles
  // 实际项目中应该处理文件上传逻辑
}

// 处理文件移除
const handleFileRemove = (file: UploadFile, uploadFiles: UploadFiles) => {
  fileList.value = uploadFiles
  // 实际项目中应该处理文件删除逻辑
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        // 处理附件
        if (fileList.value.length > 0) {
          // 实际项目中应该上传文件并获取URL
          // 这里只是模拟
          form.attachments = fileList.value.map(file => `https://example.com/attachments/${file.name}`)
        }
        
        await reportStore.createReport(form)
        ElMessage.success('报告创建成功')
        router.push('/reports')
      } catch (error) {
        console.error('Failed to create report:', error)
      } finally {
        submitting.value = false
      }
    }
  })
}

// 重置表单
const resetForm = () => {
  if (!formRef.value) return
  
  formRef.value.resetFields()
  fileList.value = []
}

// 页面加载时获取标签列表
onMounted(async () => {
  try {
    await tagStore.fetchTags()
  } catch (error) {
    console.error('Failed to fetch tags:', error)
  }
})
</script>

<style scoped lang="scss">
.create-report-page {
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
  
  .form-container {
    max-width: 800px;
    margin: 0 auto;
    
    .tags-container {
      width: 100%;
      
      .tags-input {
        margin-bottom: 10px;
      }
      
      .selected-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        
        .el-tag {
          margin-right: 0;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .create-report-page {
    .page-header {
      flex-direction: column;
      align-items: flex-start;
      
      .el-button {
        margin-top: 10px;
        width: 100%;
      }
    }
    
    .form-container {
      .el-form {
        .el-form-item {
          margin-bottom: 20px;
        }
      }
    }
  }
}
</style>
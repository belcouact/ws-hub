<template>
  <div class="file-uploader">
    <el-upload
      ref="uploadRef"
      :action="uploadUrl"
      :headers="headers"
      :multiple="multiple"
      :limit="limit"
      :file-list="fileList"
      :before-upload="beforeUpload"
      :on-success="handleSuccess"
      :on-error="handleError"
      :on-exceed="handleExceed"
      :on-remove="handleRemove"
      :auto-upload="autoUpload"
      :disabled="disabled"
      :drag="drag"
      :accept="accept"
      :data="uploadData"
    >
      <template v-if="drag">
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
      </template>
      <template v-else>
        <el-button type="primary" :disabled="disabled">
          <el-icon><upload /></el-icon>
          {{ buttonText }}
        </el-button>
      </template>
      
      <template #tip>
        <div class="el-upload__tip" v-if="tip">
          {{ tip }}
        </div>
      </template>
    </el-upload>

    <!-- 文件预览 -->
    <div v-if="showPreview && previewFiles.length > 0" class="file-preview">
      <h3>文件预览</h3>
      <div class="preview-list">
        <div v-for="(file, index) in previewFiles" :key="index" class="preview-item">
          <div class="preview-info">
            <div class="file-icon">
              <el-icon><document /></el-icon>
            </div>
            <div class="file-details">
              <div class="file-name" :title="file.name">{{ file.name }}</div>
              <div class="file-size">{{ formatFileSize(file.size) }}</div>
            </div>
          </div>
          <div class="preview-actions">
            <el-button type="primary" link @click="downloadFile(file)">
              <el-icon><download /></el-icon>
            </el-button>
            <el-button type="danger" link @click="removeFile(file)">
              <el-icon><delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload, UploadFilled, Document, Download, Delete } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import type { UploadInstance, UploadFile, UploadFiles, UploadRawFile } from 'element-plus'

// 定义组件属性
interface Props {
  modelValue?: UploadFiles
  multiple?: boolean
  limit?: number
  disabled?: boolean
  drag?: boolean
  autoUpload?: boolean
  accept?: string
  buttonText?: string
  tip?: string
  showPreview?: boolean
  maxSize?: number // 单位：MB
  uploadUrl?: string
  uploadData?: Record<string, any>
}

// 定义组件事件
interface Emits {
  (e: 'update:modelValue', files: UploadFiles): void
  (e: 'success', response: any, file: UploadFile, files: UploadFiles): void
  (e: 'error', error: Error, file: UploadFile, files: UploadFiles): void
  (e: 'remove', file: UploadFile, files: UploadFiles): void
  (e: 'exceed', files: UploadFiles, filesLimit: number): void
}

// 定义组件属性默认值
const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  multiple: true,
  limit: 5,
  disabled: false,
  drag: true,
  autoUpload: true,
  accept: '',
  buttonText: '上传文件',
  tip: '',
  showPreview: true,
  maxSize: 10, // 默认10MB
  uploadUrl: '/api/v1/upload',
  uploadData: () => ({})
})

// 定义组件事件
const emit = defineEmits<Emits>()

// 引用
const uploadRef = ref<UploadInstance>()
const userStore = useUserStore()

// 计算属性
const fileList = computed<UploadFiles>({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

// 预览文件列表
const previewFiles = computed<UploadFiles>(() => {
  return fileList.value.filter(file => file.status === 'success')
})

// 请求头
const headers = computed(() => {
  return {
    Authorization: `Bearer ${userStore.token}`
  }
})

// 监听文件列表变化
watch(fileList, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })

// 上传前校验
const beforeUpload = (file: UploadRawFile) => {
  // 校验文件大小
  if (props.maxSize && file.size > props.maxSize * 1024 * 1024) {
    ElMessage.error(`文件大小不能超过 ${props.maxSize}MB`)
    return false
  }
  
  // 校验文件类型
  if (props.accept) {
    const acceptTypes = props.accept.split(',').map(type => type.trim())
    const fileExtension = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase()
    const isValidType = acceptTypes.some(type => {
      if (type.startsWith('.')) {
        return `.${fileExtension}` === type.toLowerCase()
      } else if (type.includes('/*')) {
        const mimeType = file.type
        const mainType = type.split('/*')[0]
        return mimeType.startsWith(mainType)
      } else {
        return file.type === type
      }
    })
    
    if (!isValidType) {
      ElMessage.error(`文件类型不支持，请上传 ${props.accept} 格式的文件`)
      return false
    }
  }
  
  return true
}

// 上传成功
const handleSuccess = (response: any, file: UploadFile, files: UploadFiles) => {
  if (response.success) {
    // 更新文件URL
    file.url = response.data.url
    ElMessage.success('文件上传成功')
  } else {
    file.status = 'fail'
    ElMessage.error(response.message || '文件上传失败')
  }
  
  emit('success', response, file, files)
}

// 上传失败
const handleError = (error: Error, file: UploadFile, files: UploadFiles) => {
  file.status = 'fail'
  ElMessage.error('文件上传失败')
  emit('error', error, file, files)
}

// 文件超出限制
const handleExceed = (files: UploadFiles, filesLimit: number) => {
  ElMessage.warning(`最多只能上传 ${filesLimit} 个文件`)
  emit('exceed', files, filesLimit)
}

// 移除文件
const handleRemove = (file: UploadFile, files: UploadFiles) => {
  emit('remove', file, files)
}

// 格式化文件大小
const formatFileSize = (size: number) => {
  if (size < 1024) {
    return `${size} B`
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`
  } else {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`
  }
}

// 下载文件
const downloadFile = (file: UploadFile) => {
  if (file.url) {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } else {
    ElMessage.error('文件下载链接不存在')
  }
}

// 移除文件
const removeFile = (file: UploadFile) => {
  const index = fileList.value.findIndex(item => item.uid === file.uid)
  if (index !== -1) {
    fileList.value.splice(index, 1)
  }
}

// 暴露方法
defineExpose({
  uploadRef,
  clearFiles: () => uploadRef.value?.clearFiles(),
  submit: () => uploadRef.value?.submit(),
  abort: (file?: UploadFile) => uploadRef.value?.abort(file)
})
</script>

<style scoped lang="scss">
.file-uploader {
  .file-preview {
    margin-top: 20px;
    
    h3 {
      font-size: 16px;
      color: #303133;
      margin: 0 0 15px 0;
    }
    
    .preview-list {
      .preview-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        border: 1px solid #ebeef5;
        border-radius: 4px;
        margin-bottom: 10px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .preview-info {
          display: flex;
          align-items: center;
          flex: 1;
          
          .file-icon {
            margin-right: 10px;
            color: #409EFF;
          }
          
          .file-details {
            .file-name {
              font-size: 14px;
              color: #303133;
              max-width: 300px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            
            .file-size {
              font-size: 12px;
              color: #909399;
              margin-top: 4px;
            }
          }
        }
        
        .preview-actions {
          display: flex;
          gap: 5px;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .file-uploader {
    .file-preview {
      .preview-list {
        .preview-item {
          .preview-info {
            .file-details {
              .file-name {
                max-width: 150px;
              }
            }
          }
        }
      }
    }
  }
}
</style>
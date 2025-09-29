<template>
  <div class="ai-diagnose-page">
    <div class="page-container">
      <div class="page-header">
        <h1>AI 故障诊断</h1>
        <el-button @click="$router.go(-1)">返回</el-button>
      </div>

      <div class="diagnose-container">
        <div class="input-section card">
          <h2>故障信息</h2>
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

            <el-form-item label="故障描述" prop="fault_description">
              <el-input
                v-model="form.fault_description"
                type="textarea"
                :rows="6"
                placeholder="请详细描述故障现象"
                show-word-limit
                maxlength="2000"
              />
            </el-form-item>

            <el-form-item label="故障标签（可选）">
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

            <el-form-item>
              <el-button type="primary" :loading="aiStore.diagnosing" @click="submitDiagnose">
                <el-icon><MagicStick /></el-icon>
                开始诊断
              </el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div v-if="aiStore.diagnosing" class="result-section card">
          <h2>诊断结果</h2>
          <div class="ai-loading">
            <el-skeleton :rows="8" animated />
            <div class="loading-text">AI正在分析中，请稍候...</div>
          </div>
        </div>

        <div v-else-if="aiStore.diagnosisResult" class="result-section card">
          <h2>诊断结果</h2>
          <div class="ai-result">
            <div class="result-header">
              <div class="device-info">
                <h3>{{ form.device_name }}</h3>
                <div class="tags">
                  <el-tag
                    v-for="tag in form.fault_tags"
                    :key="tag"
                    size="small"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </div>
              <div class="confidence-section">
                <span>置信度: </span>
                <el-progress
                  :percentage="Math.round(aiStore.diagnosisResult.confidence * 100)"
                  :color="getConfidenceColor(aiStore.diagnosisResult.confidence)"
                />
              </div>
            </div>

            <div class="result-content">
              <div class="result-block">
                <h3>诊断结果</h3>
                <div class="result-text">{{ aiStore.diagnosisResult.diagnosis }}</div>
              </div>

              <div v-if="aiStore.diagnosisResult.possible_causes && aiStore.diagnosisResult.possible_causes.length > 0" class="result-block">
                <h3>可能原因</h3>
                <ul class="result-list">
                  <li v-for="(cause, index) in aiStore.diagnosisResult.possible_causes" :key="index">
                    {{ cause }}
                  </li>
                </ul>
              </div>

              <div v-if="aiStore.diagnosisResult.suggested_solutions && aiStore.diagnosisResult.suggested_solutions.length > 0" class="result-block">
                <h3>建议解决方案</h3>
                <ul class="result-list">
                  <li v-for="(solution, index) in aiStore.diagnosisResult.suggested_solutions" :key="index">
                    {{ solution }}
                  </li>
                </ul>
              </div>
            </div>

            <div class="result-actions">
              <el-button type="primary" @click="createReportFromDiagnosis">
                <el-icon><Document /></el-icon>
                基于诊断结果创建报告
              </el-button>
              <el-button @click="copyResult">复制结果</el-button>
              <el-button @click="resetDiagnosis">重新诊断</el-button>
            </div>
          </div>
        </div>

        <div v-else class="tips-section card">
          <h2>使用提示</h2>
          <div class="tips-content">
            <el-alert
              title="AI诊断功能使用说明"
              type="info"
              :closable="false"
              show-icon
            >
              <ul>
                <li>请尽可能详细地描述故障现象，包括设备型号、故障发生时的具体情况等</li>
                <li>添加相关的故障标签可以帮助AI更准确地定位问题</li>
                <li>AI诊断结果仅供参考，实际维修请结合专业知识和经验</li>
                <li>您可以将诊断结果保存为维修报告，方便后续查阅和分享</li>
              </ul>
            </el-alert>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { MagicStick, Document } from '@element-plus/icons-vue'
import { useAIStore } from '@/stores/ai'
import { useTagStore } from '@/stores/tag'
import { useReportStore } from '@/stores/report'
import type { AIDiagnoseParams } from '@/types'

const router = useRouter()
const aiStore = useAIStore()
const tagStore = useTagStore()
const reportStore = useReportStore()

const formRef = ref<FormInstance>()
const selectedTag = ref('')

// 表单数据
const form = reactive<AIDiagnoseParams>({
  device_name: '',
  fault_description: '',
  fault_tags: []
})

// 表单验证规则
const rules: FormRules = {
  device_name: [
    { required: true, message: '请输入设备名称', trigger: 'blur' },
    { min: 2, max: 100, message: '设备名称长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  fault_description: [
    { required: true, message: '请输入故障描述', trigger: 'blur' },
    { min: 10, max: 2000, message: '描述长度在 10 到 2000 个字符', trigger: 'blur' }
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

// 获取置信度颜色
const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return '#67c23a'
  if (confidence >= 0.6) return '#e6a23c'
  return '#f56c6c'
}

// 提交诊断
const submitDiagnose = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await aiStore.diagnose(form)
        ElMessage.success('AI诊断完成')
      } catch (error) {
        console.error('AI诊断失败:', error)
      }
    }
  })
}

// 重置表单
const resetForm = () => {
  if (!formRef.value) return
  
  formRef.value.resetFields()
  aiStore.clearDiagnosisResult()
}

// 重置诊断结果
const resetDiagnosis = () => {
  aiStore.clearDiagnosisResult()
}

// 复制结果
const copyResult = () => {
  if (!aiStore.diagnosisResult) return
  
  let resultText = `设备名称: ${form.device_name}\n\n`
  resultText += `诊断结果:\n${aiStore.diagnosisResult.diagnosis}\n\n`
  
  if (aiStore.diagnosisResult.possible_causes && aiStore.diagnosisResult.possible_causes.length > 0) {
    resultText += `可能原因:\n`
    aiStore.diagnosisResult.possible_causes.forEach(cause => {
      resultText += `- ${cause}\n`
    })
    resultText += '\n'
  }
  
  if (aiStore.diagnosisResult.suggested_solutions && aiStore.diagnosisResult.suggested_solutions.length > 0) {
    resultText += `建议解决方案:\n`
    aiStore.diagnosisResult.suggested_solutions.forEach(solution => {
      resultText += `- ${solution}\n`
    })
  }
  
  // 复制到剪贴板
  navigator.clipboard.writeText(resultText).then(() => {
    ElMessage.success('结果已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败，请手动复制')
  })
}

// 基于诊断结果创建报告
const createReportFromDiagnosis = () => {
  if (!aiStore.diagnosisResult) return
  
  // 构建报告描述
  let description = `故障描述:\n${form.fault_description}\n\n`
  description += `AI诊断结果:\n${aiStore.diagnosisResult.diagnosis}\n\n`
  
  if (aiStore.diagnosisResult.possible_causes && aiStore.diagnosisResult.possible_causes.length > 0) {
    description += `可能原因:\n`
    aiStore.diagnosisResult.possible_causes.forEach(cause => {
      description += `- ${cause}\n`
    })
    description += '\n'
  }
  
  if (aiStore.diagnosisResult.suggested_solutions && aiStore.diagnosisResult.suggested_solutions.length > 0) {
    description += `建议解决方案:\n`
    aiStore.diagnosisResult.suggested_solutions.forEach(solution => {
      description += `- ${solution}\n`
    })
  }
  
  // 跳转到创建报告页面，并预填数据
  router.push({
    path: '/reports/create',
    query: {
      device_name: form.device_name,
      fault_tags: JSON.stringify(form.fault_tags),
      description
    }
  })
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
.ai-diagnose-page {
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
  
  .diagnose-container {
    .input-section {
      margin-bottom: 20px;
      
      h2 {
        font-size: 20px;
        color: #303133;
        margin-bottom: 20px;
      }
      
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
    
    .result-section {
      margin-bottom: 20px;
      
      h2 {
        font-size: 20px;
        color: #303133;
        margin-bottom: 20px;
      }
      
      .ai-loading {
        .loading-text {
          text-align: center;
          margin-top: 20px;
          color: #909399;
        }
      }
      
      .ai-result {
        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #ebeef5;
          
          .device-info {
            h3 {
              font-size: 18px;
              color: #303133;
              margin: 0 0 10px 0;
            }
            
            .tags {
              display: flex;
              flex-wrap: wrap;
              gap: 5px;
            }
          }
          
          .confidence-section {
            min-width: 200px;
            
            span {
              display: block;
              margin-bottom: 5px;
              color: #606266;
            }
          }
        }
        
        .result-content {
          margin-bottom: 20px;
          
          .result-block {
            margin-bottom: 20px;
            
            &:last-child {
              margin-bottom: 0;
            }
            
            h3 {
              font-size: 16px;
              color: #303133;
              margin-bottom: 10px;
            }
            
            .result-text {
              color: #606266;
              line-height: 1.6;
            }
            
            .result-list {
              padding-left: 20px;
              
              li {
                color: #606266;
                line-height: 1.6;
                margin-bottom: 5px;
              }
            }
          }
        }
        
        .result-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
      }
    }
    
    .tips-section {
      h2 {
        font-size: 20px;
        color: #303133;
        margin-bottom: 15px;
      }
      
      .tips-content {
        ul {
          padding-left: 20px;
          
          li {
            margin-bottom: 8px;
            color: #606266;
            line-height: 1.5;
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .ai-diagnose-page {
    .page-header {
      flex-direction: column;
      align-items: flex-start;
      
      .el-button {
        margin-top: 10px;
        width: 100%;
      }
    }
    
    .diagnose-container {
      .result-section {
        .ai-result {
          .result-header {
            flex-direction: column;
            
            .confidence-section {
              margin-top: 15px;
              width: 100%;
            }
          }
        }
        
        .result-actions {
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
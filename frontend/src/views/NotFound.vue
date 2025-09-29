<template>
  <div class="not-found-page">
    <div class="not-found-container">
      <div class="not-found-content">
        <div class="error-code">404</div>
        <h1>页面不存在</h1>
        <p>抱歉，您访问的页面不存在或已被移除</p>
        <div class="actions">
          <el-button type="primary" @click="goHome">返回首页</el-button>
          <el-button @click="goBack">返回上一页</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// 返回首页
const goHome = () => {
  router.push('/')
}

// 返回上一页
const goBack = () => {
  router.go(-1)
}
</script>

<style scoped lang="scss">
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  
  .not-found-container {
    text-align: center;
    
    .not-found-content {
      .error-code {
        font-size: 120px;
        font-weight: bold;
        color: #409EFF;
        line-height: 1;
        margin-bottom: 20px;
      }
      
      h1 {
        font-size: 32px;
        color: #303133;
        margin: 0 0 15px 0;
      }
      
      p {
        font-size: 16px;
        color: #606266;
        margin: 0 0 30px 0;
      }
      
      .actions {
        display: flex;
        justify-content: center;
        gap: 15px;
      }
    }
  }
}

@media (max-width: 768px) {
  .not-found-page {
    .not-found-container {
      padding: 0 20px;
      
      .not-found-content {
        .error-code {
          font-size: 80px;
        }
        
        h1 {
          font-size: 24px;
        }
        
        p {
          font-size: 14px;
        }
        
        .actions {
          flex-direction: column;
          width: 100%;
          
          .el-button {
            width: 100%;
          }
        }
      }
    }
  }
}
</style>
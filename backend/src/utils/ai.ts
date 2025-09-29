// AI工具函数

// 调用GLM API
export const callGLMAPI = async (prompt: string, env: any) => {
  try {
    // 检查API密钥
    const apiKey = env.GLM_API_KEY || process.env.GLM_API_KEY
    if (!apiKey) {
      throw new Error('GLM API密钥未配置')
    }
    
    // 构建请求
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'glm-4',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })
    
    if (!response.ok) {
      throw new Error(`GLM API请求失败: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // 提取响应内容和token使用量
    const content = data.choices?.[0]?.message?.content || ''
    const tokens_used = data.usage?.total_tokens || 0
    
    return {
      content,
      tokens_used
    }
  } catch (error) {
    console.error('GLM API调用错误:', error)
    throw error
  }
}
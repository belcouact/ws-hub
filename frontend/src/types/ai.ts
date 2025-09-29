export interface AIDiagnoseRequest {
  device_name: string
  fault_description: string
  fault_category?: string
  fault_tags?: string[]
}

export interface AIDiagnoseResponse {
  diagnosis: string
  possible_causes: string[]
  suggested_solutions: string[]
  confidence: number
}

export interface AIUsageStats {
  total_requests: number
  total_tokens: number
  daily_usage: {
    date: string
    request_count: number
    token_count: number
  }[]
}
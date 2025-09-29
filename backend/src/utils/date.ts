/**
 * 获取当前日期，格式为 YYYY-MM-DD
 */
export function getCurrentDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 格式化日期为 ISO 字符串
 */
export function formatDateToISOString(date: Date): string {
  return date.toISOString()
}

/**
 * 从 ISO 字符串解析日期
 */
export function parseDateFromISOString(isoString: string): Date {
  return new Date(isoString)
}
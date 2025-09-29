import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'

// 配置dayjs
dayjs.locale('zh-cn')
dayjs.extend(relativeTime)
dayjs.extend(utc)

/**
 * 格式化日期
 * @param date 日期字符串、时间戳或Date对象
 * @param format 格式化模式，默认为 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: string | number | Date, format = 'YYYY-MM-DD HH:mm:ss'): string {
  return dayjs(date).format(format)
}

/**
 * 格式化相对时间
 * @param date 日期字符串、时间戳或Date对象
 * @returns 相对时间字符串，如 '2小时前'
 */
export function formatRelativeTime(date: string | number | Date): string {
  return dayjs(date).fromNow()
}

/**
 * 格式化UTC时间为本地时间
 * @param date UTC日期字符串
 * @param format 格式化模式，默认为 'YYYY-MM-DD HH:mm:ss'
 * @returns 本地时间字符串
 */
export function formatUTCToLocal(date: string, format = 'YYYY-MM-DD HH:mm:ss'): string {
  return dayjs.utc(date).local().format(format)
}

/**
 * 获取当前时间戳
 * @returns 当前时间戳
 */
export function getCurrentTimestamp(): number {
  return dayjs().valueOf()
}

/**
 * 获取当前ISO格式时间
 * @returns ISO格式时间字符串
 */
export function getCurrentISOTime(): string {
  return dayjs().toISOString()
}

/**
 * 计算两个日期之间的天数差
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 天数差
 */
export function getDaysDiff(startDate: string | number | Date, endDate: string | number | Date): number {
  return dayjs(endDate).diff(dayjs(startDate), 'day')
}

/**
 * 判断是否为今天
 * @param date 日期字符串、时间戳或Date对象
 * @returns 是否为今天
 */
export function isToday(date: string | number | Date): boolean {
  return dayjs(date).isSame(dayjs(), 'day')
}

/**
 * 判断是否为昨天
 * @param date 日期字符串、时间戳或Date对象
 * @returns 是否为昨天
 */
export function isYesterday(date: string | number | Date): boolean {
  return dayjs(date).isSame(dayjs().subtract(1, 'day'), 'day')
}

export default dayjs
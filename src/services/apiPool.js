// src/services/apiPool.js
import Dexie from 'dexie'
import { getApiConfigById } from './aiConfig.js'

const poolDb = new Dexie('qi_yunovo_pool_db')

poolDb.version(1).stores({
  // poolConfig 只存一条记录，用固定 id = 1
  // chatApis: [{ apiConfigId, apiName, model }]
  poolConfig: 'id'
})

// ════════════════════════════════════════════
// 池配置管理
// ════════════════════════════════════════════

export async function getPoolConfig() {
  const record = await poolDb.poolConfig.get(1)
  if (record) return record
  return {
    id: 1,
    chatApis: []   // [{ apiConfigId, apiName, model }]
  }
}

export async function savePoolConfig(config) {
  await poolDb.poolConfig.put({ ...config, id: 1 })
}

export async function addChatApi(entry) {
  // entry: { apiConfigId, apiName, model }
  const config = await getPoolConfig()
  config.chatApis.push(entry)
  await savePoolConfig(config)
}

export async function removeChatApi(index) {
  const config = await getPoolConfig()
  config.chatApis.splice(index, 1)
  await savePoolConfig(config)
}

export async function updateChatApi(index, patch) {
  const config = await getPoolConfig()
  config.chatApis[index] = { ...config.chatApis[index], ...patch }
  await savePoolConfig(config)
}

// ════════════════════════════════════════════
// API 轮询池核心逻辑
// ════════════════════════════════════════════

class ApiPoolManager {
  constructor() {
    this.currentIndex = 0  // 当前轮询索引
    this.apiHealthStatus = new Map()  // 健康状态追踪 { apiConfigId: { failures: 0, lastFailTime: null, isDisabled: false } }
    this.maxFailures = 3  // 连续失败次数上限
    this.recoveryTime = 60000  // 1分钟后重新尝试被禁用的 API
  }

  /**
   * 获取下一个可用的 API 配置
   * @returns {Promise<{api: Object, index: number, fullConfig: Object} | null>}
   */
  async getNextApi() {
    const poolConfig = await getPoolConfig()
    const chatApis = poolConfig.chatApis || []

    if (chatApis.length === 0) {
      throw new Error('API 池为空，请先在设置中添加 API')
    }

    const startIndex = this.currentIndex
    let attempts = 0

    // 轮询查找可用的 API
    while (attempts < chatApis.length) {
      const api = chatApis[this.currentIndex]
      
      // 检查该 API 是否可用
      if (await this._isApiAvailable(api.apiConfigId)) {
        // 获取完整的 API 配置（包含 URL 和 Key）
        const fullConfig = await getApiConfigById(api.apiConfigId)
        
        if (!fullConfig) {
          console.warn(`API 配置不存在: ${api.apiConfigId}`)
          this._moveToNext(chatApis.length)
          attempts++
          continue
        }

        const result = {
          api,
          index: this.currentIndex,
          fullConfig
        }

        // 移动到下一个索引（为下次调用准备）
        this._moveToNext(chatApis.length)
        
        return result
      }

      this._moveToNext(chatApis.length)
      attempts++
    }

    // 所有 API 都不可用，尝试恢复
    this._attemptRecovery()
    throw new Error('所有 API 暂时不可用，请稍后重试')
  }

  /**
   * 标记 API 调用成功
   * @param {number} apiConfigId
   */
  markSuccess(apiConfigId) {
    if (this.apiHealthStatus.has(apiConfigId)) {
      this.apiHealthStatus.delete(apiConfigId)
    }
  }

  /**
   * 标记 API 调用失败
   * @param {number} apiConfigId
   * @param {Error} error
   */
  markFailure(apiConfigId, error) {
    const status = this.apiHealthStatus.get(apiConfigId) || {
      failures: 0,
      lastFailTime: null,
      isDisabled: false
    }

    status.failures++
    status.lastFailTime = Date.now()

    // 超过最大失败次数，禁用该 API
    if (status.failures >= this.maxFailures) {
      status.isDisabled = true
      console.warn(`API ${apiConfigId} 已被暂时禁用（连续失败 ${status.failures} 次）`)
    }

    this.apiHealthStatus.set(apiConfigId, status)
  }

  /**
   * 检查 API 是否可用
   * @private
   */
  async _isApiAvailable(apiConfigId) {
    const status = this.apiHealthStatus.get(apiConfigId)
    
    if (!status) return true  // 没有失败记录，可用

    // 如果被禁用，检查是否到了恢复时间
    if (status.isDisabled) {
      const now = Date.now()
      if (now - status.lastFailTime > this.recoveryTime) {
        // 恢复该 API
        this.apiHealthStatus.delete(apiConfigId)
        console.log(`API ${apiConfigId} 已恢复可用`)
        return true
      }
      return false
    }

    return true
  }

  /**
   * 移动到下一个索引
   * @private
   */
  _moveToNext(totalCount) {
    this.currentIndex = (this.currentIndex + 1) % totalCount
  }

  /**
   * 尝试恢复所有被禁用的 API
   * @private
   */
  _attemptRecovery() {
    const now = Date.now()
    for (const [apiConfigId, status] of this.apiHealthStatus.entries()) {
      if (status.isDisabled && now - status.lastFailTime > this.recoveryTime) {
        this.apiHealthStatus.delete(apiConfigId)
        console.log(`强制恢复 API ${apiConfigId}`)
      }
    }
  }

  /**
   * 重置所有健康状态（用于手动重置）
   */
  resetHealthStatus() {
    this.apiHealthStatus.clear()
    this.currentIndex = 0
    console.log('API 池健康状态已重置')
  }

  /**
   * 获取健康状态报告
   */
  getHealthReport() {
    const report = []
    for (const [apiConfigId, status] of this.apiHealthStatus.entries()) {
      report.push({
        apiConfigId,
        failures: status.failures,
        isDisabled: status.isDisabled,
        lastFailTime: status.lastFailTime ? new Date(status.lastFailTime).toLocaleString() : null
      })
    }
    return report
  }
}

// 创建单例
const poolManager = new ApiPoolManager()

// ════════════════════════════════════════════
// API 调用包装器（带重试）
// ════════════════════════════════════════════

/**
 * 使用轮询池调用 API（自动重试）
 * @param {Function} apiCallFn - API 调用函数，接收 (baseURL, apiKey, model, ...args)
 * @param {Array} args - 传递给 apiCallFn 的额外参数
 * @param {Object} options - 配置选项
 * @returns {Promise<any>}
 */
export async function callWithPool(apiCallFn, args = [], options = {}) {
  const {
    maxRetries = 3,  // 最大重试次数（尝试不同的 API）
    onRetry = null   // 重试回调 (attemptNumber, error, apiName) => void
  } = options

  let lastError = null
  const attemptedApis = new Set()

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // 获取下一个可用的 API
      const { api, fullConfig } = await poolManager.getNextApi()

      // 避免在同一轮重试中使用相同的 API
      if (attemptedApis.has(api.apiConfigId)) {
        continue
      }
      attemptedApis.add(api.apiConfigId)

      console.log(`尝试使用 API: ${api.apiName} (${attempt + 1}/${maxRetries})`)

      // 调用 API
      const result = await apiCallFn(
        fullConfig.baseURL,
        fullConfig.apiKey,
        api.model,
        ...args
      )

      // 成功，标记为健康
      poolManager.markSuccess(api.apiConfigId)
      return result

    } catch (error) {
      lastError = error
      const apiInfo = await poolManager.getNextApi().catch(() => null)
      
      if (apiInfo) {
        poolManager.markFailure(apiInfo.api.apiConfigId, error)
        
        if (onRetry) {
          onRetry(attempt + 1, error, apiInfo.api.apiName)
        }
      }

      console.error(`API 调用失败 (尝试 ${attempt + 1}/${maxRetries}):`, error.message)

      // 如果是最后一次尝试，抛出错误
      if (attempt === maxRetries - 1) {
        throw new Error(`所有 API 调用均失败: ${lastError.message}`)
      }

      // 等待一小段时间后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
    }
  }

  throw lastError
}

// ════════════════════════════════════════════
// 导出工具函数
// ════════════════════════════════════════════

/**
 * 手动获取下一个 API（不自动重试）
 */
export async function getNextApiFromPool() {
  return poolManager.getNextApi()
}

/**
 * 标记 API 成功
 */
export function markApiSuccess(apiConfigId) {
  poolManager.markSuccess(apiConfigId)
}

/**
 * 标记 API 失败
 */
export function markApiFailure(apiConfigId, error) {
  poolManager.markFailure(apiConfigId, error)
}

/**
 * 重置健康状态
 */
export function resetPoolHealth() {
  poolManager.resetHealthStatus()
}

/**
 * 获取健康报告
 */
export function getPoolHealthReport() {
  return poolManager.getHealthReport()
}

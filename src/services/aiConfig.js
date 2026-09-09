// src/services/aiConfig.js
import Dexie from 'dexie'

const apiDb = new Dexie('qi_yunovo_api_db')

apiDb.version(1).stores({
  apiConfigs: 'id, name'
})

export async function getAllApiConfigs() {
  return apiDb.apiConfigs.toArray()
}

export async function getApiConfigById(id) {
  return apiDb.apiConfigs.get(id)
}

export async function addApiConfig(config) {
  const id = Date.now()
  const now = new Date().toISOString()
  const item = {
    id,
    name: config.name || '',
    baseURL: config.baseURL || '',
    apiKey: config.apiKey || '',
    createdAt: now,
    updatedAt: now
  }
  await apiDb.apiConfigs.add(item)
  return item
}

export async function updateApiConfig(id, patch) {
  const now = new Date().toISOString()
  await apiDb.apiConfigs.update(id, {
    ...patch,
    updatedAt: now
  })
}

export async function deleteApiConfig(id) {
  await apiDb.apiConfigs.delete(id)
}

export async function clearApiConfigs() {
  await apiDb.apiConfigs.clear()
}

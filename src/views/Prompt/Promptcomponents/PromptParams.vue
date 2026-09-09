<script setup>
defineProps({
  params: { type: Object, required: true },
  expanded: { type: Boolean, default: false }
})
defineEmits(['update:expanded'])
</script>

<template>
  <section class="panel">
    <div class="panel-head clickable" @click="$emit('update:expanded', !expanded)">
      <div class="section-title">参数</div>
      <span class="chevron" :class="{ open: expanded }">›</span>
    </div>

    <div v-show="expanded" class="param-list">
      <div class="param-row">
        <div class="param-info">
          <span class="param-label">温度</span>
          <span class="param-value">{{ params.temperature }}</span>
        </div>
        <input v-model.number="params.temperature" type="range" min="0" max="2" step="0.1" />
      </div>

      <div class="param-row">
        <div class="param-info">
          <span class="param-label">Top P</span>
          <span class="param-value">{{ params.topP }}</span>
        </div>
        <input v-model.number="params.topP" type="range" min="0" max="1" step="0.01" />
      </div>

      <div class="param-row">
        <div class="param-info">
          <span class="param-label">最大Tokens</span>
          <span class="param-value">{{ params.maxTokens }}</span>
        </div>
        <input v-model.number="params.maxTokens" type="range" min="0" max="32000" step="1" />
      </div>

      <div class="param-row">
        <div class="param-info">
          <span class="param-label">频率惩罚</span>
          <span class="param-value">{{ params.frequencyPenalty }}</span>
        </div>
        <input v-model.number="params.frequencyPenalty" type="range" min="-2" max="2" step="0.1" />
      </div>

      <div class="param-row">
        <div class="param-info">
          <span class="param-label">存在惩罚</span>
          <span class="param-value">{{ params.presencePenalty }}</span>
        </div>
        <input v-model.number="params.presencePenalty" type="range" min="-2" max="2" step="0.1" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.panel {
  background: rgba(255, 255, 255, 0.88);
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.panel-head.clickable {
  cursor: pointer;
  user-select: none;
  margin-bottom: 0;
}
.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #4d4250;
}
.chevron {
  font-size: 20px;
  color: #8a7a90;
  display: inline-block;
  transition: transform 0.2s ease;
}
.chevron.open {
  transform: rotate(90deg);
}
.param-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 14px;
}
.param-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.param-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.param-label {
  font-size: 13px;
  font-weight: 600;
  color: #4d4250;
}
.param-value {
  font-size: 13px;
  font-weight: 700;
  color: #6b7fd7;
  background: #eef1fe;
  border-radius: 999px;
  padding: 2px 10px;
  min-width: 44px;
  text-align: center;
}
.param-row input[type='range'] {
  width: 100%;
  accent-color: #6b7fd7;
  cursor: pointer;
}
</style>

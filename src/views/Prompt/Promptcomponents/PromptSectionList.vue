<script setup>
import { ref, onBeforeUnmount } from 'vue'
import FixedSectionCard from './FixedSectionCard.vue'
import CustomSectionCard from './CustomSectionCard.vue'

const sections = defineModel({ type: Array, default: () => [] })

defineProps({
  roleOptions: { type: Array, default: () => [] },
  positionOptions: { type: Array, default: () => [] }
})

/* ---------- 新增板块：自定义板块，默认不展开 ---------- */
function addSection() {
  sections.value.push({
    id: `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: '自定义板块',
    prompt: '',
    enabled: true,
    role: 'system',
    position: 'sequence',
    depth: 1,
    expanded: false,
    builtin: false,
    builtinType: null
  })
}

function toggleExpanded(section) {
  section.expanded = !section.expanded
}

function removeSection(index) {
  sections.value.splice(index, 1)
}

/* ---------- 长按拖动排序 ---------- */
const sectionListEl = ref(null)
const pressTimer = ref(null)
const dragState = ref(null)

function onHandleDown(e, index) {
  if (e.button !== undefined && e.button !== 0) return
  e.preventDefault()
  clearTimeout(pressTimer.value)
  pressTimer.value = setTimeout(() => beginDrag(e, index), 450)
}

function onHandleUp() {
  clearTimeout(pressTimer.value)
}

function beginDrag(e, index) {
  const els = Array.from(sectionListEl.value?.querySelectorAll('.section-card') || [])
  const startRect = els[index]?.getBoundingClientRect()
  dragState.value = {
    index,
    pointerId: e.pointerId,
    startY: e.clientY,
    currentY: e.clientY,
    target: index,
    startTop: startRect ? startRect.top : e.clientY,
    startHeight: startRect ? startRect.height : 0
  }
  document.body.classList.add('is-dragging-section')
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', endDrag, true)
  window.addEventListener('pointercancel', endDrag, true)
}

function onPointerMove(e) {
  const state = dragState.value
  if (!state || e.pointerId !== state.pointerId) return
  state.currentY = e.clientY
  updateDragTarget()
}

function updateDragTarget() {
  const state = dragState.value
  if (!state) return
  const els = Array.from(sectionListEl.value?.querySelectorAll('.section-card') || [])
  const translateY = state.currentY - state.startY
  const draggedCenter = state.startTop + state.startHeight / 2 + translateY
  let target = state.index
  els.forEach((el, i) => {
    if (i === state.index) return
    const rect = el.getBoundingClientRect()
    const center = rect.top + rect.height / 2
    if (draggedCenter > center && i > target) target = i
    if (draggedCenter < center && i < target) target = i
  })
  state.target = target
}

function endDrag(e) {
  const state = dragState.value
  if (!state || e.pointerId !== state.pointerId) return
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', endDrag, true)
  window.removeEventListener('pointercancel', endDrag, true)
  document.body.classList.remove('is-dragging-section')

  if (state.target !== state.index) {
    const list = [...sections.value]
    const [item] = list.splice(state.index, 1)
    list.splice(state.target, 0, item)
    sections.value = list
  }
  dragState.value = null
}

function dragTranslateY() {
  const state = dragState.value
  return state ? state.currentY - state.startY : 0
}

function isDragging(index) {
  return dragState.value?.index === index
}

function isDropTarget(index) {
  const state = dragState.value
  return !!state && state.index !== index && state.target === index
}

onBeforeUnmount(() => {
  clearTimeout(pressTimer.value)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', endDrag, true)
  window.removeEventListener('pointercancel', endDrag, true)
  document.body.classList.remove('is-dragging-section')
})
</script>

<template>
  <section class="panel">
    <div class="panel-head">
      <div class="section-title">板块</div>
      <button type="button" class="mini-btn primary" @click="addSection">新增板块</button>
    </div>

    <div ref="sectionListEl" class="section-list">
      <article
        v-for="(section, index) in sections"
        :key="section.id"
        class="section-card"
        :class="{
          dragging: isDragging(index),
          'drop-target': isDropTarget(index),
          'is-builtin': section.builtin
        }"
        :style="isDragging(index) ? { transform: `translateY(${dragTranslateY()}px)` } : null"
      >
        <Component
          :is="section.builtin ? FixedSectionCard : CustomSectionCard"
          :section="section"
          :role-options="roleOptions"
          :position-options="positionOptions"
          @drag-down="onHandleDown($event, index)"
          @drag-up="onHandleUp"
          @toggle-expand="toggleExpanded(section)"
          @remove="removeSection(index)"
        />
      </article>
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
.section-title {
  font-size: 14px;
  font-weight: 700;
  color: #4d4250;
}
.mini-btn.primary {
  border: none;
  border-radius: 10px;
  padding: 7px 12px;
  font-size: 12px;
  cursor: pointer;
  background: #6b7fd7;
  color: #fff;
}
.section-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.section-card {
  position: relative;
}
.section-card.dragging {
  z-index: 20;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
  border-color: #6b7fd7;
}
.section-card.drop-target {
  border: 1px dashed #6b7fd7;
  background: #f4f6ff;
}
:global(body.is-dragging-section) {
  user-select: none;
  -webkit-user-select: none;
}
</style>

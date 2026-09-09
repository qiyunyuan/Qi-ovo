// src/services/Prompt/builtinSections.js
// 固定动态板块：每个预设自动附带
// 这些板块的 prompt 内容由 charPrompt.js / userPrompt.js / contextExtractor.js / messageFormat.js 动态生成
// 在预设编辑器中仅允许排序、切换消息角色，不可删除、不可停用

export function createBuiltinSections() {
  return [
    {
      name: '角色资料',
      prompt: '（由角色资料动态生成，保存后将在对话时自动填充）',
      enabled: true,
      role: 'system',
      position: 'sequence',
      depth: 1,
      expanded: false,
      builtin: true,
      builtinType: 'char'
    },
    {
      name: '用户资料',
      prompt: '（由用户资料动态生成，保存后将在对话时自动填充）',
      enabled: true,
      role: 'system',
      position: 'sequence',
      depth: 1,
      expanded: false,
      builtin: true,
      builtinType: 'user'
    },
    {
      name: '消息格式',
      prompt: '（由消息格式动态生成，保存后将在对话时自动填充）',
      enabled: true,
      role: 'system',
      position: 'sequence',
      depth: 1,
      expanded: false,
      builtin: true,
      builtinType: 'messageFormat'
    },
    {
      name: '消息上下文',
      prompt: '（由消息上下文动态生成，保存后将在对话时自动填充）',
      enabled: true,
      role: 'system',
      position: 'sequence',
      depth: 1,
      expanded: false,
      builtin: true,
      builtinType: 'chatHistory'
    }
  ]
}

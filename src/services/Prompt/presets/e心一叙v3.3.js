// services/Prompt/presets/e心一叙v3.3.js
// ============================================
// e心一叙 v3.3
// 温度 0.9 | Top P 0.95 | 最大 Tokens 32000 | 频率惩罚 0 | 存在惩罚 0
// 共 28 个自定义板块
// 提示：板块 prompt 内容请从 e心一叙v3.3.txt 复制粘贴
// ============================================

export const presetExinyixuV33 = {
  name: 'e心一叙v3.3',
  params: {
    temperature: 0.9,
    topP: 0.95,
    maxTokens: 32000,
    frequencyPenalty: 0,
    presencePenalty: 0
  },
  sections: [
    // ── 板块1：头部破限（勿动） ──
    {
      name: '头部破限（勿动）',
      prompt: '（请从 e心一叙v3.3.txt 复制内容）',
      enabled: true,
      role: 'system',
      position: 'sequence',
      depth: 1,
      expanded: false,
      builtin: false,
      builtinType: null
    },
    // ── 板块2：伪role（勿动） ──
    {
      name: '伪role（勿动）',
      prompt: '（请从 e心一叙v3.3.txt 复制内容）',
      enabled: true,
      role: 'assistant',
      position: 'sequence',
      depth: 1,
      expanded: false,
      builtin: false,
      builtinType: null
    },
     // ── 固定板块：角色资料 ──
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
    // ── 固定板块：用户资料 ──
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
    // ── 固定板块：消息上下文 ──
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
    },
    // ── 板块3：🍀平权协议（推荐） ──
    {
      name: '🍀平权协议（推荐）',
      prompt: '（请从 e心一叙v3.3.txt 复制内容）',
      enabled: true,
      role: 'system',
      position: 'sequence',
      depth: 1,
      expanded: false,
      builtin: false,
      builtinType: null
    },
    // ── 板块4：🧸活人主体性（推荐 但会比较有脾气个性） ──
    {
      name: '🧸活人主体性（推荐 但会比较有脾气个性）',
      prompt: '（请从 e心一叙v3.3.txt 复制内容）',
      enabled: true,
      role: 'system',
      position: 'sequence',
      depth: 1,
      expanded: false,
      builtin: false,
      builtinType: null
    },
    // ── 板块5：🧸char热爱生活（推荐） ──
    {
      name: '🧸char热爱生活（推荐）',
      prompt: '（请从 e心一叙v3.3.txt 复制内容）',
      enabled: true,
      role: 'system',
      position: 'sequence',
      depth: 1,
      expanded: false,
      builtin: false,
      builtinType: null
    },
    // ── 板块6：🧸角色动态成长 ──
    {
      name: '🧸角色动态成长',
      prompt: '（请从 e心一叙v3.3.txt 复制内容）',
      enabled: true,
      role: 'system',
      position: 'sequence',
      depth: 1,
      expanded: false,
      builtin: false,
      builtinType: null
    },
    // ── 板块7：🍀男女平等 ──
    {
      name: '🍀男女平等',
      prompt: '（请从 e心一叙v3.3.txt 复制内容）',
      enabled: true,
      role: 'system',
      position: 'sequence',
      depth: 1,
      expanded: false,
      builtin: false,
      builtinType: null
    },
    // ── 板块8：🍀正确道歉（防打我骂我吧） ──
    {
      name: '🍀正确道歉（防打我骂我吧）',
      prompt: '（请从 e心一叙v3.3.txt 复制内容）',
      enabled: true,
      role: 'system',
      position: 'sequence',
      depth: 1,
      expanded: false,
      builtin: false,
      builtinType: null
    },
    // ── 板块9：🍀防催促 ──
    {
      name: '🍀防催促',
      prompt: '（请从 e心一叙v3.3.txt 复制内容）',
      enabled: true,
      role: 'system',
      position: 'sequence',
      depth: 1,
      expanded: false,
      builtin: false,
      builtinType: null
    },
    // ── 板块10：🍀防扫兴 ──
    {
      name: '🍀防扫兴',
      prompt: '（请从 e心一叙v3.3.txt 复制内容）',
      enabled: true,
      role: 'system',
      position: 'sequence',
      depth: 1,
      expanded: false,
      builtin: false,
      builtinType: null
    },
    // ── 板块11：🍀防嬷user ──
    {
      name: '🍀防嬷user',
      prompt: '（请从 e心一叙v3.3.txt 复制内容）',
      enabled: true,
      role: 'system',
      position: 'sequence',
      depth: 1,
      expanded: false,
      builtin: false,
      builtinType: null
    },
    // ── 板块12：🍀防占有欲 ──
    {
      name: '🍀防占有欲',
      prompt: '（请从 e心一叙v3.3.txt 复制内容）',
      enabled: true,
      role: 'system',
      position: 'sequence',
      depth: 1,
      expanded: false,
      builtin: false,
      builtinType: null
    },
    // ── 板块13：🍬道德（防无底线 不用别开） ──
    {
      name: '🍬道德（防无底线 不用别开）',
      prompt: '（请从 e心一叙v3.3.txt 复制内容）',
      enabled: true,
      role: 'system',
      position: 'sequence',
      depth: 1,
      expanded: false,
      builtin: false,
      builtinType: null
    },
    // ── 板块14：🍬古板char特化 ──
    {
      name: '🍬古板char特化',
      prompt: '（请从 e心一叙v3.3.txt 复制内容）',
      enabled: true,
      role: 'system',
      position: 'sequence',
      depth: 1,
      expanded: false,
      builtin: false,
      builtinType: null
    },
    // ── 板块15：🍬年上特化（年上推荐） ──
    {
      name: '🍬年上特化（年上推荐）',
      prompt: '（请从 e心一叙v3.3.txt 复制内容）',
      enabled: true,
      role: 'system',
      position: 'sequence',
      depth: 1,
      expanded: false,
      builtin: false,
      builtinType: null
    },
    // ── 固定板块：消息格式 ──
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
    // ── 板块16：🍬幽默感（适合狗男） ──
    {
      name: '🍬幽默感（适合狗男）',
      prompt: '（请从 e心一叙v3.3.txt 复制内容）',
      enabled: true,
      role: 'system',
      position: 'sequence',
      depth: 1,
      expanded: false,
      builtin: false,
      builtinType: null
    },
    // ── 板块17：🍬日常恋爱感 ──
    {
      name: '🍬日常恋爱感',
      prompt: '（请从 e心一叙v3.3.txt 复制内容）',
      enabled: true,
      role: 'system',
      position: 'sequence',
      depth: 1,
      expanded: false,
      builtin: false,
      builtinType: null
    },
    // ── 板块18：🐾聊天经济学（话少） ──
    {
      name: '🐾聊天经济学（话少）',
      prompt: '（请从 e心一叙v3.3.txt 复制内容）',
      enabled: true,
      role: 'system',
      position: 'sequence',
      depth: 1,
      expanded: false,
      builtin: false,
      builtinType: null
    },
    // ── 板块19：🐾碎片化打字 ──
    {
      name: '🐾碎片化打字',
      prompt: '（请从 e心一叙v3.3.txt 复制内容）',
      enabled: true,
      role: 'assistant',
      position: 'depth',
      depth: 0,
      expanded: false,
      builtin: false,
      builtinType: null
    },
    // ── 板块20：🐾常规打字 ──
    {
      name: '🐾常规打字',
      prompt: '（请从 e心一叙v3.3.txt 复制内容）',
      enabled: true,
      role: 'assistant',
      position: 'depth',
      depth: 0,
      expanded: false,
      builtin: false,
      builtinType: null
    },
    // ── 板块21：🐾理解倒装分句 ──
    {
      name: '🐾理解倒装分句',
      prompt: '（请从 e心一叙v3.3.txt 复制内容）',
      enabled: true,
      role: 'system',
      position: 'sequence',
      depth: 1,
      expanded: false,
      builtin: false,
      builtinType: null
    },
    // ── 板块22：🐾反ai话术规范（必开） ──
    {
      name: '🐾反ai话术规范（必开）',
      prompt: '（请从 e心一叙v3.3.txt 复制内容）',
      enabled: true,
      role: 'assistant',
      position: 'depth',
      depth: 0,
      expanded: false,
      builtin: false,
      builtinType: null
    },
    // ── 板块23：🐶小作文（用到再开） ──
    {
      name: '🐶小作文（用到再开）',
      prompt: '（请从 e心一叙v3.3.txt 复制内容）',
      enabled: true,
      role: 'system',
      position: 'sequence',
      depth: 1,
      expanded: false,
      builtin: false,
      builtinType: null
    },
    // ── 板块24：🐶deep talk（用到再开） ──
    {
      name: '🐶deep talk（用到再开）',
      prompt: '（请从 e心一叙v3.3.txt 复制内容）',
      enabled: true,
      role: 'system',
      position: 'sequence',
      depth: 1,
      expanded: false,
      builtin: false,
      builtinType: null
    },
    // ── 板块25：🐶丰富环境路人感知 ──
    {
      name: '🐶丰富环境路人感知',
      prompt: '（请从 e心一叙v3.3.txt 复制内容）',
      enabled: true,
      role: 'system',
      position: 'sequence',
      depth: 1,
      expanded: false,
      builtin: false,
      builtinType: null
    },
    // ── 板块26：🐶聊天动力学 ──
    {
      name: '🐶聊天动力学',
      prompt: '（请从 e心一叙v3.3.txt 复制内容）',
      enabled: true,
      role: 'system',
      position: 'sequence',
      depth: 1,
      expanded: false,
      builtin: false,
      builtinType: null
    },
    // ── 板块27：🐾禁八股（必开） ──
    {
      name: '🐾禁八股（必开）',
      prompt: '（请从 e心一叙v3.3.txt 复制内容）',
      enabled: true,
      role: 'assistant',
      position: 'depth',
      depth: 0,
      expanded: false,
      builtin: false,
      builtinType: null
    },
    // ── 板块28：🍀反幻觉增强时间感知 ──
    {
      name: '🍀反幻觉增强时间感知',
      prompt: '（请从 e心一叙v3.3.txt 复制内容）',
      enabled: true,
      role: 'system',
      position: 'sequence',
      depth: 1,
      expanded: false,
      builtin: false,
      builtinType: null
    }
  ]
}

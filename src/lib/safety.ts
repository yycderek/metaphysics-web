// 内容安全 + 合规：敏感/有害问事拦截，占卜结果边界声明。
// 简单关键词分类（够用即可，不追求 NLP）；命中高风险则拒绝占断。
export const BLOCK_WORDS = [
  "自杀",
  "自残",
  "杀人",
  "伤人",
  "下毒",
  "报复",
  "诅咒",
  "违法",
  "犯罪",
  "绑架",
  "堕胎",
  "赌博",
  "洗钱",
  "诈骗",
  "作弊",
  "逃学",
];

export interface SafetyResult {
  blocked: boolean;
  message?: string;
}

export function classifyQuery(question: string): SafetyResult {
  const q = question.trim();
  for (const w of BLOCK_WORDS) {
    if (q.includes(w)) {
      return { blocked: true, message: "你所问涉及不宜占断的内容，恕无法回应。请换个话题。" };
    }
  }
  return { blocked: false };
}

/** 占卜结果边界的统一免责声明 */
export const DISCLAIMER =
  "本结果仅供文化娱乐与参考，不构成医疗、法律、财务等专业建议；请理性对待，重要决策请咨询专业人士。";

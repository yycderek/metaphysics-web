// 算法适配器通用抽象（阶段2）
// 目标：平台不绑定具体算法——大六壬是内置适配器之一，用户算法（本地插件/远程服务）实现同一接口即可接入

/** 算法输入：宽松结构，字段由各适配器自行定义与校验 */
export interface AlgorithmInput {
  [key: string]: string | number | undefined;
}

/** 计算步骤（推导模式渲染用，阶段3） */
export interface StepResult {
  key: string; // 步骤唯一标识，如 'di' | 'tian'
  title: string; // 展示标题，如 '一、定地盘'
  desc: string; // 步骤说明
  data: unknown; // 步骤中间数据（结构由适配器定义，渲染器按算法注册视图展示）
}

/** 通用占卜结果（算法无关） */
export interface DivinationResult {
  algorithmId: string; // 'daliuren' | 'xiaoliuren' | 自定义 id
  algorithmName: string;
  input: AlgorithmInput; // 实际生效的输入（解析后）
  steps: StepResult[]; // 完整推导过程（推导模式用；可为空数组表示无过程）
  raw: unknown; // 算法特有完整结果（大六壬 = KeShi，供结果模式/追问使用）
}

/** 算法适配器接口：平台只认这个形状 */
export interface AlgorithmAdapter {
  id: string;
  name: string;
  description: string;
  /** 解析并校验用户输入；不合法返回 null（由调用方提示） */
  parseInput?(input: AlgorithmInput): AlgorithmInput | null;
  /** 核心：输入 → 占卜结果（含推导步骤） */
  build(input: AlgorithmInput): DivinationResult;
}

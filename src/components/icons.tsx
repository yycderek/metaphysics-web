"use client";
// 统一图标集（内联 SVG，无第三方依赖）：中式玄学语境下的领域字形 + 通用操作图标。
// 约定：24×24 视框、currentColor 描边、aria-hidden（语义由相邻文本承担）。
import type { SVGProps } from "react";

export interface IconProps extends SVGProps<SVGSVGElement> {
  /** 像素尺寸，默认 16 */
  size?: number;
}

function Icon({ size = 16, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** 卦（三爻） */
export function IconTrigram(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16" />
      <path d="M4 12h6M14 12h6" />
      <path d="M4 17h16" />
    </Icon>
  );
}

/** 罗盘 / 占卜 */
export function IconCompass(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.4" />
      <path d="M12 1.6v2.2M12 20.2v2.2M1.6 12h2.2M20.2 12h2.2" />
      <path d="M12 8.6l1.6 3.4-1.6 3.4-1.6-3.4z" />
    </Icon>
  );
}

/** 书 / 术语 */
export function IconBook(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 6.2C10.2 4.7 7.3 4 4 4v14c3.3 0 6.2.7 8 2.2 1.8-1.5 4.7-2.2 8-2.2V4c-3.3 0-6.2.7-8 2.2z" />
      <path d="M12 6.2V20" />
    </Icon>
  );
}

/** 历史回看（回溯箭头 + 时钟） */
export function IconHistory(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.2 12a8.8 8.8 0 1 0 2.6-6.2" />
      <path d="M3 3.6v4h4" />
      <path d="M12 7.6V12l3 1.8" />
    </Icon>
  );
}

/** 起卦（四芒星） */
export function IconSpark(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2.6l1.9 5.5 5.5 1.9-5.5 1.9L12 17.4l-1.9-5.5L4.6 10l5.5-1.9z" />
      <path d="M18.6 16.4l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
    </Icon>
  );
}

/** 课式结果（图表） */
export function IconChart(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 4v16h16" />
      <path d="M7.5 16v-4M12 16V8M16.5 16v-6" />
    </Icon>
  );
}

/** 推导过程（路径） */
export function IconRoute(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="18" cy="18" r="2.2" />
      <path d="M8.2 6H14a3 3 0 0 1 0 6h-4a3 3 0 0 0 0 6h5.8" />
    </Icon>
  );
}

/** 设置（滑杆） */
export function IconSliders(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
      <circle cx="9" cy="7" r="2" />
      <circle cx="15" cy="12" r="2" />
      <circle cx="8" cy="17" r="2" />
    </Icon>
  );
}

/** 亮色（太阳） */
export function IconSun(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.4v2.2M12 19.4v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.4 12h2.2M19.4 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
    </Icon>
  );
}

/** 暗色（月） */
export function IconMoon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 14.4A8.2 8.2 0 0 1 9.6 4a7.2 7.2 0 1 0 10.4 10.4z" />
    </Icon>
  );
}

/** 摇卦（骰子） */
export function IconDice(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <circle cx="9" cy="9" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="9" cy="15" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15" cy="15" r="1.15" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/** 当前时间（时钟） */
export function IconClock(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 7.6V12l3 1.8" />
    </Icon>
  );
}

/** 分享 */
export function IconShare(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="6" cy="12" r="2.4" />
      <circle cx="18" cy="6" r="2.4" />
      <circle cx="18" cy="18" r="2.4" />
      <path d="M8.2 10.9l7.6-3.6M8.2 13.1l7.6 3.6" />
    </Icon>
  );
}

/** 下载 */
export function IconDownload(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4v11" />
      <path d="M7 10.5l5 5 5-5" />
      <path d="M5 20h14" />
    </Icon>
  );
}

/** 复制 */
export function IconCopy(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </Icon>
  );
}

/** 追问（对话） */
export function IconChat(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 5.5h15v11h-9l-6 4z" />
      <path d="M8.5 9.5h7M8.5 12.5h4.5" />
    </Icon>
  );
}

/** 展开箭头 */
export function IconChevronDown(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 9.5l6 6 6-6" />
    </Icon>
  );
}

/** 勾选 */
export function IconCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </Icon>
  );
}

/** 关闭 */
export function IconClose(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  );
}

/** 警告 */
export function IconWarning(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.6l9 16.2H3z" />
      <path d="M12 9.8v4.2M12 17.2h.01" />
    </Icon>
  );
}

/** 中性（减号） */
export function IconMinus(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14" />
    </Icon>
  );
}

/** 停止 */
export function IconStop(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </Icon>
  );
}

/** 播放 */
export function IconPlay(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 5.5l11 6.5-11 6.5z" />
    </Icon>
  );
}

/** 暂停 */
export function IconPause(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 5.5v13M15 5.5v13" />
    </Icon>
  );
}

/** 上一步 */
export function IconChevronLeft(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14.5 6l-6 6 6 6" />
    </Icon>
  );
}

/** 下一步 */
export function IconChevronRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.5 6l6 6-6 6" />
    </Icon>
  );
}

/** 出生信息（人） */
export function IconUser(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </Icon>
  );
}

/** 撤销 */
export function IconUndo(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 7.5L4.5 12 9 16.5" />
      <path d="M4.5 12H14a5 5 0 0 1 0 10h-1" />
    </Icon>
  );
}

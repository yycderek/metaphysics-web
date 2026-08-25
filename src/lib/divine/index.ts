// 断课模板注册入口：import 本模块即注册所有内置断课模板
// 新算法接入断课：实现 DivineTemplate 并在此（或插件处）registerDivineTemplate
import "./daliuren";
import "./xiaoliuren";
import "./generic";

export * from "./types";
export * from "./registry";
export { daliurenDivineTemplate } from "./daliuren";
export { xiaoliurenDivineTemplate } from "./xiaoliuren";
export { genericDivineTemplate, GENERIC_DIVINE_ID } from "./generic";

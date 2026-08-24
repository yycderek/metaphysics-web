// 本地算法插件注册入口（阶段4）
// 使用方式：
//   1. 在 src/plugins/ 下新建你的适配器文件（参考 examples/xiaoliuren.ts 或 src/lib/algorithms/daliuren.ts）
//   2. 在本文件 import 并调用 registerAdapter()
//   3. 保存后刷新页面，起课表单的「算法」下拉会自动出现你的算法
//
// 注意：插件代码随前端打包执行。若算法逻辑较重或不想暴露源码，请改用
// 「远程算法服务」方式（页面 🔌 面板配置 URL 即可，协议见 docs/PLUGIN-GUIDE.md）。
import { registerAdapter } from "@/lib/algorithms/registry";
import { xiaoliurenAdapter } from "./examples/xiaoliuren";
registerAdapter(xiaoliurenAdapter);

# 艺安查 (Yi'ancha) MVP 前端

艺人风险尽调一站式平台 —— 前端静态站点（纯 HTML/CSS/JS，无框架/npm）。

## 目录定位（规范代码库）

- 本目录 `Claw/yiancha-mvp/` 为**唯一前端规范代码库**。
- 后端：`Claw/yiancha-backend/`（FastAPI，部署于 Render）。
- 历史重复版本已归档至 `Claw/yiancha-archive/other-agent-v0.4/`（v0.4，仅作参考，不再维护）。

## 技术栈

- `index.html` + `app.js`（hash 路由 SPA）
- CDN：Chart.js（图表）、html2pdf.js（报告导出）、SheetJS / xlsx（Excel 离线导入）
- 在线模式：调用 `https://yiancha-backend.onrender.com/api/v1`
- 部署：Netlify（`netlify.toml`）

## 离线兜底（v2.2 新增）

在线 API 不可用时（如 Render 冷启动、部署中断），自动回退至离线模式，覆盖：
搜索、热门推荐、统计概览、艺人详情、竞品对比、品牌代言推荐。

三种离线数据源（首页「筛选区」可手动触发）：
1. **📂 离线示例** —— 内置 10 位头部艺人示例数据（即开即用）。
2. **完整数据集** —— 载入 `artists.json`（916 位艺人），需通过 http 服务器访问（Netlify 或 `python -m http.server`），不支持 `file://` 直接打开。
3. **导入 Excel** —— 浏览器端 SheetJS 解析，字段自动兼容中英列名。

> 数据评分说明：源数据 `artists.json` 的「风险总分/政治风险…」实为**安全分**（越高越安全），
> 已归一化为应用内部的**风险分**（越高越危险，与线上 API 一致）；「待评估」艺人风险分显示 `-`，不误报极端风险。

## 本地预览

```bash
cd Claw/yiancha-mvp
python -m http.server 8000
# 浏览器打开 http://localhost:8000
```

## 上次合并记录

- 合并自 v0.4（另一 agent 版本）的独有功能：SheetJS 浏览器端 Excel 导入、内置示例数据、代言推荐关键词匹配算法（`ENDORSE_CATEGORIES`）。
- 修复 v0.4 遗留的 Python 风格注释（三引号 docstring）导致的 JS 语法错误。

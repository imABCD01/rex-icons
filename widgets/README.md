# ForwardWidget 模块索引

本目录统一收纳自建的 rex（ForwardWidget）模块。每个模块为单文件 JS，通过 jsdelivr 引用：

```
https://cdn.jsdelivr.net/gh/imABCD01/rex-icons@main/widgets/<类型>/<文件名>
```

## 模块清单

| 文件 | 模块 ID | 功能 | 版本 | 状态 |
|---|---|---|---|---|
| `list/letterboxd.js` | `forward.letterboxd` | Letterboxd 片单/演员页解析，IMDb 内置详情；三级缓存（映射 7 天 + 列表页 24h + 增量回写） | 2.2.0 | ✅ 可用 |
| `list/douban-rating.js` | `tea.douban.rating` | 豆瓣榜单浏览（热门/高分/经典），支持片名搜索与评分注入 | 1.0.0 | ✅ 可用 |
| `subtitle/subtitle-highmatch.js` | `tea.subtitle.highmatch` | 高匹配度字幕（内置射手网 assrt 适配器，需在 rex 设置里填 token） | 1.1.0 | ✅ 可用（assrt 源） |

## 分类约定

- `list/`：列表类模块（loadList，返回影片列表）
- `subtitle/`：字幕类模块（id 固定 `loadSubtitle`，type `subtitle`）
- 后续新增模块按类型入目录，文件名 kebab-case

## 开发约定（摘自 skill 规范）

- `WidgetMetadata` 必须是文件第一条语句（裸赋值，无 `var`）
- 元数据必填：`id`（反向域名，全局唯一）、`version`、`requiredVersion`
- 模块 id：列表类用 `loadList`；字幕/弹幕/资源类有官方固定 id
- 环境防御：不假设 `setTimeout`/`fetch` 存在，用 `Widget.http` / `Widget.storage` / `_delay()` 式封装
- metadata 层字段值（如 `cacheDuration`）重写时须逐项对照原版，不凭感觉改

# Rex 模块仓库 (imABCD01/rex-icons)

本仓库托管 Rex 首页所用的自定义模块、图标、徽章资源。

## 固定入口
- **模块合集**: `/m/all-modules.rex` （无缓存，推送后立即生效）
- **单模块**: `/m/widgets/<类型>/<文件>.js`
- **图标清单**: `/m/rex-icons-all.jsdelivr.json` (1443 张)
- **徽章清单**: `/m/badges-noframe.json` (314 条)

## 模块分类
- `list/` — 列表类模块 (makka-*, letterboxd 等)
- `forward/` — ForwardWidget 类模块 (ysp-live, short-drama 等)

## 更新流程
推送到 main 分支 → CF Worker `/m/` 路由秒级同步 → Rex 刷新源即可拿到最新

## 数据来源
- 官方模块: `assets.rexnow.tv/scripts/rex-tmdb.js`
- 自制模块: `imABCD01/rex-icons@main/widgets/list/*.js`
- 短剧模块: `imABCD01/rex-shortdrama@main/modules/forward.hema.short-drama.js`

生成时间: 2026-11-09

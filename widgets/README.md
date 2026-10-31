# ForwardWidget 模块索引

本目录统一收纳 rex（ForwardWidget）模块。每个模块为单文件 JS，通过 jsdelivr 引用：

```
https://cdn.jsdelivr.net/gh/imABCD01/rex-icons@main/widgets/<类型>/<文件名>
```

## 模块清单

### list/（列表类）

| 文件 | 模块 ID | 功能 | 版本 | 来源 | 状态 |
|---|---|---|---|---|---|
| `letterboxd.js` | `forward.letterboxd` | Letterboxd 片单/演员页解析；三级缓存（映射 7 天+列表页 24h+增量回写） | 2.2.0 | huangxd\|MakkaPakka，v2 重写优化 | ✅ 可用 |
| `douban-rating.js` | `tea.douban.rating` | 豆瓣榜单浏览与评分注入 | 1.0.0 | 自建（Tea） | ✅ 可用 |
| `makka-ultimate-aggregate.js` | `super_ultime_media_hub_makka` | 终极聚合：影剧流行风向（Trakt）、流媒体 TOP10 | 1.3.0 | MakkaPakka（自备份提取解密） | ✅ 可用 |
| `makka-movie-charts.js` | `movie_ultimate_makka_v2` | 全能电影榜：票房/奥斯卡/高分 | 1.4.0 | MakkaPakka | ✅ 可用 |
| `makka-discover-hub.js` | `discover_hub_ultimate` | 探索发现：历史上今天上映、随机推荐 | 1.0.6 | MakkaPakka | ✅ 可用 |
| `makka-tmdb-upcoming.js` | `tmdb_upcoming_center_makka` | 新片追踪：即将上映与热映 | 1.0.1 | MakkaPakka | ✅ 可用 |
| `makka-global-networks.js` | `makka_global_networks` | 全球平台 ALL IN ONE：各流媒体热播 | 1.2.5 | MakkaPakka | ✅ 可用 |
| `makka-imdb-hot.js` | `imdb_cn_fix_` | IMDb 热榜（中文化） | 1.0.5 | MakkaPakka | ✅ 可用 |
| `makka-cinephile-hub.js` | `cinephile_hub_ultimate` | 影迷宝藏：系列电影 | 1.0.5 | MakkaPakka（解密） | ✅ 可用 |
| `makka-iqiyi-library.js` | `iqiyi.video.pc.makka` | 爱奇艺片库（电视剧/电影/综艺等 6 类） | 1.0.0 | MakkaPakka（REXENC 密文，App 自动解密） | ✅ 可用 |
| `makka-qq-library.js` | `qq.video.pc.makka` | 腾讯视频片库（6 类） | 1.0.0 | MakkaPakka（REXENC 密文） | ✅ 可用 |
| `makka-youku-library.js` | `youku.video.pc.makka` | 优酷片库（6 类） | 1.2.0 | MakkaPakka（REXENC 密文） | ✅ 可用 |
| `haokan-short-drama.js` | `forward.haokan.short-drama` | 好看免费短剧 | 1.0.1 | MakkaPakka（解密） | ✅ 可用 |

### subtitle/（字幕类）

| 文件 | 模块 ID | 功能 | 版本 | 来源 | 状态 |
|---|---|---|---|---|---|
| `xunlei-subtitle.js` | `xunlei.subtitle` | 迅雷字幕（单元剧匹配） | 1.2.0 | 自建（Tea，备份找回） | ✅ 可用 |
| `subtitle-highmatch.js` | `tea.subtitle.highmatch` | 高匹配字幕（射手网 assrt 源，需 token） | 1.1.0 | 自建（Tea） | ✅ 可用 |

## 维护约定

- 新模块按类型入目录，文件名 kebab-case；**保持原模块 metadata id 不变**（首页布局按 id 绑定卡片）
- 转载他人模块保留作者署名于 README 与 metadata.author
- 模块开发规范见 `/var/minis/skills-archive/writing-forward-widgets/SKILL.md`（WidgetMetadata 首行裸赋值、id 反向域名、防御 setTimeout/fetch、cacheDuration 逐项对照原版）

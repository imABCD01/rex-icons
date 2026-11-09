/* 本文件由 yingqiao 出口模块（server/modules/fwrex）自动生成，请勿手改。
 * 面板版本 1.1.0；生成时间 2026-11-08T02:35:57.351Z；首页行 0 条 */
var MB_META = {"id":"yingqiao.fw","title":"影桥","version":"1.1.0","requiredVersion":"0.0.1","icon":"","description":"影桥。需在全局参数填面板地址与访问令牌（模块地址里已带令牌时不用再填）。","author":"yingqiao","site":"","detailCacheDuration":300,"globalParams":[{"name":"panel","title":"面板地址","type":"input","value":"https://qiaoying.riroro.com"},{"name":"token","title":"模块令牌","type":"input","value":""}],"search":{"title":"搜索影桥","functionName":"mbSearch","params":[{"name":"keyword","title":"关键词","type":"input","value":""},{"name":"page","title":"页码","type":"page","value":"1"}]},"modules":[{"id":"loadResource","title":"加载播放资源","description":"按条目定位已入库的版本并取地址（需鉴权的版本连请求头一起交给播放器）","functionName":"mbLoadResource","type":"stream","params":[],"cacheDuration":0}]};
var WidgetMetadata = MB_META;
var MB_HOME_ROWS = 0;
/* 面板地址 / 令牌的**生成时快照**：宿主若没把 globalParams 并进模块参数，运行时拿这份兜底 */
var MB_PANEL_DEFAULT = "https://qiaoying.riroro.com";
var MB_TOKEN_DEFAULT = "";

/* ============================================================================
 * yingqiao · FW/Rex Widgets 运行时
 *
 * 本文件会被出口模块原样拼进生成的 `widget.js`，在 **FW/Rex App 的 JS 环境**里执行 ——
 * 不在 Node 里跑，所以禁止 `require` / `__dirname` / `process` 之类的 Node 物。
 *
 * 生成方（`server/modules/fwrex/widget.js`）在它上面注入：
 *   var WidgetMetadata = MB_META;     组件元数据（globalParams 的 panel/token、search、modules）
 *   var MB_HOME_ROWS = 榜单行条数（这个用户首页上有几行，就是几；只作调试参照）
 *   var MB_PANEL_DEFAULT / MB_TOKEN_DEFAULT —— 面板地址与令牌的**生成时快照**（兜底）
 *   以及每个榜单行的入口 `mbLoadRow_<i>(params)` → 转发到本文件的 `mbLoadRow(行身份, params)`
 *
 * 数据全部打面板自己那几条路由（`/api/fwrex/*`，见 routes.js）：
 *   POST /api/fwrex/home/run   跑这个用户首页上的某个榜单行（`{entryId}`，见 ADR-0232）
 *   POST /api/fwrex/search     **库内搜索**（面板侧 `emby/service.outputSearch`：只在**已入库**
 *                              的资源里找 —— 聚合搜索回的是站源条目坐标，这条"只读库"的路
 *                              拿了也播不了，见 ADR-0118）
 *   POST /api/fwrex/item       条目 → **已入库的版本列表**（只读库：不列目录、不解析、不回源）
 *   POST /api/fwrex/play       版本 → 播放地址 + 请求头
 *   GET  /api/fwrex/stream     需鉴权车道的**面板一跳**：302 到最终地址（ADR-0366）
 *
 * 身份：模块地址上带着**某个用户的模块令牌**（面板验过票才认人），面板据此认出
 * "这是谁 → 哪个档位的 fwrex 板块"，所以本文件**不解析也不传 userId** —— 它只把令牌原样
 * 放在请求 URL 上，认人那一步全在面板（见 ADR-0118 第五节）。
 *
 * 播放：两条车道口径**都把真地址交给 FW/Rex 原生播放器**（`playerType:'app'`）：
 *   · `client` —— 地址裸用可播，直接交付；
 *   · `proxy`  —— **必须带请求头**（UA / Cookie 这类）才取得到流。Emby 那条路对这种情况
 *                 只能 302 / 清单，面板不代持（ADR-0154）；组件能把请求头一并交给播放器，
 *                 客户端直连 CDN、不占面板流量 —— 这正是这个出口模块存在的理由。
 * 出口这条路**不做**懒解析入口（没有 `/api/agg/stream` 那种"点播时再让面板 302"的地址）。
 *
 * ⚠️ 组件**只读库**：面板库里没有的条目，这里也拿不到版本（出口请求来自播放器里的脚本，
 * 放它去触发"聚合搜索 + 入库"会把一次点击放大成 N 个上游请求，见 ADR-0118）。
 * ========================================================================== */

var MB_API_PREFIX = '/api/fwrex';

/* --------------------------------------------------------------- 小工具 */

function mbConfig(params) {
  params = params || {};
  var metaDefaults = {};
  try {
    (MB_META.globalParams || []).forEach(function (p) {
      metaDefaults[p.name] = p.value || '';
    });
  } catch (e) {}
  /* 取值顺序：宿主并进来的参数 → globalParams 的默认值 → **生成时烘死的快照**。
     最后一层是给「宿主根本不把 globalParams 并进模块参数」的客户端兜底 ——
     否则 panel 为空会在 mbNeedConfig 里抛，而抛出点在 mbPost（async）里，
     表现为「点击毫无反应、面板侧一条请求都没有」，很难查。 */
  var panel = String(params.panel || metaDefaults.panel
    || (typeof MB_PANEL_DEFAULT !== 'undefined' ? MB_PANEL_DEFAULT : '') || '').replace(/\/+$/, '');
  var token = String(params.token || metaDefaults.token
    || (typeof MB_TOKEN_DEFAULT !== 'undefined' ? MB_TOKEN_DEFAULT : '') || '');
  return { panel: panel, token: token };
}

function mbNeedConfig(c) {
  if (!c.panel) throw new Error('还没填「面板地址」：在模块全局参数里填，如 http://192.168.1.10:8899');
}

function mbApiUrl(c, route) {
  return c.panel + MB_API_PREFIX + route + '?token=' + encodeURIComponent(c.token || '');
}

/** 面板回来的错误对象 → Error（**带上 code**：`SITE_FORBIDDEN` 这条要按 403 处置，见 index.js） */
function mbError(data) {
  var err = data && data.error ? data.error : {};
  var e = new Error((err.code ? '[' + err.code + '] ' : '') + (err.message || '面板返回错误'));
  e.code = err.code || 'PANEL_ERROR';
  return e;
}

async function mbPost(c, route, payload) {
  mbNeedConfig(c);
  var resp = await Widget.http.post(mbApiUrl(c, route), payload || {}, {
    headers: { 'Content-Type': 'application/json' },
  });
  var data = resp && resp.data;
  if (data && data.error) throw mbError(data);
  return data;
}

/* link 就是一段自描述 JSON（列表时编好，详情 / 起播时原样带回） */
function mbDecodeLink(link) {
  if (link && typeof link === 'object') return link;
  try {
    return JSON.parse(String(link || ''));
  } catch (e) {
    return null;
  }
}

/**
 * FW「正在播放的条目」→ link 形状（没有 link 时的翻译层）。
 *
 * 面板按 `itemId` 或 `name` + `year`（剧集另带 season/episode）在**库里**定位条目，
 * 所以这里能翻译出来的只有 name —— 影和剧都用 seriesName（影的 seriesName 就是片名）。
 * `year` 取 FW 平铺的 `airDate` 前四位 —— 实测它是**作品级**首播/上映日
 * （剧集给的是整剧首播日，形如 `YYYY-MM-DD`，不是这一集当天），与面板 emby 侧取的
 * `found.ProductionYear` 是同一个口径，正是同名条目分档要的那个年份。
 * ⚠️ 少了它，同名 / 同系列的作品会挤在同一分上、靠输入顺序抢名额，
 * 于是有的条目整条落榜、组件里的版本列表凭空少几条。
 */
function mbYearOf(params) {
  var m = String((params || {}).airDate || '').match(/(19|20)\d{2}/);
  return m ? m[0] : '';
}

function mbLinkFromParams(params) {
  params = params || {};
  var name = String(params.seriesName || params.episodeName || params.title || params.name || '').trim();
  if (!name) return null;
  return {
    t: String(params.type || '').toLowerCase() === 'tv' ? 'tv' : 'movie',
    n: mbKeywordOf(name),
    y: mbYearOf(params),
    c: null,
  };
}

/* 番号形状（对照面板 match.js 的 CODE_RE：字母段 + 分隔符 + 数字段） */
var MB_CODE_RE = /([A-Za-z]{2,12})[\s_-](\d{2,7})(?!\d)/;
var MB_BARE_CODE_RE = /^[A-Za-z]{2,12}[\s_-]?\d{2,7}$/;

/**
 * 番号片（`RCTD-761 ROCKET 18周年…` / `FC2-PPV-2751830 来自春天的…`）要拿**番号**去查，
 * 不能拿整串长标题：
 *   · 面板 agg 的 `name` 就是**发给各站搜索的关键词**（agg/service.js 里 `wd: opts.name`），
 *     三四十字的长标题站点的搜索框根本不认；
 *   · 而打分那关面板有番号捷径（番号对上名字分直接 1.0，match.js 顶部写明长标题会把
 *     相似度稀释到「24 条里 23 条被误杀」），所以番号当关键词既搜得到、也判得准。
 *
 * 只在**首段确实是番号**时才截（首段不含中文 + 抽得出字母-数字编号），所以
 * `The Lord of the Rings`、`斗破苍穹年番4更211[…]` 这类名字一分不动，照旧整串去查。
 */
function mbKeywordOf(name) {
  var s = String(name || '').trim();
  var first = s.split(/\s+/)[0] || '';
  if (!/[\u3400-\u9fff]/.test(first) && (MB_BARE_CODE_RE.test(first) || MB_CODE_RE.test(first))) return first;
  return s;
}

function mbNum(v, d) {
  var n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
}

/* ------------------------------------------------- 面板库里的条目坐标
 * 出口这条路**只读库**，面板按**条目坐标**取版本（`resource.item_id`，见 `core/providers.js`）：
 *   `{域}_{编号}_movie` / `{域}_{编号}_tv`（剧）/ `{域}_{编号}_tv_s{n}_e{m}`（**集**）。
 * 剧的版本落在**集**坐标上，所以列版本时要把剧坐标补上季集号。 */

/**
 * 剧 / 集的条目坐标：`{域}_{编号}_tv[_s{n}][_e{m}]` + 季集 → 集坐标。
 * 先削掉已有的季 / 集段再补，传入剧坐标或集坐标都能得到同一个结果；电影坐标（`_movie`）原样返回。
 */
function mbEpisodeItemId(baseId, season, episode) {
  var base = String(baseId || '').trim().replace(/_s\d+(_e\d+)?$/i, '');
  if (!base) return '';
  if (!season || !episode) return base;
  return base + '_s' + Number(season) + '_e' + Number(episode);
}

/**
 * 本会话记下的「域编号 → 面板条目坐标」—— 只当**最后一道兜底**（下面第 ⑤ 条）。
 *
 * 主力是 `mbItemIdsFromParams` 的现拼：宿主起播时平铺的域编号（`tmdbId` 这类）与 type
 * 就够拼出面板要的坐标了，不必依赖"本会话在 loadDetail 里记过"。
 */
var MB_ITEM_BY_ENTRY = {};

/**
 * 条目坐标候选（**由宿主给的那套坐标现拼**，本会话没记过也拼得出）。
 *
 * 宿主的条目 JSON 长这样（实测样本）：
 *   {"seriesName":"蜘蛛侠：崭新之日","type":"movie","tmdbId":"969681",
 *    "episodeName":"蜘蛛侠：崭新之日","imdbId":"tt9910001","id":"969681","airDate":"…-…-…"}
 * 面板的条目坐标就是 `{域}_{编号}_{movie|tv}[_s{n}][_e{m}]`（`core/providers.js` 的 `itemId()`），
 * 域 = 参数名去掉结尾的 `Id`（`tmdbId` → `tmdb`、`bangumiId` → `bangumi`）。
 * **面板的 Emby 层就是这么由 tmdbId 认条目的** —— 客户端把同一个 tmdbId 也交给了模块，
 * 模块没有理由拿不到版本（"只认本会话记过的"是曾经的实现缺陷）。
 *
 * @returns `Array<string>` 候选坐标，按可信度排序；调用方依次问面板，**第一个回出版本的**即采纳
 *   （认不出的坐标面板回空版本）。同一个条目多给几个编号（tmdb / imdb）时靠这个顺序收敛。
 */
function mbItemIdsFromParams(params, d, isTv, season, episode) {
  params = params || {};
  var out = [];
  var push = function (base) {
    var b = String(base || '').trim();
    if (!b) return;
    var one = isTv ? mbEpisodeItemId(b, season, episode) : b;
    if (one && out.indexOf(one) < 0) out.push(one);
  };
  /* ① 宿主直接给的条目坐标；② 列表项 link 里编的坐标（从本组件榜单进来的那条） */
  push(params.itemId);
  push(d && d.i);
  /* ③ 宿主平铺的域编号 → **现拼**（tmdbId 先试，其余 `…Id` 按参数顺序） */
  var keys = [];
  for (var k in params) if (/Id$/.test(k)) keys.push(k);
  keys.sort(function (a, b) {
    if (a === 'tmdbId') return -1;
    if (b === 'tmdbId') return 1;
    return 0;
  });
  var kind = isTv ? 'tv' : 'movie';
  for (var i = 0; i < keys.length; i++) {
    var v = String(params[keys[i]] === undefined || params[keys[i]] === null ? '' : params[keys[i]]).trim();
    if (!v) continue;
    /* 域 = 键名去掉结尾的 `Id`；`id` 这种没有域前缀的键剥出来是空串，形状校验会挡掉 */
    var dom = keys[i].slice(0, -2).toLowerCase();
    if (!/^[a-z][a-z0-9]*$/.test(dom)) continue;
    push(dom + '_' + v + '_' + kind);
  }
  /* ④ 本会话记过的（按编号反查）—— 域名对不上时的兜底 */
  for (var j = 0; j < keys.length; j++) {
    var vv = String(params[keys[j]] === undefined || params[keys[j]] === null ? '' : params[keys[j]]).trim();
    if (vv && MB_ITEM_BY_ENTRY[vv]) push(MB_ITEM_BY_ENTRY[vv]);
  }
  return out;
}

/* --------------------------------------------------- 条目：面板 → FW/Rex */

/**
 * 首页条目的域坐标：id 形状 `{domain}_{entryId}_{movie|tv}`（如 `tmdb_969681_movie`），
 * 拆不出就用 providerIds 兜底（`{Tmdb:"969681"}` → domain 'tmdb'）。
 * 有它 `loadDetail` 就返回 `type:domain` 让 FW/Rex 走**内置详情页**（自带分集与未播出标注），
 * 起播时宿主把 tmdbId/season/episode/seriesName/airDate 平铺给 stream 模块（mbLoadResource）。
 * 这个 id 同时就是**面板库里的条目 id**（`core/providers.js` 规定的同一形状），
 * 所以它还会原样进 link 的 `i`，起播时当 `itemId` 交给面板定位（省一次按名字找条目）。
 */
var MB_DOMAIN_ID_RE = /^([a-z][a-z0-9]*)_(\d+)_(movie|tv)$/i;
function mbDomainOf(item) {
  var m = String((item || {}).id || '').match(MB_DOMAIN_ID_RE);
  if (m) return { d: m[1].toLowerCase(), e: m[2] };
  var pids = (item || {}).providerIds || {};
  for (var k in pids) {
    if (!pids[k]) continue;
    return { d: String(k).toLowerCase(), e: String(pids[k]) };
  }
  return null;
}

/**
 * 首页 HomeItem（emby/home 归一化形状：poster/backdrop/genres/sourceLoc…）→ FW/Rex VideoItem
 * 关键字段是 link：自描述 JSON，loadDetail / loadResource 都靠它。
 */
function mbFromHomeItem(item, index) {
  item = item || {};
  var mediaType = item.type === 'tv' ? 'tv' : 'movie';
  var desc = {
    t: mediaType,
    n: String(item.title || ''),
    y: item.year ? String(item.year) : '',
    p: item.poster || '',
    b: item.backdrop || '',
    o: item.overview || '',
    r: item.rating || 0,
    g: Array.isArray(item.genres) ? item.genres : [],
    /* 面板库里的条目 id（首页条目自带域坐标时就有）：起播时当 itemId 交给面板。 */
    i: item.id == null ? '' : String(item.id),
    /* 条目自报的来源坐标（诊断与本地 id 用）。取片不再走它 —— 出口这条路只读库。 */
    c: item.sourceLoc || item.catpaw || null,
  };
  var dm = mbDomainOf(item);
  if (dm) desc.m = dm;
  return {
    id: 'mbh_' + String(item.id == null ? index : item.id),
    type: 'url',
    title: item.title || '未命名',
    mediaType: mediaType,
    posterPath: item.poster || '',
    backdropPath: item.backdrop || '',
    coverUrl: item.poster || item.backdrop || '',
    rating: mbNum(item.rating, 0) || undefined,
    description: item.overview || '',
    genreItems: (item.genres || []).slice(0, 10).map(function (g, i) {
      return { id: 'g' + i + '_' + String(g).slice(0, 12), title: String(g) };
    }),
    link: JSON.stringify(desc),
  };
}

/**
 * 库内搜索命中项（面板 `agg.outputSearch` 的形状：`{itemId, title, type, year, poster, versions, sites}`）
 * → FW/Rex VideoItem。
 *
 * 与首页条目**同一套映射**（`mbFromHomeItem`）：命中项的 `itemId` 就是库里的条目坐标
 * （`core/providers.js` 那套形状），于是 link 里的 `i` 直接可播、`mbDomainOf` 也能认出域坐标
 * 走内置详情页。这里只把字段名对上，不另拼一份 desc。
 */
function mbFromLibItem(item, index) {
  var it = item || {};
  return mbFromHomeItem(
    {
      id: String(it.itemId || ''),
      title: String(it.title || ''),
      type: it.type === 'tv' ? 'tv' : 'movie',
      year: it.year,
      poster: String(it.poster || ''),
      backdrop: '',
      overview: '',
      genres: [],
    },
    index
  );
}

/* -------------------------------------------------------- 列表 / 搜索 */

/**
 * 榜单行（由生成的 mbLoadRow_<i> 转发，row = {entryId, rowId, title}）。
 * 返回 VideoItem[]（FW/Rex 列表模块约定：直接返回数组，翻页参数 page/count）。
 */
async function mbLoadRow(row, params) {
  params = params || {};
  var c = mbConfig(params);
  var page = mbNum(params.page, 1);
  var count = mbNum(params.count, 30);
  var out = await mbPost(c, '/home/run', {
    entryId: row.entryId,
    rowId: row.rowId,
    startIndex: (page - 1) * count,
    limit: count,
  });
  var items = Array.isArray(out.items) ? out.items : [];
  return items.map(mbFromHomeItem);
}

/**
 * 全局搜索（WidgetMetadata.search 指到这里）—— 走**库内搜索**（面板侧 `agg.outputSearch`）。
 * 关键词键名以官方 nlsearch.js 为准：keyword / query；wd 也兜底。
 *
 * ⚠️ 搜的是**已经入库**的东西：出口这条路只读库，聚合搜索那种"站源条目命中"在这条路上
 * 没有可播坐标，拿回来也点不动（见 ADR-0118）。搜不到的含义是"这台面板还没收下这条内容" ——
 * 要它进库，仍走 Emby 那条路浏览一次或「手动入库」。搜索本身不需要聚合模板。
 */
async function mbSearch(params) {
  params = params || {};
  var wd = String(params.keyword || params.query || params.wd || '').trim();
  if (!wd) return [];
  var c = mbConfig(params);
  var out = await mbPost(c, '/search', { wd: wd, limit: 40 });
  var items = Array.isArray(out.items) ? out.items : [];
  return items.map(mbFromLibItem);
}

/* ------------------------------------------------------------- 详情 */

/**
 * loadDetail —— 静态部分**纯本地**组装（顶层 loadDetail 只拿得到 link，够不着面板，
 * 所以列表时就把自描述 JSON 编进了 link）：
 *   · 条目带域坐标（d.m，见 mbDomainOf）→ 返回 `type:domain`，宿主走**内置详情页**
 *     （自带分集列表与未播出标注）。顺手把**面板库里的条目坐标**记进本会话 —— 内置详情页
 *     起播时只平铺 `tmdbId` / 季 / 集 / seriesName，不回带列表时编的那串 link，
 *     而面板列版本要的正是那个坐标（见 mbItemIdOf）。
 *   · 否则（搜索条目等无域坐标）→ `type:'url'` 自定义详情页。
 */
async function loadDetail(link, params) {
  var d = mbDecodeLink(link);
  if (!d || !d.n) return null;
  var genreItems = Array.isArray(d.g) && d.g.length
    ? d.g.slice(0, 10).map(function (g, i) {
        return { id: 'g' + i + '_' + String(g).slice(0, 12), title: String(g) };
      })
    : undefined;
  /* 有域坐标 → 交回宿主走内置详情页（id 用域内的纯 entryId，与官方 rex.tmdb.js 同形状） */
  if (d.m && d.m.d && d.m.e) {
    if (d.i) MB_ITEM_BY_ENTRY[String(d.m.e)] = String(d.i);
    return {
      id: String(d.m.e),
      type: String(d.m.d),
      title: d.n,
      mediaType: d.t === 'tv' ? 'tv' : 'movie',
      posterPath: d.p || '',
      backdropPath: d.b || '',
      coverUrl: d.p || d.b || '',
      description: d.o || '',
      rating: mbNum(d.r, 0) || undefined,
      releaseDate: d.y ? String(d.y) : '',
      genreItems: genreItems,
    };
  }
  return {
    id: 'mbd_' + String((d.c && (d.c.vodId || d.c.site)) || d.n).slice(0, 40),
    type: 'url',
    title: d.n,
    mediaType: d.t === 'tv' ? 'tv' : 'movie',
    posterPath: d.p || '',
    backdropPath: d.b || '',
    coverUrl: d.p || d.b || '',
    description: d.o || '',
    rating: mbNum(d.r, 0) || undefined,
    releaseDate: d.y ? String(d.y) : '',
    link: typeof link === 'string' ? link : JSON.stringify(d),
    genreItems: genreItems,
  };
}

/* ------------------------------------------------------------- 播放 */

/** 版本条目的显示名：面板拼好的 `versionLabel` 优先，退回站点名 + 序号，再补集号 */
function mbStreamName(v, i, wantEpisode) {
  var base = String(v.label || v.site || '').trim() || '车道';
  return base + (i ? ' · ' + (i + 1) : '') + (wantEpisode ? ' ' + wantEpisode : '');
}

/**
 * HLS 车道的地址要给播放器一个 `.m3u8` 后缀 —— ExoPlayer 系按后缀推断容器类型，
 * 裸地址会被当成未知类型、起播不了（与面板 Emby 层同一口径，见 ADR-0071）。
 *
 * ⚠️ 只补**路径完全没有后缀**的裸地址：已经有后缀的（`.mp4` / `.m3u8` …）一律不动 ——
 * 面板给的是 CDN 的**签名地址**，多补一段就可能把它改坏。判断只看路径，query 照旧带在后面。
 */
function mbHlsUrl(u, container) {
  var s = String(u || '');
  if (String(container || '').toLowerCase() !== 'hls') return s;
  /* 面板自己的一跳（`/stream`）不补后缀：302 出去的就是上游原地址，后缀在那边。 */
  if (s.indexOf(MB_API_PREFIX + '/stream?') >= 0) return s;
  var m = /^([^?#]*)([?#][\s\S]*)?$/.exec(s);
  if (!m) return s;
  var last = m[1].split('/').pop() || '';
  if (last.indexOf('.') >= 0) return s;
  return m[1] + '.m3u8' + (m[2] || '');
}

/**
 * 版本 → 面板那一跳的地址：播放器拿它当片子地址，面板跟到上游最终落点再 302（见 ADR-0366）。
 *
 * 为什么不让播放器直接拿上游签名地址：FW/Rex 会把地址再 `encodeURI` 一遍（`%2F` → `%252F`），
 * 百度判 `sign error` 403。这一跳只经手 `ref`，签名不进客户端。
 */
function mbStreamUrl(c, ref) {
  return c.panel + MB_API_PREFIX + '/stream?token=' + encodeURIComponent(c.token || '')
    + '&ref=' + encodeURIComponent(String(ref || ''));
}

/**
 * 一个版本 → 面板取址：`{urls, header, playVia, container}`（面板只回地址与请求头，不吐字节）。
 *
 * 统一交给面板 `/stream` 占位（ADR-0213，修订 ADR-0366「`client` 车道零变化」）：
 * - 需鉴权的 `proxy` 版：版本行自带出口请求头（ADR-0205），列表阶段零解析；
 * - `client` 版：光鸭原画就是这一档，取一次址要在面板里转存 12–18s（`guangya.js` 的 share 路），
 *   列表阶段每条现取就把几十条版本串成几十秒。真解析只发生在用户点播那一条的 `/stream` 上。
 *
 * 地址本身不进客户端：FW/Rex 会再 `encodeURI` 一遍（`%2F` → `%252F`），上游判 `sign error` 403，
 * 面板只经手 `ref`、跟到上游最终落点再 302（见 ADR-0366）。
 */
async function mbResolveVersion(c, v) {
  var ref = String(v.ref || '');
  if (!ref) return null;
  var hdr = v.header && typeof v.header === 'object' ? v.header : {};
  return {
    urls: [mbStreamUrl(c, ref)],
    header: hdr,
    playVia: String(v.playVia || 'client'),
    container: String(v.container || ''),
  };
}

/** 一条地址 → FW/Rex 流条目（**原生播放器直连**，请求头一并交给它） */
function mbStreamOf(v, url, index, wantEpisode, got) {
  var u = mbHlsUrl(url, got.container);
  var name = mbStreamName(v, index, wantEpisode);
  var s = {
    name: name,
    title: name,
    url: u,
    link: u,
    videoUrl: u,
    type: 'url',
    playerType: 'app',
  };
  /* `headers` / `customHeaders` 两个字段名都带上（不同版本认的不一样）：
   * playerType:'app' = 由 FW/Rex 原生播放器带着这些头直连，不经过任何面板中转。 */
  var h = got.header;
  if (h && Object.keys(h).length) {
    s.headers = h;
    s.customHeaders = h;
  } else if (String(v.playVia) === 'proxy') {
    /* 需鉴权的版本却没拿到请求头：地址照给（面板可能已经把它换成免鉴权的），但留个记录 */
    console.warn('[yingqiao] 需鉴权的版本没拿到请求头：' + name);
  }
  return s;
}

/**
 * stream 模块（id 固定 loadResource）。params 由 FW/Rex 注入：
 *   link（列表项的自描述 JSON）、type、season、episode、seriesName、airDate…
 *   以及 globalParams 合并来的 panel/token。
 *
 * 取址两步（**都只读库、不回源**，见 ADR-0118）：
 *   ① `POST /item` 拿这个条目的版本清单（每条带 `ref` 与面板拼好的 `label`）；
 *   ② 逐个 `POST /play` 取地址与请求头，交给原生播放器。
 *
 * link 缺席不报错：FW/Rex 从「正在播放的条目」起播时（典型是内置详情页）只给一套条目坐标，
 * 这里把它翻译成 name + 年份 + 季集（见 mbLinkFromParams），与列表项等价地交给面板定位。
 */
async function mbLoadResource(params) {
  params = params || {};
  /* 现拉设置：预解析上限取面板当前值（不用重装模块） */
  var c = mbConfig(params);
  var d = mbDecodeLink(params.link) || mbLinkFromParams(params);
  if (!d || !d.n) throw new Error('定位不到片源：既没有 link，也没给片名（seriesName/title）');

  /* 季 / 集两处取：宿主平铺的 params（内置详情页起播时必带）→ link 里编的兜底 */
  var season = String(params.season || (d && d.se) || '');
  var episode = String(params.episode || (d && d.ep) || '');
  var wantEpisode = season && episode ? 'S' + season + 'E' + episode : '';
  /* 剧 / 影以宿主起播时给的 params.type 为准（搜索条目自身可能没带对类型），link 兜底 */
  var isTv = String(params.type || d.t || '').toLowerCase() === 'tv';

  /* ① 版本清单。面板按**条目坐标**从库里取（剧取到**集**坐标上）。
   *    坐标优先由宿主给的那套（`itemId` / `tmdbId` 这类 + type）**现拼**，逐个试到有版本为止 ——
   *    客户端在"正在播放 / 内置详情页"起播时给的就是这套 JSON，拼出来的坐标与面板 Emby 层认的是同一个。
   *    全都取不到，才说明这条确实没进库（典型是搜出来的站点候选），如实说明怎么补。 */
  var candidates = mbItemIdsFromParams(params, d, isTv, season, episode);
  if (!candidates.length) {
    throw new Error('面板库里没有这条的坐标，取不到版本：出口组件只读库，'
      + '搜索出来的站点候选要先在面板入库，或者从本组件的榜单里起播');
  }
  var itemBody = {
    name: d.n,
    year: d.y ? String(d.y) : '',
    season: isTv ? season : '',
    episode: isTv ? episode : '',
  };
  var out = null;
  var itemId = '';
  for (var ci = 0; ci < candidates.length; ci++) {
    var tried = await mbPost(c, '/item', Object.assign({ itemId: candidates[ci] }, itemBody));
    if (tried && Array.isArray(tried.versions) && tried.versions.length) {
      out = tried;
      itemId = candidates[ci];
      break;
    }
  }
  if (!out) out = { versions: [] };
  var versions = Array.isArray(out.versions) ? out.versions : [];
  if (!versions.length) {
    throw new Error(isTv && !(season && episode)
      ? '这一集取不到版本：剧集起播要带季 / 集号（缺了就对不上集坐标），先从面板的详情页起播'
      : '面板库里还没有这个条目的可播版本（出口组件只读库：先在面板取源入库）');
  }

  var streams = [];
  var lastErr = null;
  for (var i = 0; i < versions.length; i++) {
    var v = versions[i];
    var got;
    try {
      got = await mbResolveVersion(c, v);
    } catch (e) {
      /* 站点对这个人不可见（面板的 fwrex 板块闸不过）：整条起播如实失败，
       * 让这一发把 403 带回客户端 —— 不静默少几条车道。 */
      if (e && e.code === 'SITE_FORBIDDEN') throw e;
      lastErr = e;
      console.error('[yingqiao] 版本取址失败：' + mbStreamName(v, 0, wantEpisode) + ' — ' + (e && e.message));
      continue;
    }
    var urls = got.urls.filter(function (u) {
      /* 只留 http/https：`push://` 之类播放器播不了 */
      return /^https?:\/\//i.test(String(u || ''));
    });
    for (var j = 0; j < urls.length; j++) streams.push(mbStreamOf(v, urls[j], j, wantEpisode, got));
  }

  if (!streams.length) {
    throw new Error(lastErr
      ? '所有版本都没解析出可播放地址：' + lastErr.message
      : '所有版本都没解析出可播放地址（可能需要登录网盘，或车道已失效）');
  }
  return streams;
}


/* ---- 榜单行模块入口（生成时绑定行身份）---- */


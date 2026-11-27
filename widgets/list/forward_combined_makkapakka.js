// =============UserScript=============
// @name        影视聚合终极版 (Widget.tmdb)
// @description 三合一：豆瓣全能推荐 | TMDB探索 | Trakt猜你喜欢
// @author      MakkaPakka 
// =============UserScript=============

var WidgetMetadata = {
    id: "forward.combined.makkapakka",
    title: "影视榜单Lite",
    description: "豆瓣全能推荐 | TMDB探索 | 猜你想看",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    version: "1.3.5", // Tea TV badges; // backdropFeature 首行显示剧情简介，保留日期/评分为次行；兼容 Worker 快照
    requiredVersion: "0.0.1",
    site: "https://t.me/MakkaPakkaOvO",

    globalParams: [],
    modules: [
        // =================================================
        // 🟢 一级栏目 1：豆瓣 (Douban)
        // =================================================
        {
            title: "🟢 豆瓣",
            description: "剧集 / 电影 / 综艺 / 榜单",
            functionName: "loadDoubanModule",
            type: "video",
            params: [
                {
                    name: "sort_by",
                    title: "选择栏目",
                    type: "enumeration",
                    value: "tv_american",
                    enumOptions: [
                        { value: "tv_american", title: "📺 英美剧" },
                        { value: "tv_korean", title: "📺 韩剧" },
                        { value: "tv_japanese", title: "📺 日剧" },
                        { value: "tv_domestic", title: "📺 国产剧" },
                        { value: "tv_animation", title: "🌸 日本动画" },
                        { value: "movie_hot", title: "🎬 实时热门电影" },
                        { value: "movie_weekly", title: "🎬 一周口碑电影" },
                        { value: "movie_top250", title: "🎬 豆瓣 Top250" },
                        { value: "movie_showing", title: "🎬 院线热映" },
                        { value: "show_domestic", title: "🎤 国内综艺" },
                        { value: "show_foreign", title: "🎤 国外综艺" },
                        { value: "tv_global_best", title: "🏆 全球口碑剧集" },
                        { value: "tv_chinese_best", title: "🏆 华语口碑剧集" }
                    ]
                },
                { name: "page", title: "页码", type: "page" }
            ]
        },
      // =================================================
        // 🗓 一级栏目：追剧日历 (Airing Calendar)
        // =================================================
        {
            title: "🗓 周更",
            description: "本周最新影视更新追踪",
            functionName: "loadCalendarModule",
            type: "video",
            params: [
                {
                    name: "dateStr",
                    title: "更新日期",
                    type: "enumeration",
                    value: "today",
                    enumOptions: [
                        { value: "today", title: "📺 今天更新" },
                        { value: "1", title: "🔹 周一 (Monday)" },
                        { value: "2", title: "🔹 周二 (Tuesday)" },
                        { value: "3", title: "🔹 周三 (Wednesday)" },
                        { value: "4", title: "🔹 周四 (Thursday)" },
                        { value: "5", title: "🔹 周五 (Friday)" },
                        { value: "6", title: "🔹 周六 (Saturday)" },
                        { value: "7", title: "🔹 周日 (Sunday)" }
                    ]
                },
                {
                    name: "showType",
                    title: "影视分类",
                    type: "enumeration",
                    value: "all",
                    enumOptions: [
                        { value: "all", title: "综合影剧" },
                        { value: "tv", title: "📺 纯净剧集" },
                        { value: "movie", title: "🎬 院线电影" },
                        { value: "anime", title: "🌸 二次元动漫" },
                        { value: "show", title: "🎤 娱乐综艺" }
                    ]
                },
                { name: "page", title: "页码", type: "page" }
            ]
        },

        // =================================================
        // 🔵 一级栏目 2：TMDB (The Movie Database)
        // =================================================
        {
            title: "🔵 TMDB",
            description: "探索电影与剧集",
            functionName: "loadTMDBModule",
            type: "video",
            params: [
                {
                    name: "sort_by",
                    title: "模式", 
                    type: "enumeration", 
                    value: "movie",
                    enumOptions: [ { value: "movie", title: "🎬 电影筛选" }, { value: "tv", title: "📺 剧集筛选" } ]
                },
                {
                    name: "genre", title: "类型", type: "enumeration", value: "",
                    enumOptions: [
                        { title: "全部", value: "" },
                        { title: "动作/冒险", value: "28" }, { title: "科幻/奇幻", value: "878" },
                        { title: "剧情", value: "18" }, { title: "喜剧", value: "35" },
                        { title: "动画", value: "16" }, { title: "悬疑/犯罪", value: "9648" },
                        { title: "恐怖/惊悚", value: "27" }, { title: "爱情", value: "10749" }
                    ]
                },
                { name: "year", title: "年份", type: "input", description: "例如: 2024", value: "" },
                {
                    name: "sortBy",
                    title: "排序", 
                    type: "enumeration", 
                    value: "popularity.desc",
                    enumOptions: [
                        { title: "🔥 热度最高", value: "popularity.desc" },
                        { title: "⭐️ 评分最高", value: "vote_average.desc" },
                        { title: "🆕 最新上映", value: "primary_release_date.desc" }
                    ]
                },
                { name: "page", title: "页码", type: "page" }
            ]
        }
    ]
};

var UA_PC = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
// ============================================================================
// 1. 常量定义 (API 映射与类型映射)
// ============================================================================

const DOUBAN_URLS = {
    // 📺 剧集组
    "tv_american": "https://m.douban.com/rexxar/api/v2/subject_collection/tv_american/items",
    "tv_korean": "https://m.douban.com/rexxar/api/v2/subject_collection/tv_korean/items",
    "tv_japanese": "https://m.douban.com/rexxar/api/v2/subject_collection/tv_japanese/items",
    "tv_domestic": "https://m.douban.com/rexxar/api/v2/subject_collection/tv_domestic/items",
    "tv_animation": "https://m.douban.com/rexxar/api/v2/subject_collection/tv_animation/items",
    // 🎬 电影组
    "movie_hot": "https://m.douban.com/rexxar/api/v2/subject_collection/movie_real_time_hotest/items",
    "movie_weekly": "https://m.douban.com/rexxar/api/v2/subject_collection/movie_weekly_best/items",
    "movie_top250": "https://m.douban.com/rexxar/api/v2/subject_collection/movie_top250/items",
    "movie_showing": "https://m.douban.com/rexxar/api/v2/subject_collection/movie_showing/items",
    // 🎤 综艺组
    "show_domestic": "https://m.douban.com/rexxar/api/v2/subject_collection/show_domestic/items",
    "show_foreign": "https://m.douban.com/rexxar/api/v2/subject_collection/show_foreign/items",
    // 🏆 榜单组
    "tv_global_best": "https://m.douban.com/rexxar/api/v2/subject_collection/tv_global_best_weekly/items",
    "tv_chinese_best": "https://m.douban.com/rexxar/api/v2/subject_collection/tv_chinese_best_weekly/items"
};

const GENRE_MAP = {
    28: "动作", 12: "冒险", 16: "动画", 35: "喜剧", 80: "犯罪", 99: "纪录片",
    18: "剧情", 10751: "家庭", 14: "奇幻", 36: "历史", 27: "恐怖", 10402: "音乐",
    9648: "悬疑", 10749: "爱情", 878: "科幻", 10770: "电视电影", 53: "惊悚",
    10752: "战争", 37: "西部", 10759: "动作冒险", 10765: "科幻奇幻"
};

// ============================================================================
// 工具函数
// ============================================================================

function safeJsonParse(data) {
    try {
        if (typeof data === 'object') return data;
        return JSON.parse(data);
    } catch (e) { return null; }
}

function getTmdbImage(path) {
    if (!path) return undefined;
    if (path.startsWith("/")) return "https://image.tmdb.org/t/p/w500" + path;
    return path;
}

function getGenreString(ids) {
    if (!ids || !ids.length) return "";
    return ids.map(function(id) { return GENRE_MAP[id]; })
              .filter(Boolean)
              .slice(0, 3) 
              .join(" / ");
}

// 🔴 新增：清洗豆瓣剧名，剥离季数等后缀提高匹配率
function cleanDoubanTitle(rawTitle) {
    if (!rawTitle) return "";
    var title = rawTitle.trim();
    // 剔除 "第一季"、"第2部"、"Season 1" 等
    title = title.replace(/第[一二三四五六七八九十百\d]+[季部]/g, '');
    title = title.replace(/season\s*\d+/ig, '');
    // 压缩多余空格
    title = title.replace(/\s+/g, ' ').trim();
    return title;
}

// ============================================================================
// 🟢 模块逻辑 1：豆瓣 (统一入口)
// ============================================================================

async function searchTmdb(title, year, isTv) {
    if (!title) return null;
    try {
        var data = await Widget.tmdb.get("/search/multi", {
            params: { query: title, language: "zh-CN", page: 1 }
        });
        if (!data || !data.results || data.results.length === 0) return null;
        
        var validItems = data.results.filter(function(item) {
            return item.media_type === 'movie' || item.media_type === 'tv';
        });
        if (validItems.length === 0) return null;

        if (year) {
            var targetYear = parseInt(year);
            var match = validItems.find(function(item) {
                var d = item.release_date || item.first_air_date || "0000";
                var y = parseInt(d.substring(0, 4));
                return Math.abs(y - targetYear) <= 1;
            });
            if (match) return match;
        }

        if (isTv) {
             var tvMatch = validItems.find(function(item) { return item.media_type === 'tv'; });
             if (tvMatch) return tvMatch;
        }
        return validItems[0];
    } catch (e) { return null; }
}

async function mapLimit(items, limit, fn) {
    var ret = new Array(items.length), index = 0;
    async function worker() {
        while (index < items.length) {
            var current = index++;
            ret[current] = await fn(items[current], current);
        }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
    return ret;
}

// backdropFeature 读取 description 首行；简介置首行，原日期/评分保留在次行。
function overviewFirstDescription(overview, dateStr, rate) {
    var meta = dateStr ? `${dateStr} · ⭐ ${rate}` : `⭐ ${rate}`;
    return `${overview || "暂无简介"}\n${meta}`;
}

// Worker 快照直接返回成品 VideoItem，需在快速通道同样交换首行与简介。
function normalizeOverviewFirstItem(item) {
    if (!item || typeof item.description !== "string") return item;
    var lines = item.description.split(/\r?\n/);
    if (lines.length < 2) return item;
    var first = lines[0].trim();
    if (!/^(?:\d{4}(?:-\d{2}-\d{2})?\s+·\s+)?⭐\s*\d/.test(first)) return item;
    var normalized = Object.assign({}, item);
    normalized.description = lines.slice(1).join("\n") + "\n" + lines[0];
    return normalized;
}

async function loadDoubanModuleTeaBase(params) {
    var categoryKey = params.sort_by || "tv_american";
    if (categoryKey === "tv_domestic" && Number(params.page || 1) === 1) {
        try {
            var response = await Widget.http.request({url: "https://shrill-poetry-07fc.2407813427.workers.dev/home/douban-domestic-v1.json", method: "GET", timeout: 2500});
            var feed = safeJsonParse(response.data);
            var age = feed && Date.now() - feed.generatedAt;
            if (feed && feed.schema === 1 && age >= -300000 && age < 36 * 3600000 &&
                Array.isArray(feed.items) && feed.items.length > 0 && feed.items.length <= 20 &&
                feed.items.every(function (item) { return item && item.type === "tmdb" && item.tmdbId && item.title; })) return feed.items.map(normalizeOverviewFirstItem);
        } catch (_) { /* Continue with the original live lookup. */ }
    }
    var url = DOUBAN_URLS[categoryKey];
    
    if (!url) return [{ id: "config-error", title: "配置错误", subTitle: "未找到API", type: "text" }];

    var page = params.page || 1;
    var isTv = (url.indexOf("tv") > -1 || url.indexOf("show") > -1);

    var count = 20;
    var start = (page - 1) * count;
    var finalUrl = url.includes("?") ? `${url}&start=${start}&count=${count}` : `${url}?start=${start}&count=${count}`;

    try {
        var headers = { "Referer": "https://m.douban.com/", "User-Agent": UA_PC };
        var res = await Widget.http.request({ url: finalUrl, method: "GET", headers: headers, timeout: 10000 });
        var data = safeJsonParse(res.data);
        
        if (!data || !data.subject_collection_items) return [{ id: "empty", title: "列表为空", type: "text" }];

        var items = data.subject_collection_items;
        var promises = await mapLimit(items, 4, async function(item) {
            var rawTitle = item.title;
            // 🔴 关键改动：搜索前先清洗剧名
            var cleanTitle = cleanDoubanTitle(rawTitle);
            
            var year = item.year;
            var sub = item.card_subtitle || "";
            var rate = item.rating ? item.rating.value.toFixed(1) : "0.0";
            
            var tmdbItem = await searchTmdb(cleanTitle, year, isTv);

            // 🔴 关键改动：如果匹配成功则返回数据，匹配失败则直接丢弃 (返回 null)
            if (tmdbItem) {
                var dateStr = tmdbItem.release_date || tmdbItem.first_air_date || (year + "");
                var yearStr = dateStr.substring(0, 4);
                var genreStr = getGenreString(tmdbItem.genre_ids);
                var finalGenreTitle = genreStr || (isTv ? "剧集" : "电影");

                return {
                    id: String(tmdbItem.id),
                    tmdbId: tmdbItem.id,
                    type: "tmdb",
                    mediaType: tmdbItem.media_type,
                    title: tmdbItem.title || tmdbItem.name || rawTitle, // 界面显示依然保留原始名或TMDB名
                    
                    genreTitle: finalGenreTitle, 
                    subTitle: dateStr ? `⭐ ${rate} | ${dateStr}` : `⭐ ${rate}`,
                    description: overviewFirstDescription(item.info || tmdbItem.overview, dateStr, rate),
                    
                    posterPath: getTmdbImage(tmdbItem.poster_path),
                    backdropPath: getTmdbImage(tmdbItem.backdrop_path),
                    rating: parseFloat(rate) || tmdbItem.vote_average,
                    releaseDate: dateStr,
                    year: yearStr
                };
            }
            
            return null; // 搜不到直接抛弃
        });
        
        var results = promises;
        
        // 🔴 关键改动：过滤掉所有 null 的数据，不给客户端返回
        var finalResults = results.filter(function(r) { return r !== null; });
        
        if (finalResults.length === 0) return [{ id: "empty", title: "数据为空", subTitle: "本页无匹配TMDB的数据", type: "text" }];
        
        return finalResults;
        
    } catch (e) { return [{ id: "error", title: "错误", subTitle: e.message, type: "text" }]; }
}

// ============================================================================
// 🔵 模块逻辑 2：TMDB (统一入口)
// ============================================================================

function buildTmdbItem(item, mediaType) {
    var title = item.title || item.name;
    var dateStr = item.release_date || item.first_air_date || "";
    var yearStr = dateStr.substring(0, 4);
    var vote = item.vote_average ? item.vote_average.toFixed(1) : "0.0";
    var genreNames = getGenreString(item.genre_ids);

    return {
        id: String(item.id),
        tmdbId: item.id,
        type: "tmdb",
        mediaType: mediaType,
        title: title,
        
        genreTitle: genreNames || (mediaType === "tv" ? "剧集" : "电影"),
        subTitle: dateStr ? `⭐ ${vote} | ${dateStr}` : `⭐ ${vote}`,
        description: overviewFirstDescription(item.overview, dateStr, vote),
        
        posterPath: getTmdbImage(item.poster_path),
        backdropPath: getTmdbImage(item.backdrop_path),
        releaseDate: dateStr,
        year: yearStr,
        rating: item.vote_average
    };
}

async function loadTMDBModuleTeaBase(params) {
    var mode = params.sort_by || "movie"; 
    var page = params.page || 1;
    var sortMethod = params.sortBy || "popularity.desc";
    if (mode === "tv" && sortMethod === "primary_release_date.desc") sortMethod = "first_air_date.desc";
    
    var queryParams = {
        language: "zh-CN",
        page: page,
        sort_by: sortMethod,
        include_adult: false
    };

    if (params.genre) queryParams.with_genres = params.genre;
    if (params.year) {
        if (mode === "movie") queryParams.primary_release_year = params.year;
        else queryParams.first_air_date_year = params.year;
    }
    if (sortMethod && sortMethod.includes("vote_average")) queryParams["vote_count.gte"] = 100;

    var endpoint = (mode === "movie") ? "/discover/movie" : "/discover/tv";
    try {
        var data = await Widget.tmdb.get(endpoint, { params: queryParams });
        var items = (data && data.results) ? data.results : [];
        return items.map(function(item) { return buildTmdbItem(item, mode); });
    } catch (e) { return []; }
}
// ============================================================================
// 🗓 模块逻辑：追剧日历 (实时计算本周更新)
// ============================================================================

async function loadCalendarModuleTeaBase(params) {
    var dateChoice = params.dateStr || "today";
    var showType = params.showType || "all";
    var page = params.page || 1;
    var targetDate = new Date();
    if (dateChoice !== "today") {
        var currentDay = targetDate.getDay();
        var currentIsoDay = currentDay === 0 ? 7 : currentDay;
        var diffDays = parseInt(dateChoice) - currentIsoDay;
        targetDate.setDate(targetDate.getDate() + diffDays);
    }
    var year = targetDate.getFullYear();
    var month = ("0" + (targetDate.getMonth() + 1)).slice(-2);
    var day = ("0" + targetDate.getDate()).slice(-2);
    var exactDateStr = year + "-" + month + "-" + day;
    var commonParams = { language: "zh-CN", page: page, sort_by: "popularity.desc" };
    var requests = [];

    if (["tv", "anime", "show", "all"].includes(showType)) {
        var tvParams = Object.assign({}, commonParams, {
            "air_date.gte": exactDateStr,
            "air_date.lte": exactDateStr
        });
        if (showType === "anime") tvParams.with_genres = "16";
        if (showType === "show") tvParams.with_genres = "10764";
        if (showType === "tv" || showType === "all") tvParams.without_genres = "16,10764";
        requests.push(
            Widget.tmdb.get("/discover/tv", { params: tvParams }).then(function(data) {
                return ((data && data.results) || []).map(function(item) {
                    return Object.assign({}, item, { media_type: "tv" });
                });
            })
        );
    }
    if (showType === "movie" || showType === "all") {
        var movieParams = Object.assign({}, commonParams, {
            "primary_release_date.gte": exactDateStr,
            "primary_release_date.lte": exactDateStr
        });
        requests.push(
            Widget.tmdb.get("/discover/movie", { params: movieParams }).then(function(data) {
                return ((data && data.results) || []).map(function(item) {
                    return Object.assign({}, item, { media_type: "movie" });
                });
            })
        );
    }

    try {
        var settled = await Promise.allSettled(requests);
        var rawResults = [];
        for (const result of settled) {
            if (result.status === "fulfilled") rawResults.push(...result.value);
        }
        rawResults.sort(function(a, b) { return (b.popularity || 0) - (a.popularity || 0); });
        if (rawResults.length === 0) {
            return [{ id: "empty", title: "今日无更新", subTitle: "去别的日子看看吧", type: "text" }];
        }
        return rawResults.map(function(item) { return buildTmdbItem(item, item.media_type); });
    } catch (e) {
        return [{ id: "error", title: "错误", subTitle: e.message, type: "text" }];
    }
}

// ================= Tea TV episode badge v1 =================
// durationText 是 Rex 图片右下角原生角标。只增强 TMDB 电视剧；电影/文本/非 TMDB 项不请求。
var TV_BADGE_MEMORY = {};
var TV_BADGE_PREFIX = "tea_tv_episode_badge_v1:";
var TV_BADGE_MAX_ITEMS = 24;
var TV_BADGE_RELAY = "https://rex-mod-cdn.2407813427.workers.dev/relay/tmdb/3/tv/";

function tvBadgeToday() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function tvBadgeStorageGet(key) {
    try { return Widget.storage && Widget.storage.get ? Widget.storage.get(key) : null; } catch (_) { return null; }
}
function tvBadgeStorageSet(key, value) {
    try { if (Widget.storage && Widget.storage.set) Widget.storage.set(key, value); } catch (_) {}
}
function tvBadgeCacheGet(id) {
    var key = TV_BADGE_PREFIX + id;
    var now = Date.now();
    var mem = TV_BADGE_MEMORY[key];
    if (mem && mem.expires > now) return { hit: true, label: mem.label };
    var saved = tvBadgeStorageGet(key);
    if (saved && saved.expires > now && typeof saved.label === "string") {
        TV_BADGE_MEMORY[key] = saved;
        return { hit: true, label: saved.label };
    }
    return { hit: false };
}
function tvBadgeCacheSet(id, label, ttl) {
    var value = { label: label || "", expires: Date.now() + ttl };
    TV_BADGE_MEMORY[TV_BADGE_PREFIX + id] = value;
    tvBadgeStorageSet(TV_BADGE_PREFIX + id, value);
}
function tvBadgeParseResponse(resp) {
    var data = resp && Object.prototype.hasOwnProperty.call(resp, "data") ? resp.data : resp;
    if (typeof data === "string") { try { data = JSON.parse(data); } catch (_) { return null; } }
    return data && typeof data === "object" && data.id ? data : null;
}
async function tvBadgeFetchDetail(id) {
    // 公共中继对电视剧详情做 6 小时边缘缓存，降低首页多行重复补查的上游压力。
    if (Widget.http && Widget.http.request) {
        try {
            var resp = await Widget.http.request({ url: TV_BADGE_RELAY + id + "?language=zh-CN", method: "GET", timeout: 8000 });
            var cached = tvBadgeParseResponse(resp);
            if (cached) return cached;
        } catch (_) { /* 继续走 Rex 内置 TMDB 通道 */ }
    }
    var fresh = await Widget.tmdb.get("/tv/" + id, { params: { language: "zh-CN" } });
    var parsed = tvBadgeParseResponse(fresh);
    if (!parsed) throw new Error("TV detail unavailable");
    return parsed;
}
function tvBadgeLabel(d) {
    if (!d) return { label: "", ended: false };
    var status = String(d.status || "");
    var ended = status === "Ended" || status === "Canceled";
    var seasons = Array.isArray(d.seasons) ? d.seasons.filter(function (s) { return s && Number(s.season_number) > 0; }) : [];
    var seasonCount = Math.max(Number(d.number_of_seasons) || 0, seasons.length);
    var totalEpisodes = Number(d.number_of_episodes) || 0;
    var today = tvBadgeToday();
    var active = d.last_episode_to_air || null;
    var next = d.next_episode_to_air || null;
    // TMDB 的 next_episode_to_air 可能已经是今天：到播出日即按已更新展示。
    if (next && next.air_date && next.air_date <= today && (!active || !active.air_date || next.air_date >= active.air_date)) active = next;
    var season = active && Number(active.season_number) > 0 ? Number(active.season_number) : 0;
    var episode = active && Number(active.episode_number) > 0 ? Number(active.episode_number) : 0;
    var genres = Array.isArray(d.genres) ? d.genres : [];
    var variety = genres.some(function (g) { return g && (Number(g.id) === 10764 || Number(g.id) === 10767); });
    var unit = variety ? "期" : "集";
    var label = "";
    if (ended) {
        if (seasonCount > 1) label = "全" + seasonCount + "季";
        else if (totalEpisodes > 0) label = "全" + totalEpisodes + unit;
        else if (episode > 0) label = "全" + episode + unit;
    } else {
        if (episode > 0) {
            label = season > 1 ? "S" + season + "·更新至" + episode + unit : "更新至" + episode + unit;
        } else if (seasonCount > 1) label = "共" + seasonCount + "季";
        else if (totalEpisodes > 0) label = "共" + totalEpisodes + unit;
    }
    return { label: label, ended: ended };
}
async function tvBadgeGetLabel(id) {
    var cached = tvBadgeCacheGet(id);
    if (cached.hit) return cached.label;
    try {
        var detail = await tvBadgeFetchDetail(id);
        var result = tvBadgeLabel(detail);
        tvBadgeCacheSet(id, result.label, result.ended ? 7 * 86400000 : 21600000);
        return result.label;
    } catch (_) {
        tvBadgeCacheSet(id, "", 1800000);
        return "";
    }
}
function tvBadgeId(item) {
    var raw = item && (item.tmdbId || item.id);
    var id = String(raw == null ? "" : raw).replace(/^tv\./, "");
    return /^\d+$/.test(id) && Number(id) > 0 ? id : "";
}
async function enrichTvEpisodeBadges(items) {
    if (!Array.isArray(items) || items.length === 0) return items;
    var targets = [];
    for (var i = 0; i < items.length && targets.length < TV_BADGE_MAX_ITEMS; i++) {
        var item = items[i];
        if (!item || item.type !== "tmdb") continue;
        var mediaType = item.mediaType || item.media_type;
        // 兼容旧版聚合缓存：{ id: "tv.12345", type: "tmdb" } 没有 mediaType。
        if (!mediaType && /^tv\./.test(String(item.id || ""))) mediaType = "tv";
        if (mediaType !== "tv") continue;
        // 已由数据源提供角标时不覆盖，也不产生详情请求。
        if (typeof item.durationText === "string" && /(?:集|期|季)/.test(item.durationText)) continue;
        var id = tvBadgeId(item);
        if (id) targets.push({ index: i, id: id });
    }
    if (!targets.length) return items;
    var output = items.slice();
    var cursor = 0;
    async function worker() {
        while (cursor < targets.length) {
            var current = targets[cursor++];
            var label = await tvBadgeGetLabel(current.id);
            if (label) {
                var copy = Object.assign({}, output[current.index]);
                copy.durationText = label;
                output[current.index] = copy;
            }
        }
    }
    var workers = [];
    for (var w = 0; w < Math.min(4, targets.length); w++) workers.push(worker());
    await Promise.all(workers);
    return output;
}


// ---- Tea TV badge wrappers：保留原处理器，统一在出口补充 durationText ----
async function loadDoubanModule(params) {
    return enrichTvEpisodeBadges(await loadDoubanModuleTeaBase(params || {}));
}
async function loadTMDBModule(params) {
    return enrichTvEpisodeBadges(await loadTMDBModuleTeaBase(params || {}));
}
async function loadCalendarModule(params) {
    return enrichTvEpisodeBadges(await loadCalendarModuleTeaBase(params || {}));
}

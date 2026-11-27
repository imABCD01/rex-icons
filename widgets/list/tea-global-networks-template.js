/**
 * 全球电视台与流媒体宇宙 (终极版)
 * 核心逻辑: 动态解除国家锁定，精准匹配全球三十多个流媒体与电视网 ID
 * 涵盖: 国内爱优腾芒、四大卫视、港台本土平台、韩国三大台、以及网飞/HBO等国际巨头
 */

var WidgetMetadata = {
    id: "tea.makka_global_networks.template",
    title: "全球影视平台ALL IN ONE·剧集角标版",
    description: "全网最全的频道聚合：覆盖爱优腾、网飞、HBO、韩国tvN及各大卫视",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    version: "1.2.8", // Tea TV badges; // 更新图片域名并增加非法平台参数兜底
    requiredVersion: "0.0.1",
    site: "https://t.me/MakkaPakkaOvO",
    modules: [
        {
            title: "全网热播发现",
            functionName: "loadPlatformList",
            type: "video", // 🔑 魔法 1：外层模块为 video
            cacheDuration: 3600,
            params: [
                {
                    name: "sort_by", // 👈 魔法字段：把这70多个平台的选择提到右上角！
                    title: "选择频道/平台",
                    type: "enumeration",
                    value: "netflix",
                    enumOptions: [
                        { title: "🌟 全球综合热播", value: "all" },
                        { title: "🔴 Netflix (网飞)", value: "netflix" },
                        { title: "🟣 HBO", value: "hbo" },
                        { title: "🔵 Disney+ (迪士尼)", value: "disney" },
                        { title: "🍏 Apple TV+", value: "apple" },
                        { title: "📦 Amazon Prime", value: "amazon" },
                        { title: "🐧 腾讯视频", value: "tencent" },
                        { title: "🥝 爱奇艺", value: "iqiyi" },
                        { title: "👖 优酷", value: "youku" },
                        { title: "🥭 芒果TV", value: "mango" },
                        { title: "📺 BiliBili", value: "bilibili" },
                        { title: "📡 湖南卫视", value: "hunan" },
                        { title: "📡 浙江卫视", value: "zhejiang" },
                        { title: "📡 东方卫视", value: "dragon" },
                        { title: "📡 CCTV-8", value: "cctv8" },
                        { title: "🇭🇰 ViuTV", value: "viutv" },
                        { title: "🇹🇼 LINE TV", value: "linetv" },
                        { title: "🇹🇼 Hami Video", value: "hami" },
                        { title: "🇹🇼 CATCHPLAY", value: "catchplay" },
                        { title: "🇰🇷 tvN", value: "tvn" },
                        { title: "🇰🇷 SBS", value: "sbs" },
                        { title: "🇰🇷 KBS2", value: "kbs2" },
                        { title: "🇺🇸 ABC", value: "abc" },
                        { title: "🌍 国家地理频道", value: "natgeo" }
                    ]
                },
                {
                    name: "mediaType",
                    title: "影视分类",
                    type: "enumeration",
                    value: "tv",
                    enumOptions: [
                        { title: "📺 纯净剧集 (Drama)", value: "tv" },
                        { title: "🎬 电影 (Movie)", value: "movie" },
                        { title: "🐰 动漫 (Anime)", value: "anime" },
                        { title: "🎤 综艺/真人秀", value: "variety" }
                    ]
                },
                {
                    name: "sortBy",
                    title: "排序方式",
                    type: "enumeration",
                    value: "hot",
                    enumOptions: [
                        { title: "🔥 平台热度榜", value: "hot" },
                        { title: "🆕 最新上线榜", value: "new" },
                        { title: "🏆 TMDB 高分榜", value: "top" }
                    ]
                },
                { name: "page", title: "页码", type: "page", startPage: 1 }
            ]
        }
    ]
};

// ================= 1. 核心映射配置 (全球ID库) =================

const PLATFORM_MAP = {
    netflix: { network: "213", provider: "8", region: "US", name: "Netflix" },
    hbo:     { network: "49|3186", provider: "118", region: "US", name: "HBO" },
    disney:  { network: "2739", provider: "337", region: "US", name: "Disney+" },
    apple:   { network: "2552", provider: "350", region: "US", name: "Apple TV+" },
    amazon:  { network: "1024", provider: "119", region: "US", name: "Amazon" },
    tencent: { network: "2007|3353", provider: "138", region: "CN", name: "腾讯" },
    iqiyi:   { network: "1330", provider: "238", region: "CN", name: "爱奇艺" },
    youku:   { network: "1419", provider: "331", region: "CN", name: "优酷" },
    mango:   { network: "1631", provider: "1944", region: "CN", name: "芒果" },
    bilibili:{ network: "1605", provider: "2280", region: "CN", name: "B站" },
    hunan:   { network: "952", provider: null, region: "CN", name: "湖南卫视" },
    zhejiang:{ network: "989", provider: null, region: "CN", name: "浙江卫视" },
    dragon:  { network: "1056", provider: null, region: "CN", name: "东方卫视" },
    cctv8:   { network: "521", provider: null, region: "CN", name: "CCTV-8" },
    viutv:   { network: "2146", provider: null, region: "HK", name: "ViuTV" },
    linetv:  { network: "1671", provider: null, region: "TW", name: "LINE TV" },
    hami:    { network: "4571", provider: null, region: "TW", name: "Hami" },
    catchplay:{ network: "5002", provider: null, region: "TW", name: "CATCHPLAY" },
    tvn:     { network: "866", provider: null, region: "KR", name: "tvN" },
    sbs:     { network: "156", provider: null, region: "KR", name: "SBS" },
    kbs2:    { network: "342", provider: null, region: "KR", name: "KBS2" },
    abc:     { network: "2", provider: null, region: "US", name: "ABC" },
    natgeo:  { network: "43", provider: null, region: "US", name: "国家地理" },
    all:     { network: null, provider: null, region: null, name: "综合" }
};

const GENRE_MAP = {
    28: "动作", 12: "冒险", 16: "动画", 35: "喜剧", 80: "犯罪", 99: "纪录片",
    18: "剧情", 10751: "家庭", 14: "奇幻", 36: "历史", 27: "恐怖", 10402: "音乐",
    9648: "悬疑", 10749: "爱情", 878: "科幻", 10770: "电视电影", 53: "惊悚",
    10752: "战争", 37: "西部", 10759: "动作冒险", 10764: "真人秀", 10767: "脱口秀"
};

function getGenreText(ids) {
    if (!ids || !Array.isArray(ids)) return "影视";
    const genres = ids.map(id => GENRE_MAP[id]).filter(Boolean);
    return genres.length > 0 ? genres.slice(0, 2).join(" / ") : "影视";
}

// 🎯 核心修正：完全向你的二次元代码对齐
function buildItem(item, isMovie, platformName) {
    if (!item) return null;
    
    const mediaType = isMovie ? "movie" : "tv";
    const title = item.title || item.name;
    const releaseDate = item.release_date || item.first_air_date || "";
    const score = item.vote_average ? item.vote_average.toFixed(1) : "0.0";
    const genreText = getGenreText(item.genre_ids);
    
    let typeTag = isMovie ? "🎬" : "📺";
    if (item.genre_ids?.includes(16)) typeTag = "🐰";
    if (item.genre_ids?.includes(10764) || item.genre_ids?.includes(10767)) typeTag = "🎤";

    return {
        id: String(item.id),
        tmdbId: parseInt(item.id),
        type: "tmdb", // 🔑 魔法 2：内层项目为 tmdb 类型，完全适配框架逻辑
        mediaType: mediaType,
        title: title,
        
        genreTitle: genreText, 
        
        // 🔑 魔法 3：竖版下这行显示在副标题位置
        description: `${typeTag} ${platformName} | ⭐ ${score}`, 
        
        // 传给内核的日期，横版排版会自动提年份
        releaseDate: releaseDate, 
        
        // 🔑 魔法 4：彻底抛弃 coverUrl，严格使用 posterPath 和 backdropPath
        posterPath: item.poster_path ? `https://shrill-poetry-07fc.2407813427.workers.dev/t/p/w500${item.poster_path}` : "",
        backdropPath: item.backdrop_path ? `https://shrill-poetry-07fc.2407813427.workers.dev/t/p/w780${item.backdrop_path}` : "",
        
        rating: score
    };
}

// ================= 2. 核心请求逻辑 =================

async function loadPlatformListTeaBase(params) {
    // 👈 逻辑接管：从 sort_by 获取 platform 选择
    const platform = params.sort_by || "netflix";
    const mediaType = params.mediaType || "tv";
    const category = params.sortBy || "hot";
    const page = params.page || 1;

    const today = new Date().toISOString().split('T')[0];
    const isMovie = (mediaType === "movie");
    const endpoint = isMovie ? "/discover/movie" : "/discover/tv";
    const platformConfig = PLATFORM_MAP[platform];
    if (!platformConfig) {
        return [{ id: "error", type: "text", title: "平台参数无效", description: "请重新选择频道或平台" }];
    }

    let queryParams = {
        language: "zh-CN",
        page: page
    };

    if (platform !== "all") {
        if (isMovie) {
            if (!platformConfig.provider) {
                return [{ id: "empty", type: "text", title: "无电影分类", description: `[${platformConfig.name}] 暂不支持该分类。` }];
            }
            queryParams.with_watch_providers = platformConfig.provider;
            queryParams.watch_region = platformConfig.region || "US";
        } else {
            queryParams.with_networks = platformConfig.network;
        }
    }

    if (mediaType === "anime") {
        queryParams.with_genres = "16";
    } else if (mediaType === "variety") {
        queryParams.with_genres = "10764|10767";
    } else if (mediaType === "tv") {
        queryParams.without_genres = "16,10764,10767";
    }

    if (category === "hot") {
        queryParams.sort_by = "popularity.desc";
        queryParams["vote_count.gte"] = 2;
    } 
    else if (category === "new") {
        queryParams.sort_by = isMovie ? "primary_release_date.desc" : "first_air_date.desc";
        if (isMovie) {
            queryParams["primary_release_date.lte"] = today;
        } else {
            queryParams["first_air_date.lte"] = today;
        }
    } 
    else if (category === "top") {
        queryParams.sort_by = "vote_average.desc";
        queryParams["vote_count.gte"] = 30; 
    }

    try {
        const res = await Widget.tmdb.get(endpoint, { params: queryParams });
        const items = (res.results || []).map(i => buildItem(i, isMovie, platformConfig.name)).filter(Boolean);

        if (items.length === 0) {
             return [{ id: "empty", type: "text", title: "无数据", description: `在 [${platformConfig.name}] 暂未找到符合该条件的影视记录` }];
        }

        return items;

    } catch (error) {
        return [{ id: "error", type: "text", title: "网络异常", description: "请求失败，请重试" }];
    }
}

// ================= Tea HTML-template TV episode badge v1 =================
// 复刻 makka11 可用链路：type:url + link + durationText，loadDetail 还原原生 TMDB。
var TV_BADGE_MEMORY = {};
var TV_BADGE_PREFIX = "tea_tv_template_badge_v1:";
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
        // 自制模板支持“季”；若同时给 makka11 使用，建议它以总集数为主。
        if (seasonCount > 1) label = "全" + seasonCount + "季";
        else if (totalEpisodes > 0) label = "全" + totalEpisodes + unit;
        else if (episode > 0) label = "全" + episode + unit;
    } else {
        if (episode > 0) {
            // 以空格分隔季号，makka11 会转成 S03E08；自制模板则显示 S3·更新至8集。
            label = season > 1 ? "S" + season + " 更新至" + episode + unit : "更新至" + episode + unit;
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
function tvBadgeRawImage(value) {
    if (typeof value !== "string" || !value || value.charAt(0) === "/" || value.indexOf("icon:") === 0) return value;
    var match = value.match(/\/t\/p\/(?:w\d+|original)(\/[^"?#]+)/);
    return match ? match[1] : value;
}
function tvBadgeTemplateItem(item, id, label) {
    var link = "douban-airing:tv:" + id;
    var copy = Object.assign({}, item, {
        id: link,
        link: link,
        type: "url",
        mediaType: "tv",
        durationText: label
    });
    // 与可用 douban-airing 条目一致，图片保留 TMDB 原始路径，交给 Rex 转 icon:。
    ["posterPath", "backdropPath", "coverUrl", "detailPoster"].forEach(function (key) {
        if (copy[key]) copy[key] = tvBadgeRawImage(copy[key]);
    });
    if (Array.isArray(copy.backdropPaths)) copy.backdropPaths = copy.backdropPaths.map(tvBadgeRawImage);
    return copy;
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
            if (label) output[current.index] = tvBadgeTemplateItem(output[current.index], current.id, label);
        }
    }
    var workers = [];
    for (var w = 0; w < Math.min(4, targets.length); w++) workers.push(worker());
    await Promise.all(workers);
    return output;
}

// 与参考模块一致：列表用 url 透传模板字段，打开时还原为 Rex 原生 TMDB 详情。
async function loadDetail(link) {
    var match = /^(?:douban-airing|tmdb):(movie|tv):(\d+)$/.exec(String(link || ""));
    if (!match) return [];
    return { id: match[2], type: "tmdb", mediaType: match[1] };
}

// ---- Tea TV badge wrappers：保留原处理器，统一在出口补充 durationText ----
async function loadPlatformList(params) {
    return enrichTvEpisodeBadges(await loadPlatformListTeaBase(params || {}));
}

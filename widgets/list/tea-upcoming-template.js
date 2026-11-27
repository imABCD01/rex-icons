WidgetMetadata = {
    id: "tea.tmdb_upcoming_center_makka.template",
    title: "即将上映与热映榜·剧集角标版",
    description: "追踪院线即将上映的电影与最新剧集，热度显示，不错过任何一部大片",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    version: "1.0.4", // Tea TV badges; // 更新图片 Worker 域名，消除旧域名 302 跳转
    requiredVersion: "0.0.1",
    site: "https://t.me/MakkaPakkaOvO",
    modules: [
        {
            title: "🎬 新片追踪",
            functionName: "loadUpcoming",
            type: "list", // 可随时切换为 video 测试竖版
            cacheDuration: 3600, // 缓存1小时
            params: [
                {
                    name: "category",
                    title: "选择频道",
                    type: "enumeration",
                    value: "movie_upcoming",
                    enumOptions: [
                        { title: "🍿 即将上映 (期待榜)", value: "movie_upcoming" },
                        { title: "🔥 正在热映 (院线)", value: "movie_now_playing" },
                        { title: "📺 近期开播 (新剧集)", value: "tv_on_the_air" },
                        { title: "📅 今日首播 (追更)", value: "tv_airing_today" }
                    ]
                },
                { name: "page", title: "页码", type: "page", startPage: 1 }
            ]
        }
    ]
};

// ================= 辅助字典 =================

// TMDB 类型字典映射
const GENRE_MAP = {
    10759: "动作冒险", 16: "动画", 35: "喜剧", 80: "犯罪", 99: "纪录片",
    18: "剧情", 10751: "家庭", 10762: "儿童", 9648: "悬疑", 10763: "新闻",
    10764: "真人秀", 10765: "科幻", 10766: "肥皂剧", 10767: "脱口秀",
    10768: "政治", 37: "西部", 28: "动作", 12: "冒险", 14: "奇幻", 
    878: "科幻", 27: "恐怖", 10749: "爱情", 53: "惊悚", 10752: "战争"
};

// 提取首个类型名称
function getGenreText(ids) {
    if (!ids || !Array.isArray(ids)) return "影视";
    return ids.map(id => GENRE_MAP[id]).filter(Boolean).slice(0, 1).join("") || "影视";
}


// ================= 逻辑处理部分 =================

// 数据格式化函数，包含倒计时计算魔法
function buildItem(item, mediaType) {
    if (!item) return null;
    
    // 兼容电影和剧集的标题与日期字段
    const title = item.title || item.name;
    const releaseDate = item.release_date || item.first_air_date || "";
    const yearStr = releaseDate ? releaseDate.substring(0, 4) : "";
    
    // 获取类型文本 (如: 科幻)
    const genreText = getGenreText(item.genre_ids);
    
    // 计算上映倒计时
    let dateLabel = `📅 ${releaseDate}`;
    if (releaseDate) {
        const today = new Date();
        // 抹平时间差，只对比日期
        today.setHours(0, 0, 0, 0); 
        const rDate = new Date(releaseDate);
        rDate.setHours(0, 0, 0, 0);
        
        const diffTime = rDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0) {
            dateLabel = `⏳ 还有 ${diffDays} 天上映 (${releaseDate})`;
        } else if (diffDays === 0) {
            dateLabel = `🔥 今天首映! (${releaseDate})`;
        } else {
            dateLabel = `✅ 已上映 (${releaseDate})`;
        }
    }

    const score = item.vote_average ? item.vote_average.toFixed(1) : "暂无";
    const popularity = item.popularity ? Math.round(item.popularity) : 0;

    // ✨ 构建副标题：科幻 热度:213 （横版 Forward 会自动在前面拼接 年份 • ）
    const displaySubtitle = `${genreText} 热度:${popularity}`;

    return {
        id: String(item.id),
        tmdbId: parseInt(item.id),
        type: "tmdb", // FW 核心：调起原生页面获取预告片
        mediaType: mediaType,
        title: title,
        
        // 渲染给横版列表的副标题
        genreTitle: displaySubtitle, 
        subTitle: displaySubtitle,
        
        coverUrl: item.poster_path ? `https://shrill-poetry-07fc.2407813427.workers.dev/t/p/w500${item.poster_path}` : "",
        posterPath: item.poster_path ? `https://shrill-poetry-07fc.2407813427.workers.dev/t/p/w500${item.poster_path}` : "", // 兼容标准字段
        backdropPath: item.backdrop_path ? `https://shrill-poetry-07fc.2407813427.workers.dev/t/p/w780${item.backdrop_path}` : "",
        
        // 将原先的倒计时魔法和评分放进简介，不丢失信息！
        description: `${dateLabel} | ⭐ 评分: ${score}\n${item.overview || "这部影片目前还没有中文简介，敬请期待！"}`,
        rating: item.vote_average || 0,
        
        // ✨ 新增的核心字段，负责点亮横竖版的时间显示
        year: yearStr,           // 负责横版榜单的最前面年份："2025"
        releaseDate: releaseDate // 负责竖版海报下方的完整日期："2025-05-12"
    };
}

// 主请求函数
async function loadUpcomingTeaBase(params) {
    const category = params.category || "movie_upcoming";
    const page = params.page || 1;

    let endpoint = "";
    let mediaType = "movie";

    // 路由匹配
    if (category === "movie_upcoming") {
        endpoint = "/movie/upcoming";
    } else if (category === "movie_now_playing") {
        endpoint = "/movie/now_playing";
    } else if (category === "tv_on_the_air") {
        endpoint = "/tv/on_the_air";
        mediaType = "tv";
    } else if (category === "tv_airing_today") {
        endpoint = "/tv/airing_today";
        mediaType = "tv";
    }

    try {
        const queryParams = { 
            language: "zh-CN", 
            page: page,
            region: "US" // 加入 region 参数，保证上映时间的准确性（好莱坞大片以北美时间为主）
        };

        const res = await Widget.tmdb.get(endpoint, { params: queryParams });
        const items = (res.results || []).map(i => buildItem(i, mediaType)).filter(Boolean);
        
        return items;

    } catch (error) {
        console.error("请求失败:", error);
        return [{
            id: "error",
            type: "text",
            title: "加载失败",
            description: "获取最新上映数据失败，请下拉刷新或检查网络"
        }];
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
async function loadUpcoming(params) {
    return enrichTvEpisodeBadges(await loadUpcomingTeaBase(params || {}));
}

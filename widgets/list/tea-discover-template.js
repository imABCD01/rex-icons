WidgetMetadata = {
    id: "tea.discover_hub_ultimate.template",
    title: "探索发现 | 惊喜推荐·剧集角标版",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    description: "聚合【今天看什么】、【Trakt惊喜推荐】与【那年今日】、一站式发现好片。",
    version: "1.1.1", // Tea TV badges; // backdropFeature 首行显示剧情简介，保留日期/推荐理由为次行
    requiredVersion: "0.0.1",
    site: "https://t.me/MakkaPakkaOvO",

    // 1. 全局参数 (仅剩 Trakt 选填)
    globalParams: [
        {
            name: "traktUser",
            title: "Trakt 用户名 (可选)",
            type: "input",
            description: "填入 Trakt Slug 可基于历史推荐。",
            value: ""
        },
        {
            name: "traktClientId",
            title: "Trakt Client ID",
            type: "input",
            description: "选填，不填则使用内置。Trakt 专用。",
            value: ""
        }
    ],

    modules: [
        // ===========================================
        // 模块 1: 今天看什么 (随机/推荐)
        // ===========================================
        {
            title: "今天看什么（完全随机推荐）",
            functionName: "loadRecommendations",
            type: "video", // 升级为 video 模式
            cacheDuration: 0, 
            params: [
                {
                    name: "mediaType",
                    title: "想看什么",
                    type: "enumeration",
                    value: "tv",
                    enumOptions: [
                        { title: "电视剧 (TV Shows)", value: "tv" },
                        { title: "电影 (Movies)", value: "movie" }
                    ]
                }
            ]
        },

        // ===========================================
        // 模块 2: 惊喜推荐 (基于 Trakt 混合推荐)
        // ===========================================
        {
            title: "Trakt惊喜推荐（基于Trakt记录推荐）",
            functionName: "loadRandomMix",
            type: "video", // 升级为 video 模式
            cacheDuration: 21600, // 6小时刷新
            params: [] // 无需额外参数
        },

        // ===========================================
        // 模块 3: 那年今日 (历史回顾)
        // ===========================================
        {
            title: "那年今日（历史上今天上映电影）",
            functionName: "loadHistoryToday",
            type: "video", // 升级为 video 模式
            cacheDuration: 43200, 
            params: [
                {
                    // 👈 核心修改：将 region 改为 sort_by 以触发右上角菜单
                    name: "sort_by",
                    title: "上映地区",
                    type: "enumeration",
                    value: "Global",
                    enumOptions: [
                        { title: "全球 (Global)", value: "Global" },
                        { title: "美国 (US)", value: "US" },
                        { title: "中国 (CN)", value: "CN" },
                        { title: "香港 (HK)", value: "HK" },
                        { title: "日本 (JP)", value: "JP" }
                    ]
                },
                {
                    name: "sortOrder",
                    title: "排序方式",
                    type: "enumeration",
                    value: "time_desc",
                    enumOptions: [
                        { title: "时间: 由近到远", value: "time_desc" },
                        { title: "评分: 由高到低", value: "vote_desc" },
                        { title: "热度: 由高到低", value: "pop_desc" }
                    ]
                }
            ]
        }
    ]
};

// =========================================================================
// 0. 通用工具与字典
// =========================================================================

// 更新内置的 Trakt Client ID
const DEFAULT_TRAKT_ID = "95b59922670c84040db3632c7aac6f33704f6ffe5cbf3113a056e37cb45cb482";

const GENRE_MAP = {
    28: "动作", 12: "冒险", 16: "动画", 35: "喜剧", 80: "犯罪", 99: "纪录片",
    18: "剧情", 10751: "家庭", 14: "奇幻", 36: "历史", 27: "恐怖", 10402: "音乐",
    9648: "悬疑", 10749: "爱情", 878: "科幻", 10770: "电视电影", 53: "惊悚",
    10752: "战争", 37: "西部", 10759: "动作冒险", 10762: "儿童", 10763: "新闻",
    10764: "真人秀", 10765: "科幻奇幻", 10766: "肥皂剧", 10767: "脱口秀", 10768: "战争政治"
};

function getGenreText(ids) {
    if (!ids || !Array.isArray(ids)) return "";
    return ids.map(id => GENRE_MAP[id]).filter(Boolean).slice(0, 3).join(" / ");
}

// --- 适配 Video 横竖版的 buildItem 函数 ---
function buildItem({ id, tmdbId, type, title, date, poster, backdrop, rating, genreText, subTitle, desc }) {
    var metaDescription = date ? `${date} · ${subTitle || '⭐ ' + rating}` : (subTitle || `⭐ ${rating}`);
    return {
        id: String(id),
        tmdbId: parseInt(tmdbId),
        type: "tmdb",
        mediaType: type,
        title: title,
        
        // 横版：流派与类型展示
        genreTitle: genreText || (type === "tv" ? "剧集" : "电影"), 
        
        // 竖版：将完整日期和特殊原因(如推荐理由)拼接展示
        description: `${desc || "暂无简介"}\n${metaDescription}`,
        
        // 传递给内核提取横版年份
        releaseDate: date,
        
        posterPath: poster ? `https://shrill-poetry-07fc.2407813427.workers.dev/t/p/w500${poster}` : "",
        backdropPath: backdrop ? `https://shrill-poetry-07fc.2407813427.workers.dev/t/p/w780${backdrop}` : "",
        rating: parseFloat(rating) || 0,
        subTitle: subTitle // 备用保留
    };
}

// =========================================================================
// 1. 业务逻辑：今天看什么
// =========================================================================

async function loadRecommendationsTeaBase(params = {}) {
    const { traktUser, mediaType = "tv" } = params;
    const traktClientId = params.traktClientId || DEFAULT_TRAKT_ID;

    let results = [];
    let reason = "";

    if (traktUser) {
        try {
            const historyItem = await fetchLastWatched(traktUser, mediaType, traktClientId);
            if (historyItem && historyItem.tmdbId) {
                reason = `✨ 因为你看过: ${historyItem.title}`;
                results = await fetchTmdbRecommendations(historyItem.tmdbId, mediaType);
            } else {
                reason = "暂无记录，随机推荐";
                results = await fetchRandomTmdb(mediaType);
            }
        } catch (e) {
            reason = "Trakt 连接失败，随机推荐";
            results = await fetchRandomTmdb(mediaType);
        }
    } else {
        reason = "🎲 随机发现";
        results = await fetchRandomTmdb(mediaType);
    }

    if (!results || results.length === 0) return [{ id: "err", type: "text", title: "未找到推荐" }];

    return results.slice(0, 15).map(item => {
        const date = item.first_air_date || item.release_date || ""; // 提取完整日期
        const genreText = getGenreText(item.genre_ids);
        
        return buildItem({
            id: item.id, tmdbId: item.id, type: mediaType,
            title: item.name || item.title,
            date: date,
            poster: item.poster_path,
            backdrop: item.backdrop_path,
            rating: item.vote_average?.toFixed(1),
            genreText: genreText,
            subTitle: reason,
            desc: item.overview
        });
    });
}

// =========================================================================
// 2. 业务逻辑：惊喜推荐 (混合)
// =========================================================================

async function loadRandomMixTeaBase(params = {}) {
    const { traktUser, traktClientId } = params;
    const clientId = traktClientId || DEFAULT_TRAKT_ID;

    if (!traktUser) {
        return [{ id: "err", type: "text", title: "需填写 Trakt 用户名", subTitle: "请在设置中填写" }];
    }

    // 获取历史
    const uniqueShows = await fetchUniqueHistory(traktUser, clientId);
    if (uniqueShows.length === 0) return [{ id: "empty", type: "text", title: "Trakt 无历史记录" }];

    // 随机抽取 5 部
    const candidatePool = uniqueShows.slice(0, 30);
    const seeds = getRandomSeeds(candidatePool, Math.min(candidatePool.length, 5));

    // 并发获取推荐
    const promiseList = seeds.map(seed => fetchTmdbRecsForSeed(seed));
    const resultsArray = await Promise.all(promiseList);

    // 混合洗牌
    const mixedList = [];
    let maxLen = 0;
    resultsArray.forEach(l => { if (l.length > maxLen) maxLen = l.length; });

    const seenIds = new Set();
    for (let i = 0; i < maxLen; i++) {
        for (const list of resultsArray) {
            if (i < list.length) {
                const item = list[i];
                if (!seenIds.has(item.tmdbId)) {
                    seenIds.add(item.tmdbId);
                    mixedList.push(item);
                }
            }
        }
    }

    const finalItems = mixedList.slice(0, 20);
    if (finalItems.length === 0) return [{ id: "err", type: "text", title: "无推荐结果" }];

    return finalItems;
}

// =========================================================================
// 3. 业务逻辑：那年今日
// =========================================================================

async function loadHistoryTodayTeaBase(params = {}) {
    // 👈 核心修改：将 params.sort_by 接管作为地区参数 region，保证逻辑不崩溃
    const region = params.sort_by || "Global";
    const { sortOrder = "time_desc" } = params;
    const today = new Date();
    const currentYear = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    const yearsAgo = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
    const targetYears = yearsAgo.map(diff => ({ year: currentYear - diff, diff: diff }));

    let allMovies = [];
    const batchRequest = async (years) => {
        const promises = years.map(yObj => fetchMovieForDate(yObj.year, month, day, region, yObj.diff));
        const results = await Promise.all(promises);
        results.forEach(list => { if (list) allMovies = allMovies.concat(list); });
    };

    // 年份已按从近到远排列。评分、热度排序需要全部年份参与。
    const batchSize = sortOrder === "time_desc" ? 4 : 7;
    for (let start = 0; start < targetYears.length; start += batchSize) {
        await batchRequest(targetYears.slice(start, start + batchSize));
        if (sortOrder === "time_desc" && allMovies.length >= 20) break;
    }

    if (allMovies.length === 0) return [{ id: "empty", type: "text", title: "今日无大事" }];

    allMovies.sort((a, b) => {
        if (sortOrder === "time_desc") return parseInt(b.yearStr) - parseInt(a.yearStr);
        if (sortOrder === "vote_desc") return parseFloat(b.rating) - parseFloat(a.rating);
        return b.popularity - a.popularity;
    });

    return allMovies.slice(0, 20).map(item => {
        const genreText = getGenreText(item.genre_ids);
        return buildItem({
            id: item.id, tmdbId: item.id, type: "movie",
            title: item.title,
            date: item.date, // 传入完整日期
            poster: item.poster_path,
            backdrop: item.backdrop_path,
            rating: item.rating,
            genreText: genreText,
            subTitle: `🏆 ${item.diff}周年纪念`,
            desc: item.overview || "暂无简介"
        });
    });
}

// =========================================================================
// 4. 辅助函数 (API)
// =========================================================================

// A. 那年今日
async function fetchMovieForDate(year, month, day, region, diff) {
    const dateStr = `${year}-${month}-${day}`;
    const queryParams = {
        language: "zh-CN", include_adult: false, page: 1,
        "primary_release_date.gte": dateStr, "primary_release_date.lte": dateStr
    };
    if (region === "Global") queryParams["vote_count.gte"] = 50;
    else { queryParams["region"] = region; queryParams["vote_count.gte"] = 10; }

    try {
        const res = await Widget.tmdb.get("/discover/movie", { params: queryParams });
        const data = res || {};
        if (!data.results) return [];
        return data.results.map(m => ({
            id: m.id, title: m.title, poster_path: m.poster_path, backdrop_path: m.backdrop_path,
            date: m.release_date || m.first_air_date || dateStr, // 提取日期
            rating: m.vote_average ? m.vote_average.toFixed(1) : "0.0", overview: m.overview,
            yearStr: String(year), diff: diff, popularity: m.popularity, genre_ids: m.genre_ids || []
        }));
    } catch (e) { return []; }
}

// B. Trakt 历史
async function fetchLastWatched(username, type, clientId) {
    const traktType = type === "tv" ? "shows" : "movies";
    const url = `https://api.trakt.tv/users/${username}/history/${traktType}?limit=1`;
    try {
        const res = await Widget.http.request({ url, method: "GET",
            headers: { "Content-Type": "application/json", "trakt-api-version": "2", "trakt-api-key": clientId },
            timeout: 5000
        });
        const data = res.data || [];
        if (data.length > 0) {
            const work = data[0].show || data[0].movie;
            if (work?.ids?.tmdb) return { tmdbId: work.ids.tmdb, title: work.title };
        }
    } catch (e) {}
    return null;
}

async function fetchUniqueHistory(username, clientId) {
    const url = `https://api.trakt.tv/users/${username}/history/shows?limit=100`;
    try {
        const res = await Widget.http.request({ url, method: "GET",
            headers: { "Content-Type": "application/json", "trakt-api-version": "2", "trakt-api-key": clientId },
            timeout: 5000
        });
        const data = res.data || [];
        const uniqueMap = new Map();
        for (const item of data) {
            const show = item.show;
            if (show?.ids?.tmdb && !uniqueMap.has(show.ids.tmdb)) {
                uniqueMap.set(show.ids.tmdb, { tmdbId: show.ids.tmdb, title: show.title });
            }
        }
        return Array.from(uniqueMap.values());
    } catch (e) { return []; }
}

function getRandomSeeds(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// C. TMDB 推荐/随机 (Widget.tmdb.get)
async function fetchTmdbRecommendations(id, type) {
    try {
        const res = await Widget.tmdb.get(`/${type}/${id}/recommendations`, { params: { language: "zh-CN", page: 1 } });
        return (res.results || []);
    } catch (e) { return []; }
}

async function fetchRandomTmdb(type) {
    const page = Math.floor(Math.random() * 20) + 1;
    const latestYear = new Date().getFullYear() - 1;
    const year = Math.floor(Math.random() * (latestYear - 2015 + 1)) + 2015;
    const queryParams = { language: "zh-CN", sort_by: "popularity.desc", include_adult: false, "vote_count.gte": 100, page: page };
    if (type === "movie") queryParams["primary_release_year"] = year; else queryParams["first_air_date_year"] = year;

    try {
        const res = await Widget.tmdb.get(`/discover/${type}`, { params: queryParams });
        let items = (res.results || []);
        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
        }
        return items;
    } catch (e) { return []; }
}

async function fetchTmdbRecsForSeed(seedItem) {
    try {
        const res = await Widget.tmdb.get(`/tv/${seedItem.tmdbId}/recommendations`, { params: { language: "zh-CN", page: 1 } });
        const data = res || {};
        if (!data.results) return [];
        return data.results.slice(0, 5).map(item => {
            const genreText = getGenreText(item.genre_ids);
            const date = item.first_air_date || item.release_date || ""; // 提取完整日期
            const score = item.vote_average ? item.vote_average.toFixed(1) : "0.0";
            return buildItem({
                id: item.id, tmdbId: item.id, type: "tv",
                title: item.name || item.title,
                date: date, poster: item.poster_path, backdrop: item.backdrop_path, rating: score, genreText: genreText,
                subTitle: `✨ 源于: ${seedItem.title}`,
                desc: item.overview || "暂无简介"
            });
        });
    } catch (e) { return []; }
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
async function loadRecommendations(params) {
    return enrichTvEpisodeBadges(await loadRecommendationsTeaBase(params || {}));
}
async function loadRandomMix(params) {
    return enrichTvEpisodeBadges(await loadRandomMixTeaBase(params || {}));
}
async function loadHistoryToday(params) {
    return enrichTvEpisodeBadges(await loadHistoryTodayTeaBase(params || {}));
}

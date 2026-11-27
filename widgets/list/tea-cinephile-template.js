WidgetMetadata = {
    id: "tea.cinephile_hub_ultimate.template",
    title: "影迷宝藏 | 系列与流派·剧集角标版",
    author: "𝙈𝙖𝙠𝙠𝙖𝙋𝙖𝙠𝙠𝙖",
    description: "聚合【系列电影大满贯】与【趣味流派探索】，一键补番，探索未知。",
    version: "1.0.9", // Tea TV badges; // backdropFeature 首行显示剧情简介，保留日期/评分为次行
    requiredVersion: "0.0.1",
    site: "https://t.me/MakkaPakkaOvO",

    // 0. 全局免 Key
    globalParams: [],

    modules: [
        // ===========================================
        // 模块 1: 系列电影大满贯 (IP合集) —— 保持原样，不加右上角菜单
        // ===========================================
        {
            title: "系列电影大满贯",
            functionName: "loadFranchise",
            type: "video", 
            cacheDuration: 3600,
            params: [
                {
                    name: "presetId",
                    title: "选择系列",
                    type: "enumeration",
                    value: "custom",
                    enumOptions: [
                        { title: "🔍 自定义搜索 (手动输入)", value: "custom" },
                        { title: "🤠 夺宝奇兵", value: "84" },
                        { title: "⚡ 哈利波特 (Harry Potter)", value: "1241" },
                        { title: "🦸 漫威宇宙 (MCU)", value: "86311" },
                        { title: "🕵️ 007 詹姆斯邦德", value: "645" },
                        { title: "💍 指环王 (Lord of the Rings)", value: "119" },
                        { title: "🌌 星球大战 (Star Wars)", value: "10" },
                        { title: "🏎️ 速度与激情", value: "9485" },
                        { title: "💣 碟中谍 (Mission: Impossible)", value: "87359" },
                        { title: "🦇 蝙蝠侠 (Nolan)", value: "263" },
                        { title: "🤖 变形金刚", value: "8650" },
                        { title: "🕶️ 黑客帝国", value: "2344" },
                        { title: "🏴‍☠️ 加勒比海盗", value: "295" },
                        { title: "🧟 生化危机 (Resident Evil)", value: "8925" },
                        { title: "👽 异形 (Alien)", value: "8091" },
                        { title: "🔫 教父 (The Godfather)", value: "230" },
                        { title: "🤠 玩具总动员", value: "10194" },
                        { title: "🏹 饥饿游戏", value: "131635" },
                        { title: "🧛 暮光之城", value: "33514" }
                    ]
                },
                {
                    name: "customQuery",
                    title: "搜索系列名",
                    type: "input",
                    description: "例如：教父、功夫熊猫、John Wick",
                    belongTo: { paramName: "presetId", value: ["custom"] }
                },
                {
                    name: "sortOrder",
                    title: "观看顺序",
                    type: "enumeration",
                    value: "asc",
                    enumOptions: [
                        { title: "上映时间 (正序 1->N)", value: "asc" },
                        { title: "上映时间 (倒序 N->1)", value: "desc" },
                        { title: "评分 (高->低)", value: "rating" }
                    ]
                }
            ]
        },

        // ===========================================
        // 模块 2: 设定控 (特殊流派) —— 修改为右上角触发
        // ===========================================
        {
            title: "趣味流派探索",
            functionName: "loadNicheGenre",
            type: "video", 
            cacheDuration: 3600,
            params: [
                {
                    // 👈 核心修复 1：将 themeId 改为 sort_by 触发右上角菜单
                    name: "sort_by", 
                    title: "选择感兴趣的设定",
                    type: "enumeration",
                    value: "12190",
                    enumOptions: [
                        { title: "🤖 赛博朋克 (Cyberpunk)", value: "12190" },
                        { title: "⏳ 时空循环 (Time Loop)", value: "4366|193382" },
                        { title: "🧟 丧尸围城 (Zombie)", value: "12377" },
                        { title: "🚀 太空歌剧 (Space Opera)", value: "3737" },
                        { title: "🔪 大逃杀/吃鸡 (Battle Royale)", value: "10565|263628" },
                        { title: "🐙 克苏鲁/洛夫克拉夫特", value: "210368" },
                        { title: "⚙️ 蒸汽朋克 (Steampunk)", value: "11105" },
                        { title: "🏚️ 末日废土 (Post-apocalyptic)", value: "2853" },
                        { title: "🕵️ 密室/本格推理 (Whodunit)", value: "10714" },
                        { title: "👻 伪纪录片 (Found Footage)", value: "10620" },
                        { title: "🦈 巨物恐惧 (Monster)", value: "4064" },
                        { title: "🧠 烧脑/心理惊悚", value: "9919" },
                        { title: "🦄 黑暗奇幻 (Dark Fantasy)", value: "3205" }
                    ]
                },
                {
                    name: "mediaType",
                    title: "类型",
                    type: "enumeration",
                    value: "movie",
                    enumOptions: [ { title: "电影", value: "movie" }, { title: "剧集", value: "tv" } ]
                },
                {
                    name: "sort",
                    title: "排序",
                    type: "enumeration",
                    value: "popularity.desc",
                    enumOptions: [
                        { title: "最热门", value: "popularity.desc" },
                        { title: "评分最高", value: "vote_average.desc" },
                        { title: "最新上映", value: "primary_release_date.desc" }
                    ]
                },
                { name: "page", title: "页码", type: "page", startPage: 1 }
            ]
        }
    ]
};

// =========================================================================
// 0. 通用工具与字典
// =========================================================================

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

function buildItem({ id, tmdbId, type, title, date, poster, backdrop, rating, genreText, desc, backdropBase = "https://image.tmdb.org" }) {
    var metaDescription = date ? `${date} · ⭐ ${rating}` : `⭐ ${rating}`;
    return {
        id: String(id),
        tmdbId: parseInt(tmdbId),
        type: "tmdb",
        mediaType: type,
        title: title,
        
        genreTitle: genreText || (type === "tv" ? "剧集" : "电影"), 
        description: `${desc || "暂无简介"}\n${metaDescription}`,
        releaseDate: date,
        
        posterPath: poster ? `https://image.tmdb.org/t/p/w500${poster}` : "",
        backdropPath: backdrop ? `${backdropBase}/t/p/w780${backdrop}` : "",
        rating: parseFloat(rating) || 0
    };
}

// =========================================================================
// 1. 业务逻辑：系列电影大满贯
// =========================================================================

async function loadFranchiseTeaBase(params = {}) {
    const { presetId = "custom", customQuery, sortOrder = "asc" } = params;
    
    const isIndianaJones = presetId === "custom" && typeof customQuery === "string" && customQuery.trim() === "夺宝奇兵";
    let collectionId = isIndianaJones ? "84" : presetId;

    if (collectionId === "custom") {
        if (!customQuery) return [{ id: "err_no_q", type: "text", title: "请输入搜索词" }];
        
        const searchResult = await searchCollection(customQuery);
        if (!searchResult) return [{ id: "err_404", type: "text", title: "未找到合集", subTitle: `TMDB 中没有 "${customQuery}" 的官方系列合集` }];
        
        collectionId = searchResult.id;
    }

    try {
        const res = await Widget.tmdb.get(`/collection/${collectionId}`, { params: { language: "zh-CN" } });
        const data = res || {};

        if (!data.parts || data.parts.length === 0) return [{ id: "err_empty", type: "text", title: "合集数据为空" }];

        let movies = data.parts;
        movies.sort((a, b) => {
            if (sortOrder === "rating") return b.vote_average - a.vote_average;
            const dateA = a.release_date ? new Date(a.release_date) : new Date("2099-01-01");
            const dateB = b.release_date ? new Date(b.release_date) : new Date("2099-01-01");
            return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        });
        
        const backdropBase = String(collectionId) === "84"
            ? "https://shrill-poetry-07fc.2407813427.workers.dev"
            : "https://image.tmdb.org";
        return movies.map((item, index) => {
            const date = item.release_date || "";
            const rank = index + 1;
            const genreText = getGenreText(item.genre_ids);
            
            return buildItem({
                id: item.id, 
                tmdbId: item.id, 
                type: "movie",
                title: `${rank}. ${item.title}`,
                backdropBase,
                date: date,
                poster: item.poster_path,
                backdrop: item.backdrop_path,
                rating: item.vote_average?.toFixed(1) || "0.0",
                genreText: genreText,
                desc: item.overview || "暂无简介"
            });
        });

    } catch (e) {
        return [{ id: "err_net", type: "text", title: "请求失败", description: e.message }];
    }
}

// =========================================================================
// 2. 业务逻辑：设定控 (趣味流派)
// =========================================================================

async function loadNicheGenreTeaBase(params = {}) {
    // 👈 核心修复 2：接管 sort_by 变回 themeId 的用途
    const themeId = params.sort_by || "12190"; 
    const { mediaType = "movie", sort = "popularity.desc", page = 1 } = params;

    const queryParams = {
        language: "zh-CN",
        sort_by: sort,
        include_adult: false,
        include_video: false,
        page: page,
        with_keywords: themeId, // 使用接管到的 themeId
        "vote_count.gte": 50
    };

    if (sort === "vote_average.desc") queryParams["vote_count.gte"] = 300;
    if (mediaType === "tv" && sort.includes("primary_release_date")) queryParams.sort_by = "first_air_date.desc";

    try {
        const res = await Widget.tmdb.get(`/discover/${mediaType}`, { params: queryParams });
        const data = res || {};
        
        if (!data.results || data.results.length === 0) return [{ id: "empty", type: "text", title: "暂无数据" }];

        return data.results.map(item => {
            const date = item.first_air_date || item.release_date || "";
            const genreText = getGenreText(item.genre_ids);
            
            return buildItem({
                id: item.id, 
                tmdbId: item.id, 
                type: mediaType,
                title: item.name || item.title,
                date: date,
                poster: item.poster_path,
                backdrop: item.backdrop_path,
                rating: item.vote_average?.toFixed(1) || "0.0",
                genreText: genreText,
                desc: item.overview || "暂无简介"
            });
        });

    } catch (e) {
        return [{ id: "err_net", type: "text", title: "网络错误", description: e.message }];
    }
}

// =========================================================================
// 3. 辅助函数
// =========================================================================

async function searchCollection(query) {
    try {
        const res = await Widget.tmdb.get("/search/collection", {
            params: { query: query, language: "zh-CN", page: 1 }
        });
        const data = res || {};
        if (data.results && data.results.length > 0) return data.results[0];
    } catch (e) {}
    return null;
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
async function loadFranchise(params) {
    return enrichTvEpisodeBadges(await loadFranchiseTeaBase(params || {}));
}
async function loadNicheGenre(params) {
    return enrichTvEpisodeBadges(await loadNicheGenreTeaBase(params || {}));
}

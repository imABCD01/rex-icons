var WidgetMetadata = {
    id: "tea.history.anniversary.template",
    title: "那年今日｜周年红色 HTML 测试",
    author: "Tea",
    description: "配合 tea-history-anniversary 模板使用：年份 分类 • N周年🏆，周年红色加粗。",
    version: "1.0.0",
    requiredVersion: "0.0.1",
    modules: [
        {
            id: "historyAnniversary",
            title: "那年今日（周年红色模板专用）",
            functionName: "loadHistoryToday",
            type: "video",
            cacheDuration: 43200,
            params: [
                {
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
            date: m.release_date || m.first_air_date || dateStr,
            rating: m.vote_average ? m.vote_average.toFixed(1) : "0.0",
            overview: m.overview, yearStr: String(year), diff: diff,
            popularity: m.popularity, genre_ids: m.genre_ids || []
        }));
    } catch (e) { return []; }
}

function historyTemplateItem(item) {
    const link = `tmdb:movie:${item.id}`;
    const genreText = getGenreText(item.genre_ids);
    return {
        id: link,
        tmdbId: Number(item.id),
        type: "url",
        link: link,
        mediaType: "movie",
        title: item.title,
        genreTitle: genreText || "电影",
        description: `${item.overview || "暂无简介"}\n${item.date} · 🏆 ${item.diff}周年纪念`,
        releaseDate: item.date,
        posterPath: item.poster_path || "",
        backdropPath: item.backdrop_path || "",
        rating: parseFloat(item.rating) || 0,
        durationText: `${item.diff}周年`
    };
}

async function loadHistoryToday(params = {}) {
    const region = params.sort_by || "Global";
    const sortOrder = params.sortOrder || "time_desc";
    const today = new Date();
    const currentYear = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const yearsAgo = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
    const targetYears = yearsAgo.map(diff => ({ year: currentYear - diff, diff: diff }));
    let allMovies = [];
    const batchRequest = async years => {
        const results = await Promise.all(years.map(y => fetchMovieForDate(y.year, month, day, region, y.diff)));
        results.forEach(list => { if (list) allMovies = allMovies.concat(list); });
    };
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
    return allMovies.slice(0, 20).map(historyTemplateItem);
}

async function loadDetail(link) {
    const match = /^tmdb:(movie|tv):(\d+)$/.exec(String(link || ""));
    if (!match) return [];
    return { id: match[2], type: "tmdb", mediaType: match[1] };
}

WidgetMetadata = {
    id: "forward.letterboxd",
    title: "Letterboxd电影爱好者平台",
    version: "2.0.0",
    requiredVersion: "0.0.1",
    description: "解析Letterboxd片单/演员页影片【v2优化：本地缓存IMDb映射，翻页提速10倍+】",
    author: "huangxd｜MakkaPakka（v2优化：Tea）",
    site: "https://t.me/MakkaPakkaOvO",
    modules: [
        {
            id: "loadList",
            title: "获取列表",
            functionName: "loadList",
            description: "选择片单或输入自定义URL，返回影片列表（IMDb内置详情）",
            cacheDuration: 1800,
            params: [
                {
                    name: "input_type",
                    title: "输入类型",
                    type: "enumeration",
                    value: "select",
                    enumOptions: [
                        {title: "筛选榜单", value: "select"},
                        {title: "经典演员", value: "actor"}, // 🚀 新增演员选项
                        {title: "自定义URL", value: "customize"},
                    ],
                },
                // --- 新增：演员列表配置 ---
                {
                    name: "actor_select",
                    title: "选择演员",
                    type: "enumeration",
                    description: "Letterboxd 华语经典演员大赏",
                    belongTo: {
                        paramName: "input_type",
                        value: ["actor"],
                    },
                    enumOptions: [
                        {title: "成龙 (Jackie Chan)", value: "https://letterboxd.com/actor/jackie-chan/"},
                        {title: "周星驰 (Stephen Chow)", value: "https://letterboxd.com/actor/stephen-chow/"},
                        {title: "李连杰 (Jet Li)", value: "https://letterboxd.com/actor/jet-li/"},
                        {title: "周润发 (Chow Yun-fat)", value: "https://letterboxd.com/actor/chow-yun-fat/"},
                        {title: "刘德华 (Andy Lau)", value: "https://letterboxd.com/actor/andy-lau-tak-wah-1/"},
                        {title: "梁朝伟 (Tony Leung Chiu-wai)", value: "https://letterboxd.com/actor/tony-leung-chiu-wai/"},
                        {title: "张国荣 (Leslie Cheung)", value: "https://letterboxd.com/actor/leslie-cheung/"},
                        {title: "刘青云 (Sean Lau Ching-wan)", value: "https://letterboxd.com/actor/sean-lau-ching-wan/"},
                        {title: "郑伊健 (Ekin Cheng)", value: "https://letterboxd.com/actor/ekin-cheng-yee-kin/"},
                        {title: "张学友 (Jacky Cheung)", value: "https://letterboxd.com/actor/jacky-cheung-hok-yau/"},
                        {title: "郭富城 (Aaron Kwok)", value: "https://letterboxd.com/actor/aaron-kwok/"},
                        {title: "梁家辉 (Tony Leung Ka-fai)", value: "https://letterboxd.com/actor/tony-leung-ka-fai/"},
                        {title: "张家辉 (Nick Cheung)", value: "https://letterboxd.com/actor/nick-cheung/"}
                    ]
                },
                // --- 原有榜单配置 ---
                {
                    name: "list_select",
                    title: "片单完整URL",
                    type: "enumeration",
                    description: "如：https://letterboxd.com/crew/list/2024-highest-rated-films/",
                    belongTo: {
                        paramName: "input_type",
                        value: ["select"],
                    },
                    enumOptions: [
                        // --- 新增的最新/特色榜单 (置顶) ---
                        {
                            title: "2026年女性导演作品TOP52",
                            value: "https://letterboxd.com/jack/list/52-films-by-women-directors-in-2026/"
                        },
                        {
                            title: "2025女性导演作品TOP52",
                            value: "https://letterboxd.com/jack/list/52-plus-films-by-women-directors-in-2025/"
                        },
                        {
                            title: "你最期待2026年圣丹斯电影节的哪部电影？",
                            value: "https://letterboxd.com/nextbestpicture/list/which-film-from-the-2026-sundance-film-festival/"
                        },
                        {
                            title: "2026年最受期待电影",
                            value: "https://letterboxd.com/nextbestpicture/list/which-film-are-you-most-looking-forward-to-3/"
                        },
                        {
                            title: "2026年全年故事片",
                            value: "https://letterboxd.com/timtamtitus/list/2026/"
                        },
                        {
                            title: "2025年排名",
                            value: "https://letterboxd.com/picklecat44/list/2025-ranked/"
                        },
                        {
                            title: "letterboxd500大电影",
                            value: "https://letterboxd.com/films/by/rating/"
                        },
                        {
                            title: "女性导演电影Top250",
                            value: "https://letterboxd.com/official/list/top-250-films-by-women-directors/"
                        },
                        {
                            title: "女性导演的电影",
                            value: "https://letterboxd.com/caonfilm/list/sapphic-films-directed-by-women/"
                        },
                        {
                            title: "死前必看的1001部电影",
                            value: "https://letterboxd.com/peterstanley/list/1001-movies-you-must-see-before-you-die/"
                        },
                        {
                            title: "每个人一生中至少应该看一次的电影",
                            value: "https://letterboxd.com/fcbarcelona/list/movies-everyone-should-watch-at-least-once/"
                        },
                        {
                            title: "一些令人心碎的卑微的小心翼翼的电影",
                            value: "https://letterboxd.com/filmbitten/list/a-film-that-breaks-your-heart-open-but-carefully/"
                        },
                        {
                            title: "恐怖电影（我想我会死在这间屋子里）",
                            value: "https://letterboxd.com/bgjulia/list/i-think-im-gonna-die-in-this-house/"
                        },
                        {
                            title: "少女经典定义（美少女可能喜欢）",
                            value: "https://letterboxd.com/darkestparadise/list/definition-of-girly-classics/"
                        },
                        {
                            title: "电影结束后你就不是一个人了",
                            value: "https://letterboxd.com/andredenervaux/list/youre-not-the-same-person-once-the-film-has/"
                        },
                        {
                            title: "变态浪漫Top20",
                            value: "https://letterboxd.com/crew/list/20-great-examples-of-kinky-romance-in-cinema/"
                        },
                        {
                            title: "恐怖电影Top250",
                            value: "https://letterboxd.com/official/list/top-250-horror-films/"
                        },
                        {
                            title: "动画电影Top250",
                            value: "https://letterboxd.com/official/list/top-250-animated-films/"
                        },
                        // --- 以下为原有的有效榜单 ---
                        {
                            title: "百万观看俱乐部",
                            value: "https://letterboxd.com/alexanderh/list/letterboxd-one-million-watched-club/"
                        },
                        {
                            title: "250部最佳国际电影",
                            value: "https://letterboxd.com/brsan/list/letterboxds-top-250-international-films/"
                        },
                        {
                            title: "100部最佳默片",
                            value: "https://letterboxd.com/brsan/list/letterboxds-top-100-silent-films/"
                        },
                        {
                            title: "100部最佳纪录迷你剧",
                            value: "https://letterboxd.com/slinkyman/list/letterboxds-top-100-highest-rated-documentary/"
                        },
                        {
                            title: "奥斯卡最佳影片",
                            value: "https://letterboxd.com/oscars/list/oscar-winning-films-best-picture/"
                        },
                        {
                            title: "戛纳电影节金棕榈奖",
                            value: "https://letterboxd.com/festival_cannes/list/70-years-of-the-palme-dor-70-ans-de-la-palme/"
                        },
                        {
                            title: "英国电影学院奖最佳影片",
                            value: "https://letterboxd.com/bafta/list/all-bafta-best-film-award-winners/"
                        },
                        {
                            title: "金球奖最佳剧情片",
                            value: "https://letterboxd.com/edd_gosbender/list/golden-globe-award-for-best-motion-picture/"
                        },
                        {
                            title: "金球奖最佳音乐/喜剧片",
                            value: "https://letterboxd.com/edd_gosbender/list/golden-globe-award-for-best-motion-picture-1/"
                        },
                        {
                            title: "独立精神奖最佳影片",
                            value: "https://letterboxd.com/steffensneil11/list/independent-spirit-award-for-best-film/"
                        },
                        {
                            title: "柏林电影节金熊奖",
                            value: "https://letterboxd.com/socas/list/golden-bear-goldener-bar/"
                        },
                        {
                            title: "威尼斯电影节金狮奖",
                            value: "https://letterboxd.com/hieusmile/list/golden-lion-venice-films-festival/"
                        },
                        {
                            title: "多伦多电影节观众奖",
                            value: "https://letterboxd.com/lise/list/tiff-audience-award-winners/"
                        },
                        {
                            title: "Letterboxd四大最爱访谈",
                            value: "https://letterboxd.com/andregps/list/letterboxd-four-favorites-interviews/"
                        },
                        {
                            title: "Letterboxd彩蛋",
                            value: "https://letterboxd.com/frozenpandaman/list/letterboxd-easter-eggs/"
                        },
                        {
                            title: "成人电影大合集",
                            value: "https://letterboxd.com/jlalibs/list/official-letterboxd-adult-film-megalist/"
                        },
                        {
                            title: "标准收藏",
                            value: "https://letterboxd.com/jbutts15/list/the-complete-criterion-collection/"
                        },
                        {
                            title: "Shout! Factory",
                            value: "https://letterboxd.com/callifrax/list/a-semi-complete-catalogue-of-shout-scream/"
                        },
                        {
                            title: "Arrow Video",
                            value: "https://letterboxd.com/backfish/list/arrow-video/"
                        },
                        {
                            title: "A24电影列表",
                            value: "https://letterboxd.com/a24/list/every-a24-film/"
                        },
                        {
                            title: "NEON电影列表",
                            value: "https://letterboxd.com/zincalloy23/list/neon/"
                        },
                        {
                            title: "MUBI电影列表",
                            value: "https://letterboxd.com/mubi/list/mubi-releases/"
                        },
                        {
                            title: "罗杰·伊伯特的伟大电影",
                            value: "https://letterboxd.com/dvideostor/list/roger-eberts-great-movies/"
                        },
                        {
                            title: "美国国会图书馆国家电影登记处",
                            value: "https://letterboxd.com/elvisisking/list/the-complete-library-of-congress-national/"
                        },
                        {
                            title: "IMDb前250名",
                            value: "https://letterboxd.com/dave/list/imdb-top-250/"
                        },
                        {
                            title: "全球影史票房榜",
                            value: "https://letterboxd.com/matthew/list/all-time-worldwide-box-office/"
                        },
                        {
                            title: "美国影史调整后本土票房榜（美国总票房）",
                            value: "https://letterboxd.com/matthew/list/box-office-mojo-all-time-domestic-adjusted/"
                        },
                        {
                            title: "死前必看的1001部电影（2024版）",
                            value: "https://letterboxd.com/gubarenko/list/1001-movies-you-must-see-before-you-die-2024/"
                        },
                        {
                            title: "AFI前100名（2007版）",
                            value: "https://letterboxd.com/afi/list/afis-100-years100-movies-10th-anniversary/"
                        },
                        {
                            title: "AFI前100名（1998版）",
                            value: "https://letterboxd.com/krisde/list/afi-top-100/"
                        },
                        {
                            title: "视与听伟大电影（影评人榜）",
                            value: "https://letterboxd.com/bfi/list/sight-and-sounds-greatest-films-of-all-time/"
                        },
                        {
                            title: "视与听伟大电影（导演榜）",
                            value: "https://letterboxd.com/bfi/list/sight-and-sounds-directors-100-greatest-films/"
                        },
                        {
                            title: "他们在拍电影，不是吗？前1000名（历史所有时期）",
                            value: "https://letterboxd.com/thisisdrew/list/they-shoot-pictures-dont-they-1000-greatest-6/"
                        },
                        {
                            title: "他们在拍电影，不是吗？前1000名（21世纪）",
                            value: "https://letterboxd.com/georgealexandru/list/greatest-films-the-2025-tspdt-edition-they-2/"
                        },
                        {
                            title: "美国编剧工会101部最伟大剧本（21世纪）",
                            value: "https://letterboxd.com/oneohtrix/list/writers-guild-of-america-101-greatest-screenplays/"
                        },
                        {
                            title: "韦斯·安德森——最爱",
                            value: "https://letterboxd.com/mlkarasek/list/wes-andersons-favorite-films/"
                        },
                        {
                            title: "阿里·艾斯特——当代最爱",
                            value: "https://letterboxd.com/mgamber/list/ari-asters-favorite-films/"
                        },
                        {
                            title: "英格玛·伯格曼——最爱",
                            value: "https://letterboxd.com/brsan/list/ingmar-bergmans-favorite-films/"
                        },
                        {
                            title: "奉俊昊——最爱",
                            value: "https://letterboxd.com/gpu/list/bong-joon-hos-favorites/"
                        },
                        {
                            title: "索菲亚·科波拉——最爱",
                            value: "https://letterboxd.com/mlkarasek/list/sofia-coppolas-favorite-films/"
                        },
                        {
                            title: "吉尔莫·德尔·托罗——推荐",
                            value: "https://letterboxd.com/ben_macdonald/list/guillermo-del-toros-twitter-film-recommendations/"
                        },
                        {
                            title: "克莱尔·德尼——最爱",
                            value: "https://letterboxd.com/zachzeidenberg/list/claire-denis-favorite-films/"
                        },
                        {
                            title: "罗伯特·艾格斯——最爱的恐怖片",
                            value: "https://letterboxd.com/radbradh/list/robert-eggers-favorite-horror-films/"
                        },
                        {
                            title: "大卫·芬奇——最爱",
                            value: "https://letterboxd.com/abdurrhmknkl/list/david-finchers-favorite-films/"
                        },
                        {
                            title: "格蕾塔·葛韦格——提及",
                            value: "https://letterboxd.com/nataliaivonica/list/greta-gerwig-talked-about-these-films/"
                        },
                        {
                            title: "斯坦利·库布里克——最爱",
                            value: "https://letterboxd.com/jeffroskull/list/stanley-kubricks-100-favorite-filmsthat-we/"
                        },
                        {
                            title: "黑泽明——最爱",
                            value: "https://letterboxd.com/michaelj/list/akira-kurosawas-100-favorite-movies/"
                        },
                        {
                            title: "斯派克·李——重要电影",
                            value: "https://letterboxd.com/theodo/list/spike-lees-95-essential-films-all-aspiring/"
                        },
                        {
                            title: "杰里米·索尔尼尔——最爱",
                            value: "https://letterboxd.com/crew/list/jeremy-saulnier-favorite-films/"
                        },
                        {
                            title: "昆汀·塔伦蒂诺——最爱",
                            value: "https://letterboxd.com/zachaigley/list/quentin-tarantinos-199-favorite-films/"
                        },
                        {
                            title: "阿涅斯·瓦尔达——最爱",
                            value: "https://letterboxd.com/otisbdriftwood/list/agnes-vardas-favorite-films/"
                        },
                        {
                            title: "亚历克斯·温特——50部B面和稀有作品",
                            value: "https://letterboxd.com/crew/list/alex-winters-50-b-sides-and-rarities/"
                        },
                        {
                            title: "埃德加·赖特——1000部最爱",
                            value: "https://letterboxd.com/crew/list/edgar-wrights-1000-favorite-movies/"
                        }
                    ],
                },
                {
                    name: "url_customize",
                    title: "自定义片单",
                    type: "input",
                    belongTo: {
                        paramName: "input_type",
                        value: ["customize"],
                    },
                    description: "自定义片单或演员页，如：https://letterboxd.com/actor/jackie-chan/",
                },
                {
                    name: "sort_by",
                    title: "排序",
                    type: "enumeration",
                    value: "default",
                    enumOptions: [
                        {title: "默认排序", value: "default"},
                        {title: "反序", value: "reverse"},
                        {title: "名称", value: "name"},
                        {title: "流行度", value: "popular"},
                        {title: "随机", value: "shuffle"},
                        {title: "最后添加", value: "added"},
                        {title: "最早添加", value: "added-earliest"},
                        {title: "最新发行", value: "release"},
                        {title: "最早发行", value: "release-earliest"},
                        {title: "最高评分", value: "rating"},
                        {title: "最低评分", value: "rating-lowest"},
                        {title: "最短时长", value: "shortest"},
                        {title: "最长时长", value: "longest"},
                    ],
                },
                {
                    name: "genre",
                    title: "类型",
                    type: "enumeration",
                    value: "default",
                    enumOptions: [
                        {title: "所有类型", value: "default"},
                        {title: "动作", value: "action"},
                        {title: "冒险", value: "adventure"},
                        {title: "动画", value: "animation"},
                        {title: "喜剧", value: "comedy"},
                        {title: "犯罪", value: "crime"},
                        {title: "纪录片", value: "documentary"},
                        {title: "戏剧", value: "drama"},
                        {title: "家庭", value: "family"},
                        {title: "奇幻", value: "fantasy"},
                        {title: "历史", value: "history"},
                        {title: "恐怖", value: "horror"},
                        {title: "音乐", value: "music"},
                        {title: "神秘", value: "mystery"},
                        {title: "浪漫", value: "romance"},
                        {title: "科幻", value: "science-fiction"},
                        {title: "惊悚", value: "thriller"},
                        {title: "电视电影", value: "tv-movie"},
                        {title: "战争", value: "war"},
                        {title: "西部", value: "western"}
                    ],
                },
                {
                    name: "decade",
                    title: "年代",
                    type: "enumeration",
                    value: "default",
                    enumOptions: [
                        {title: "所有年代", value: "default"},
                        {title: "2020年代", value: "2020s"},
                        {title: "2010年代", value: "2010s"},
                        {title: "2000年代", value: "2000s"},
                        {title: "1990年代", value: "1990s"},
                        {title: "1980年代", value: "1980s"},
                        {title: "1970年代", value: "1970s"},
                        {title: "1960年代", value: "1960s"},
                        {title: "1950年代", value: "1950s"},
                        {title: "1940年代", value: "1940s"},
                        {title: "1930年代", value: "1930s"},
                        {title: "1920年代", value: "1920s"},
                        {title: "1910年代", value: "1910s"},
                        {title: "1900年代", value: "1900s"},
                        {title: "1890年代", value: "1890s"},
                        {title: "1880年代", value: "1880s"},
                        {title: "1870年代", value: "1870s"}
                    ],
                },
                {
                    name: "page",
                    title: "页码",
                    type: "page"
                },
            ],
        },
    ],
};

// ================= v2.0 优化说明 =================
// 1) IMDb 映射表(968KB/14338条)首次下载后存入 Widget.storage，7天TTL，翻页零下载
// 2) 移除 Cache-Control:no-cache 强制头，HTTP 缓存恢复生效
// 3) 列表页/详情页解析改用正则提取，跳过 DOM 构建；失败自动降级 Widget.html.load
// 4) 详情页并发限流 6，防 Cloudflare 掐断；未命中结果增量写回本地缓存，越用越快
// =================================================

var LB_ORIGIN = "https://letterboxd.com";
var GIST_URL = "https://gist.githubusercontent.com/huangxd-/60712812d3d8b3c4422d46c6bc07046c/raw/letterboxd_url2imdb.json";
var UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
var KEY_GIST = "lb_gist_map_v2";
var KEY_DELTA = "lb_delta_map_v2";
var KEY_GIST_TIME = "lb_gist_time_v2";
var GIST_TTL = 7 * 24 * 3600 * 1000;
var CONCURRENCY = 6;

function _sget(key, fallback) {
    try {
        var v = Widget.storage.get(key);
        return (v === undefined || v === null) ? fallback : v;
    } catch (e) { return fallback; }
}
function _sset(key, value) {
    try { Widget.storage.set(key, value); return true; } catch (e) { return false; }
}

var _gistPromise = null;
function loadGistMap() {
    if (_gistPromise) return _gistPromise;
    _gistPromise = (async function () {
        var cached = _sget(KEY_GIST, null);
        var ts = _sget(KEY_GIST_TIME, 0) || 0;
        if (cached && (Date.now() - ts) < GIST_TTL) {
            console.log("[LB] gist 本地缓存命中，本次 0 下载");
            return cached;
        }
        try {
            var resp = await Widget.http.get(GIST_URL);
            var data = resp && resp.data;
            if (data && typeof data === "object" && Object.keys(data).length > 1000) {
                var ok = _sset(KEY_GIST, data);
                if (ok) _sset(KEY_GIST_TIME, Date.now());
                console.log("[LB] gist 已下载(" + Object.keys(data).length + "条)，storage=" + (ok ? "已持久化" : "失败(仅本会话可用)"));
                return data;
            }
            throw new Error("gist 数据异常");
        } catch (e) {
            console.log("[LB] gist 下载失败，回退本地旧缓存: " + e);
            _gistPromise = null;
            if (cached) return cached;
            return {};
        }
    })();
    return _gistPromise;
}

function extractFilmPaths(html) {
    var re = /data-target-link="(\/film\/[^"]+)"/g;
    var seen = {}, out = [], m;
    while ((m = re.exec(html)) !== null) {
        if (!seen[m[1]]) { seen[m[1]] = 1; out.push(m[1]); }
    }
    if (out.length) return out;
    try {
        var $ = Widget.html.load(html);
        var links = [];
        $("div[data-target-link]").each(function (i, el) {
            var t = $(el).attr("data-target-link");
            if (t && t.indexOf("/film/") === 0 && !seen[t]) { seen[t] = 1; links.push(t); }
        });
        if (!links.length) throw new Error("未找到影片容器");
        return links;
    } catch (e) {
        throw new Error("列表页解析失败（可能被 Cloudflare 拦截或页面结构变化）: " + e);
    }
}

function extractImdbId(html) {
    var m = String(html || "").match(/imdb\.com\/title\/(tt\d+)/i);
    return m ? m[1] : null;
}

function mapLimit(items, limit, fn) {
    var ret = new Array(items.length), i = 0;
    function worker() {
        if (i >= items.length) return Promise.resolve();
        var idx = i++;
        return Promise.resolve().then(function () { return fn(items[idx], idx); })
            .then(function (v) { ret[idx] = v; })
            .then(worker);
    }
    var ws = [];
    for (var w = 0; w < Math.min(limit, items.length); w++) ws.push(worker());
    return Promise.all(ws).then(function () { return ret; });
}

async function resolveImdbItems(paths) {
    var gist = await loadGistMap();
    var delta = _sget(KEY_DELTA, {}) || {};
    var urls = paths.map(function (p) { return LB_ORIGIN + p; });
    var results = new Array(urls.length), misses = [];
    for (var k = 0; k < urls.length; k++) {
        var id = gist[urls[k]] || delta[urls[k]] || null;
        results[k] = id;
        if (!id) misses.push(k);
    }
    console.log("[LB] 本页 " + urls.length + " 部：缓存命中 " + (urls.length - misses.length) + "，需抓详情 " + misses.length);
    if (misses.length) {
        var dirty = false;
        await mapLimit(misses, CONCURRENCY, async function (idx) {
            try {
                var resp = await Widget.http.get(urls[idx], { headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml" } });
                var id2 = extractImdbId(resp && resp.data);
                if (id2) { results[idx] = id2; delta[urls[idx]] = id2; dirty = true; }
            } catch (e) { console.log("[LB] 详情抓取失败: " + urls[idx] + " → " + e); }
        });
        if (dirty) _sset(KEY_DELTA, delta);
    }
    var seen = {}, items = [];
    for (var j = 0; j < results.length; j++) {
        var id3 = results[j];
        if (id3 && !seen[id3]) { seen[id3] = 1; items.push({ id: id3, type: "imdb" }); }
    }
    return items;
}

async function loadList(params) {
    params = params || {};
    try {
        var page = params.page || 1;
        var inputType = params.input_type || "";
        var listSelect = params.list_select || "";
        var actorSelect = params.actor_select || "";
        var urlCustomize = params.url_customize || "";
        var sortBy = params.sort_by || "default";
        var genre = params.genre || "default";
        var decade = params.decade || "default";
        var count = 20;
        var minNum = ((page - 1) % 5) * count + 1;
        var maxNum = ((page - 1) % 5) * count + 20;
        var lbPage = Math.floor((page - 1) / 5) + 1;

        var listUrl;
        if (inputType === "select") listUrl = listSelect;
        else if (inputType === "actor") listUrl = actorSelect;
        else listUrl = urlCustomize;
        if (!listUrl) throw new Error("必须提供 Letterboxd 片单或演员完整 URL");

        var url = listUrl.endsWith("/") ? listUrl : listUrl + "/";
        if (decade !== "default") url += "decade/" + decade + "/";
        if (genre !== "default") url += "genre/" + genre + "/";
        if (sortBy !== "default") url += "by/" + sortBy + "/";
        if (lbPage > 1) url += "page/" + lbPage + "/";
        console.log("[LB] 请求列表页: " + url);

        var resp = await Widget.http.get(url, { headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml" } });
        var paths = extractFilmPaths(resp && resp.data ? resp.data : "");
        console.log("[LB] 列表页共解析到 " + paths.length + " 部影片，取第 " + minNum + "-" + maxNum + " 位");
        if (minNum > paths.length) return [];
        var slice = paths.slice(minNum - 1, Math.min(maxNum, paths.length));
        return await resolveImdbItems(slice);
    } catch (error) {
        console.error("[LB] 处理失败:", error);
        throw error;
    }
}

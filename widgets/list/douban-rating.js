/**
 * douban-rating.js — 豆瓣评分模块（rex / ForwardWidget）
 * 列表：豆瓣热门电影/剧集，每条带豆瓣评分（未开分则不显示）
 * 搜索：按片名查豆瓣条目（含年份/类型）
 * 详情：type:"douban" 走 rex 内置豆瓣详情页，无需自写 loadDetail
 * 数据源：豆瓣公开 JSON 接口（无需登录账号；用自造 bid cookie 通过基础校验）
 */

WidgetMetadata = {
  id: "tea.douban.rating",
  title: "豆瓣评分",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "浏览豆瓣热门电影/剧集评分，支持片名搜索",
  author: "Tea",
  site: "https://github.com/InchStudio/ForwardWidgets",
  detailCacheDuration: 60,
  modules: [
    {
      id: "loadList",
      title: "豆瓣榜单",
      functionName: "loadList",
      cacheDuration: 600,
      params: [
        {
          name: "kind",
          title: "类型",
          type: "enumeration",
          enumOptions: [
            { title: "电影", value: "movie" },
            { title: "剧集", value: "tv" },
          ],
          value: "movie",
        },
        {
          name: "tag",
          title: "榜单",
          type: "enumeration",
          enumOptions: [
            { title: "热门", value: "热门" },
            { title: "豆瓣高分", value: "豆瓣高分" },
            { title: "经典", value: "经典" },
            { title: "冷门佳片", value: "冷门佳片" },
            { title: "华语", value: "华语" },
            { title: "欧美", value: "欧美" },
            { title: "日本", value: "日本" },
            { title: "韩国", value: "韩国" },
          ],
          value: "热门",
        },
        { name: "page", title: "页码", type: "page" },
      ],
    },
  ],
  search: {
    title: "搜索豆瓣",
    functionName: "search",
    params: [
      { name: "keyword", title: "片名", type: "input" },
    ],
  },
};

const API = "https://movie.douban.com";
// 豆瓣对无 cookie 请求返回 Bad Request；bid 是豆瓣自己的浏览器标识 cookie，
// 自造一个合法格式（字母数字 11 位）即可通过，不需要登录账号。
const DOUBAN_BID = "dbrw2026102";
const HEADERS = {
  "Cookie": "bid=" + DOUBAN_BID,
  "Referer": API + "/",
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
};

// 未开分的条目 rate 是空串——绝不返回 NaN/0，宁可缺省让卡片不显示评分
function parseRate(rate) {
  const n = parseFloat(rate);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

// 列表/搜索共用的条目映射：type:"douban" → App 用 subject id 打开内置豆瓣详情页
function toVideoItem(s, kind) {
  return {
    id: String(s.id),
    type: "douban",
    mediaType: kind === "tv" || s.type === "tv" ? "tv" : "movie",
    title: s.title,
    posterPath: s.cover || s.img,
    rating: parseRate(s.rate),
    description: s.episodes_info || (s.year ? s.year + "年" : undefined),
    releaseDate: s.year || undefined,
  };
}

async function loadList(params = {}) {
  try {
    const kind = params.kind === "tv" ? "tv" : "movie";
    const tag = params.tag || "热门";
    const page = Number(params.page || 1);
    const res = await Widget.http.get(API + "/j/search_subjects", {
      headers: HEADERS,
      params: { type: kind, tag, page, page_limit: 20 },
    });
    const rows = (res.data && res.data.subjects) || [];
    return rows.map((s) => toVideoItem(s, kind));
  } catch (e) {
    console.error("[douban] loadList 失败:", e.message || e);
    throw e;
  }
}

// 豆瓣建议接口不支持分页，一次返回全部候选（不声明 page 参数）
async function search(params = {}) {
  try {
    const kw = String(params.keyword || "").trim();
    if (!kw) return [];
    const res = await Widget.http.get(API + "/j/subject_suggest", {
      headers: HEADERS,
      params: { q: kw },
    });
    const rows = Array.isArray(res.data) ? res.data : [];
    return rows.map((s) => toVideoItem(s, s.type));
  } catch (e) {
    console.error("[douban] search 失败:", e.message || e);
    throw e;
  }
}

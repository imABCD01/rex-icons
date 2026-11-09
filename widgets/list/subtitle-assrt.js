/**
 * subtitle-highmatch.js — Rex 高匹配度字幕模块 (ForwardWidget)
 * 核心：多源并行搜索 → 多维度打分 (片名/年份/季集/语言/分辨率) → 按总分排序 → 去重
 * 详情页点"字幕" → loadSubtitle(params) → 返回按匹配度从高到低的字幕列表
 * 回测：node test-subtitle-highmatch.js   (需在 /var/minis/shared/forwardwidgets/ 目录下运行)
 *
 * 内置源为适配器框架：SubHD / 字幕库 / 射手网 / OpenSubtitles。
 * 各源的真实选择器/接口因站点反爬与登录策略不同，先按框架预置，
 * 用户可按 SKILL.md 中的侦察经验填入该站当前的选择器/接口。
 * 匹配引擎本身可完全离线回测验证。
 */

WidgetMetadata = {
  id: "tea.subtitle.highmatch",
  title: "高匹配字幕",
  version: "1.1.0",
  requiredVersion: "0.0.1",
  description: "射手网(assrt.net)等多源字幕聚合，按片名/年份/季集/语言/分辨率多维度打分，匹配度最高的排在前面；zip 包自动展开为文件直链",
  author: "Tea",
  globalParams: [
    {
      name: "token",
      title: "API Token",
      type: "input",
      placeholders: [{ title: "assrt.net 注册后获取的 32 位 API Token", value: "" }],
    },
  ],
  modules: [
    { id: "loadSubtitle", title: "加载字幕", functionName: "loadSubtitle", type: "subtitle", params: [] },
  ],
};

// ──────────────────────────────────────────────
// 内置字幕源（weight：同分时权重微调；enabled：开关）
// ──────────────────────────────────────────────
const SOURCES = [
  { key: "opensubtitles", name: "OpenSubtitles", weight: 1.05, enabled: false },  // 用户确认不用（需 API Key 且免费下载配额仅 5 次/天）
  { key: "subhd", name: "SubHD", weight: 1.0, enabled: true },
  { key: "zimuku", name: "字幕库", weight: 1.0, enabled: true },
  { key: "zimuzu", name: "射手网", weight: 1.0, enabled: true },
];

const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";

const YEAR_RE = /\b\d{4}\b/g;              // 4 位年份，单词边界（匹配 .2017. / 2017 等常见写法）
const RES_RE = /\b(4K|2160p|1080p|720p|1080i|BluRay|WEB-DL|WEBRIP|HDTV|x264|x265|HEVC|AVC|Hi10P)\b/gi;
const LANGS = ["zh-cn", "zh-tw", "zh-hans", "zh-hant", "zh", "cn", "tw", "chs", "cht", "简体", "繁体", "简中", "繁中", "中字", "国配", "中配"];

/** 标准化片名：小写、去年份、去括号、去常见后缀、去特殊字符、压缩空格 */
function normalizeTitle(t) {
  if (!t) return "";
  let s = String(t).toLowerCase();
  s = s.replace(/《|》|\[|\]|\(|\)|【|】|“|”|‘|’/g, " ");          // 去各种括号/引号
  s = s.replace(YEAR_RE, " ");                                        // 去年份
  s = s.replace(/\b(the|a|an)\b/gi, " ");                             // 英语冠词
  s = s.replace(RES_RE, " ");                                         // 去分辨率/编码标记
  s = s.replace(/\b(web-dl|webrip|bluray|hdtv|x264|x265|hevc|avc|hi10p|hdrip|bdrip|dvdrip|remux|internal|proper|rerip|uncut|extended|directors?\.?\s*cut|final|complete|season|s\d+|e\d+|episode|ep\.)\b/gi, " ");
  s = s.replace(/[^a-z0-9\u4e00-\u9fa5\s]/g, " ");                    // 只保留中英数与空格
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/** bigram Dice 系数 + 简单包含判断，返回 0~1 */
function titleSim(a, b) {
  a = normalizeTitle(a);
  b = normalizeTitle(b);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.92;
  const bigrams = (s) => {
    const set = new Set();
    for (let i = 0; i + 1 < s.length; i++) set.add(s.slice(i, i + 2));
    return set;
  };
  const A = bigrams(a), B = bigrams(b);
  const inter = [...A].filter((x) => B.has(x)).length;
  const dice = A.size + B.size === 0 ? 0 : (2 * inter) / (A.size + B.size);
  return Math.round(dice * 100) / 100;
}

/** 从候选字幕文本里提取年份 */
function extractYear(text) {
  const m = String(text).match(YEAR_RE);
  return m ? Number(m[0]) : null;
}

/** 从候选字幕文本里提取季集：S01E02 / 第1季第2集 / Season 1 / 第01集 */
function extractSeasonEpisode(text) {
  const s = String(text);
  let season = null, episode = null;
  const m1 = s.match(/\bs(\d{1,2})\s*e(\d{1,3})\b/i);
  if (m1) { season = Number(m1[1]); episode = Number(m1[2]); return { season, episode }; }
  const m2 = s.match(/第\s*(\d{1,2})\s*季[^0-9]{0,10}?第\s*(\d{1,3})\s*集/);
  if (m2) { season = Number(m2[1]); episode = Number(m2[2]); return { season, episode }; }
  const m3 = s.match(/season\s*(\d{1,2})/i);
  if (m3) season = Number(m3[1]);
  const m4 = s.match(/第\s*(\d{1,3})\s*集/);
  if (m4) episode = Number(m4[1]);
  return { season, episode };
}

/** 判断语言是否中文字幕 */
function isChineseLang(lang) {
  if (!lang) return false;
  const l = String(lang).toLowerCase();
  return LANGS.some((k) => l.includes(k.toLowerCase()));
}

/** 给单个候选字幕打分，0~100 */
function scoreCandidate(query, cand) {
  const qTitle = normalizeTitle(query.title || "");
  const cTitle = normalizeTitle(cand.title || "");

  // 1) 片名相似度 0~45
  const sim = titleSim(qTitle, cTitle);
  const nameScore = sim * 45;

  // 2) 年份 0~20
  let yearScore = 0;
  const qYear = query.year || extractYear(query.title || "");
  const cYear = extractYear(cand.title || "");
  if (qYear && cYear) {
    if (cYear === qYear) yearScore = 20;
    else if (Math.abs(cYear - qYear) <= 1) yearScore = 12;
    else yearScore = 0;
  } else if (!qYear && !cYear) {
    yearScore = 10; // 双方都无年份，不扣分
  }

  // 3) 季集 0~20
  let seasonScore = 0;
  const isSeries = query.mediaType === "tv" || query.season || query.episode;
  const qSeason = query.season ? Number(query.season) : null;
  const qEpisode = query.episode ? Number(query.episode) : null;
  const cSE = extractSeasonEpisode(cand.title || "");
  if (!isSeries) {
    seasonScore = 20; // 电影不考虑季集
  } else if (qSeason && cSE.season) {
    if (cSE.season === qSeason) {
      seasonScore = 15;
      if (qEpisode && cSE.episode && cSE.episode === qEpisode) seasonScore = 20;
      else if (qEpisode && cSE.episode) seasonScore = 15; // 季对但集不对
    } else {
      seasonScore = 0;
    }
  } else if (qSeason && !cSE.season) {
    seasonScore = 8; // 只知道季，候选无季信息，给一半
  } else {
    seasonScore = 10;
  }

  // 4) 语言 0~10（简体 > 繁体 > 其他中文 > 英文兜底）
  let langScore = 0;
  const cLang = String(cand.lang || "").toLowerCase();
  if (/zh-cn|zh-hans|chs|简/.test(cLang)) langScore = 10;
  else if (/zh-tw|zh-hant|cht|繁/.test(cLang)) langScore = 8;
  else if (isChineseLang(cLang)) langScore = 9;
  else if (cLang === "en" || cLang === "english") langScore = 2; // 英字幕兜底低分

  // 5) 分辨率/发布组 0~5
  let resScore = 0;
  const haystack = (cand.title || "") + " " + (cand.filename || "") + " " + (cand.release || "");
  if (RES_RE.test(haystack)) resScore = 5;

  const total = nameScore + yearScore + seasonScore + langScore + resScore;
  return {
    total: Math.min(100, Math.round(total * 100) / 100),
    breakdown: { name: nameScore, year: yearScore, season: seasonScore, lang: langScore, res: resScore },
    sim,
  };
}

/** 把原始候选统一成内部对象 */
function toCandidate(raw, sourceKey) {
  return {
    source: sourceKey,
    title: raw.title || raw.name || raw.file || "未知字幕",
    lang: raw.lang || raw.language || "unknown",
    url: raw.url || raw.download || raw.link || "",
    filename: raw.filename || raw.file || "",
    release: raw.release || raw.group || "",
    year: raw.year || extractYear(raw.title || ""),
    season: raw.season || null,
    episode: raw.episode || null,
    count: raw.count || 0,
    matchRaw: raw,
  };
}

/** ──────────────────────────────────────────────
 * 源适配器：每个返回 { key, items: Candidate[] }
 * 下面先写“结构占位 + 示例返回”，供回测使用；
 * 真正上线时，按 recon.sh 侦察得到的选择器/接口替换 fetch 内部实现。
 * ────────────────────────────────────────────── */

async function fetchOpenSubtitles(query) {
  // OpenSubtitles 需要 API Key（VIP），此处预置接口骨架，key 由用户填入
  return { key: "opensubtitles", items: [] };
}

async function fetchSubHD(query) {
  // SubHD 需要登录且有反爬，预置骨架
  return { key: "subhd", items: [] };
}

async function fetchZimuku(query) {
  return { key: "zimuku", items: [] };
}

// ── 射手网(伪) assrt.net 适配器（API 实测可用，2026-10-27）──
// search: GET /v1/sub/search?token=&q=&cnt= → { status:0, sub:{ subs:[ {id, native_name, videoname, lang:{desc}, down_count, vote_score, subtype, fileid?} ] } }
// detail: GET /v1/sub/detail?token=&id=    → { status:0, sub:{ subs:[ { url, filename, filelist:[ {url, f, s} ] } ] } }
// 坑：subs 无结果时是 {} 不是 []；带 S01E01 后缀搜不到（季集靠本地打分）；包条目无 id 用 fileid。
const ASSRT_API = "https://api.assrt.net";
const ASSRT_HEADERS = { "User-Agent": "ForwardWidgets/1.0.2" };

function assrtToken(params) {
  if (params && params.token) return String(params.token).trim();
  try {
    if (typeof process !== "undefined" && process.env && process.env.ZIMUZU_TOKEN) {
      return String(process.env.ZIMUZU_TOKEN).trim();
    }
  } catch (e) { /* rex 环境无 process，忽略 */ }
  return "";
}

// 包条目归一化（包无 id/lang，用 fileid / m_langn 替代）
function normalizeAssrtItems(subs) {
  return (subs || []).map((it) => {
    if (!it.id && it.fileid) it.id = it.fileid;
    if (!it.lang && Array.isArray(it.m_langn)) {
      const a = it.m_langn;
      const desc = a.includes("langdou") ? (a.includes("langcht") ? "繁英双语" : "简英双语")
        : a.includes("langchs") ? "简体" : a.includes("langcht") ? "繁体"
        : a.includes("langeng") ? "英文" : "";
      if (desc) it.lang = { desc };
      else if (it.m_lang) it.lang = it.m_lang;
    }
    if (!it.filename && it.sub_name) it.filename = it.sub_name;
    return it;
  });
}

function assrtLangCode(item) {
  const d = item.lang && typeof item.lang === "object" ? (item.lang.desc || "") : String(item.lang || "");
  const t = (d + " " + (item.filename || "")).toLowerCase();
  if (/cht|繁/.test(t)) return "zh-tw";
  if (/chs|双语|dou|简|zh/.test(t)) return "zh-cn";
  if (/eng|英/.test(t)) return "en";
  return d || "unknown";
}

function langFromFile(name) {
  let n = String(name || "").toLowerCase();
  try { n += " " + decodeURIComponent(n); } catch (e) { /* 文件名可能是 URL 编码中文（assrt 常见） */ }
  if (/chs&eng|cht&eng|简体&英文|繁体&英文|双语|dou/.test(n)) return /cht|繁/.test(n) ? "zh-tw" : "zh-cn";
  if (/\.cht\.|cht\b|繁/.test(n)) return "zh-tw";
  if (/\.chs\.|chs\b|简|zh/.test(n)) return "zh-cn";
  if (/eng|英/.test(n)) return "en";
  return "unknown";
}

// 下载 URL 统一升级 https，路径中的 & 转义（assrt 文件名常含 &）
function normalizeAssrtUrl(u) {
  if (!u) return "";
  let x = String(u).replace(/^http:\/\//i, "https://");
  const qi = x.indexOf("?");
  return qi >= 0 ? x.slice(0, qi).replace(/&/g, "%26") + x.slice(qi) : x.replace(/&/g, "%26");
}

async function fetchAssrtDetail(token, id) {
  if (!id) return null;
  try {
    const res = await Widget.http.get(
      `${ASSRT_API}/v1/sub/detail?token=${encodeURIComponent(token)}&id=${encodeURIComponent(id)}`,
      { headers: ASSRT_HEADERS }
    );
    const data = res.data || {};
    if (data.status !== 0) return null;
    const subs = data.sub && data.sub.subs;
    return Array.isArray(subs) && subs.length ? subs[0] : null;
  } catch (e) {
    console.error("[assrt] detail 失败:", e.message || e);
    return null;
  }
}

async function fetchZimuzu(query, params) {
  const token = assrtToken(params);
  const baseTitle = String(query.title || "").trim();
  if (!token || !baseTitle) return { key: "zimuzu", items: [] };

  // 搜索词链（实测 assrt 对格式敏感）：tv → [名 S0x（最有效）, 名 第X季（中文数字）, 名]；电影 → [名]
  // 不做命中即停：合并全部词的结果按 id 去重，交给本地打分（「第1季」等词可能返回别的季）
  const CN_NUM = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];
  const stripped = baseTitle
    .replace(/\bS\d{1,2}E\d{1,3}\b.*$/i, "")
    .replace(/第\s*\d+\s*[季集].*$/, "")
    .trim();
  const keys = [];
  const qSeason = Number(query.season) || 0;
  if (qSeason > 0 && (query.mediaType === "tv" || query.episode)) {
    keys.push(`${stripped} S${String(qSeason).padStart(2, "0")}`);
    if (qSeason < CN_NUM.length) keys.push(`${stripped} 第${CN_NUM[qSeason]}季`);
  }
  keys.push(stripped || baseTitle, baseTitle);
  const uniqueKeys = keys.filter((k, i, arr) => k.length >= 2 && arr.indexOf(k) === i).slice(0, 3);

  const merged = new Map();
  for (const kw of uniqueKeys) {
    try {
      const res = await Widget.http.get(
        `${ASSRT_API}/v1/sub/search?token=${encodeURIComponent(token)}&q=${encodeURIComponent(kw)}&cnt=20`,
        { headers: ASSRT_HEADERS }
      );
      const data = res.data || {};
      const s = data.sub && data.sub.subs;
      if (data.status === 0 && Array.isArray(s)) {
        for (const it of s) {
          const key = String(it.id || it.fileid || "");
          if (key && !merged.has(key)) merged.set(key, it);
        }
      }
    } catch (e) {
      console.error("[assrt] search 失败:", e.message || e);
    }
  }
  let subs = [...merged.values()];
  if (!subs.length) return { key: "zimuzu", items: [] };
  subs = normalizeAssrtItems(subs);

  // 粗排：本地打分 + 热度微调，取 top3 深查（控制 detail 请求量）
  // 季集是硬性要求：季明确错配的包强降权，匹配的加 bonus；热度上限压低避免掩盖季分差
  const qSeasonNum = Number(query.season) || null;
  const ranked = subs.map((s) => {
    const cand = {
      title: [s.native_name, s.videoname, s.filename].filter(Boolean).join(" "),
      lang: assrtLangCode(s),
      count: Number(s.down_count) || 0,
      url: "",
      filename: s.filename || "",
    };
    const sc = scoreCandidate(query, cand);
    const hot = Math.min((Number(s.vote_score) || 0) * 0.5 + cand.count / 200, 3);
    let total = sc.total + hot;
    const cSE = extractSeasonEpisode(cand.title);
    if (qSeasonNum && cSE.season) {
      if (cSE.season !== qSeasonNum) total -= 100; // 别的季：基本排除
      else total += 5;                              // 目标季：bonus
    }
    return { s, cand, sc, total };
  })
    .filter((x) => x.sc.sim >= 0.2)
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  // 深查 top3：zip 包自动展开为文件直链（每个文件一条，lang 按文件名判定）
  // 季集过滤：query 指定了季/集时，能提取出季集且不匹配的文件剔除；
  // 若全部被剔除（该包没有目标集），回退保留全量，至少让用户可见同剧集资源
  const filterBySeasonEpisode = (list) => {
    const qs = Number(query.season) || null;
    const qe = Number(query.episode) || null;
    if (!qs && !qe) return list;
    const keep = [], dropAll = [];
    for (const it of list) {
      const se = extractSeasonEpisode(`${it.title} ${it.filename || ""}`);
      if (se.season || se.episode) {
        const seasonOk = !qs || !se.season || se.season === qs;
        const episodeOk = !qe || !se.episode || se.episode === qe;
        (seasonOk && episodeOk ? keep : dropAll).push(it);
      } else {
        keep.push(it); // 无季集信息的不误杀
      }
    }
    return keep.length ? keep : list;
  };

  const items = [];
  const pushFiles = (files, fallbackTitle) => {
    for (const f of files || []) {
      if (!f || !f.url) continue;
      const name = f.f || f.filename || "";
      items.push({
        title: `${fallbackTitle} · ${name}`,
        lang: langFromFile(name),
        url: normalizeAssrtUrl(f.url),
        filename: name,
        count: Number(f.s) || 0,
      });
    }
  };
  for (const { s, cand } of ranked) {
    const detail = await fetchAssrtDetail(token, s.id);
    if (detail && Array.isArray(detail.filelist) && detail.filelist.length) {
      pushFiles(detail.filelist, s.native_name || s.videoname || cand.title);
    } else if (detail && detail.url) {
      items.push({
        title: `${s.native_name || s.videoname || cand.title} · ${detail.filename || ""}`.trim(),
        lang: cand.lang,
        url: normalizeAssrtUrl(detail.url),
        filename: detail.filename || "",
        count: cand.count,
      });
    } else if (Array.isArray(s.filelist) && s.filelist.length) {
      pushFiles(s.filelist, s.native_name || s.videoname || cand.title);
    }
  }
  return { key: "zimuzu", items: filterBySeasonEpisode(items).slice(0, 20) };
}

const FETCHERS = {
  opensubtitles: fetchOpenSubtitles,
  subhd: fetchSubHD,
  zimuku: fetchZimuku,
  zimuzu: fetchZimuzu,
};
// 回测钩子：生产环境不会设置 global.__TEST_FETCHERS__，不影响正常使用
if (typeof global !== "undefined" && global.__TEST_FETCHERS__) {
  Object.assign(FETCHERS, global.__TEST_FETCHERS__);
}

/** ──────────────────────────────────────────────
 * 主入口：loadSubtitle
 * params 自动携带 tmdbId / imdbId / id / type / season / episode / link
 * ────────────────────────────────────────────── */
async function loadSubtitle(params = {}) {
  const query = {
    title: params.title || params.seriesName || params.originalTitle || params.originalName || "",
    year: params.year || null,
    season: params.season || null,
    episode: params.episode || null,
    mediaType: params.type || params.mediaType || "movie",
    tmdbId: params.tmdbId || null,
    imdbId: params.imdbId || null,
  };

  // 并行向所有启用的源发请求（失败的源不阻塞其他源）
  const results = await Promise.allSettled(
    SOURCES.filter((s) => s.enabled)
      .map((s) => FETCHERS[s.key](query, params).catch((e) => {
        console.error(`[subtitle-highmatch] ${s.name} 失败:`, e.message || e);
        return { key: s.key, items: [] };
      }))
  );

  // 收集所有候选并打分
  const scored = [];
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    const src = SOURCES.find((s) => s.key === r.value.key);
    const weight = src ? src.weight : 1;
    for (const raw of r.value.items || []) {
      const cand = toCandidate(raw, r.value.key);
      const sc = scoreCandidate(query, cand);
      // 片名相似度太低的直接剔除（阈值 0.25，避免完全不相关的字幕）
      if (sc.sim < 0.25 && (!query.year || cand.year !== query.year)) continue;
      scored.push({ ...cand, score: sc.total, weight, breakdown: sc.breakdown, sim: sc.sim });
    }
  }

  // 排序：总分×权重 降序，同分时片名相似度高的在前，再同分时下载量高的在前
  scored.sort((a, b) => {
    const sa = a.score * a.weight;
    const sb = b.score * b.weight;
    if (Math.abs(sa - sb) < 0.01) {
      if (Math.abs(a.sim - b.sim) < 0.01) return (b.count || 0) - (a.count || 0);
      return b.sim - a.sim;
    }
    return sb - sa;
  });

  // 去重：同一来源同 URL 只留最高分；不同来源同标题+语言+季集，保留高分
  const seen = new Map();
  const deduped = [];
  for (const c of scored) {
    const key1 = `${c.source}:${c.url}`;
    if (seen.has(key1)) continue;
    seen.set(key1, true);
    const key2 = `${normalizeTitle(c.title)}|${c.lang}|${c.season}|${c.episode}`;
    const prev = seen.get("dup:" + key2);
    if (prev && prev.score >= c.score) continue;
    if (prev) seen.delete("dup:" + key2); // 替换为更高分的
    seen.set("dup:" + key2, c);
    deduped.push(c);
  }

  // 返回 Rex 字幕列表项
  return deduped.map((c, i) => ({
    id: `sub-${i}-${c.source}`,
    title: c.title,
    lang: c.lang,
    count: c.count,
    url: c.url,
    description: `匹配度 ${c.score}分 · ${c.source} · ${c.breakdown.name.toFixed(0)}名/${c.breakdown.year}年/${c.breakdown.season}季集/${c.breakdown.lang}语/${c.breakdown.res}规格`,
  }));
}

/** ──────────────────────────────────────────────
 * resolveSubtitleArchive：从解压后的文件列表里选最佳字幕文件
 * params.subtitleFiles 是 JSON 字符串，每个元素 { path, name, extension, size }
 * 返回：相对路径字符串（客户端会在解压目录下按此路径加载）
 * ────────────────────────────────────────────── */
async function resolveSubtitleArchive(params) {
  let files = [];
  try { files = JSON.parse(params.subtitleFiles || params.files || "[]"); } catch (e) { return null; }
  if (!Array.isArray(files) || files.length === 0) return null;

  const scoreFile = (f) => {
    const n = (f.name || "").toLowerCase();
    let s = 0;
    if (/简体|zh-cn|zh-hans|chs/.test(n)) s += 40;
    else if (/繁体|zh-tw|zh-hant|cht/.test(n)) s += 30;
    else if (/\bzh\b|中字|中文/.test(n)) s += 20;
    if (/\.ass$/i.test(n)) s += 15;   // ass 支持样式，优于 srt
    else if (/\.srt$/i.test(n)) s += 10;
    if (/1080p|4k|bluray|web-dl/.test(n)) s += 5;
    return s;
  };

  files.sort((a, b) => scoreFile(b) - scoreFile(a));
  const best = files[0];
  return best ? best.path : null;
}

// ──────────────────────────────────────────────
// 回测/调试暴露（生产环境不冲突；rex 只读取 WidgetMetadata + 各 handler）
// ──────────────────────────────────────────────
if (typeof global !== "undefined") {
  global.normalizeTitle = normalizeTitle;
  global.titleSim = titleSim;
  global.scoreCandidate = scoreCandidate;
  global.extractYear = extractYear;
  global.extractSeasonEpisode = extractSeasonEpisode;
  global.toCandidate = toCandidate;
  global.langFromFile = langFromFile;
  global.assrtLangCode = assrtLangCode;
}

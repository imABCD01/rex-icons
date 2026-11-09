/**
 * forward.ysp-live -- CCTV Live TV (S1: Apple TV local 127.0.0.1)
 * Two categories: CCTV (央视) and Satellite (卫视), each with subcategories
 */

WidgetMetadata = {
  id: "forward.ysp-live",
  title: "央视频直播",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "央视频全频道直播：央视/卫视双分类，各含子分类，支持 4K/1080p、7 天时移。需 Apple TV 运行 APTV 服务。",
  author: "Tea",
  site: "https://t.me/garysclub",
  detailCacheDuration: 300,
  modules: [
    {
      id: "loadResource",
      title: "Load Resource",
      functionName: "loadResource",
      type: "stream",
      params: [],
    },
    {
      id: "loadList",
      title: "Channel List",
      functionName: "loadList",
      params: [
        { name: "main_group", title: "主分类", type: "enumeration", value: "all",
          enumOptions: [
            {title: "全部", value: "all"},
            {title: "央视", value: "cctv"},
            {title: "卫视", value: "satellite"},
          ],
        },
        { name: "sub_group", title: "子分类", type: "enumeration", value: "all",
          belongTo: { paramName: "main_group", value: ["cctv"] },
          enumOptions: [
            {title: "全部央视", value: "all"},
            {title: "综合/新闻/综艺", value: "general"},
            {title: "财经/科教/纪录", value: "knowledge"},
            {title: "体育/奥林匹克", value: "sports"},
            {title: "电影/电视剧/戏曲", value: "drama"},
            {title: "少儿/音乐/农业", value: "life"},
            {title: "4K/8K 超高清", value: "uhd"},
          ],
        },
        { name: "sub_group_sat", title: "子分类", type: "enumeration", value: "all",
          belongTo: { paramName: "main_group", value: ["satellite"] },
          enumOptions: [
            {title: "全部卫视", value: "all"},
            {title: "一线强省卫视", value: "tier1"},
            {title: "二线省卫视", value: "tier2"},
            {title: "港澳台/海外卫视", value: "oversea"},
            {title: "央视海外/备用", value: "cctv_backup"},
          ],
        },
      ],
    },
    {
      id: "loadDetail",
      title: "Channel Detail",
      functionName: "loadDetail",
      params: [],
    },
  ],
  globalParams: [
    {
      name: "server",
      title: "Live Server Address",
      type: "input",
      placeholders: [
        { title: "Apple TV Local", value: "127.0.0.1:8767" },
      ],
    },
  ],
};

const LOGO_BASE = "https://garysclub.sharewithyou.dpdns.org/logos/ysp-live-logos";

const CHANNELS = [
  // 央视 - 综合/新闻/综艺
  { id: "cctv1", name: "CCTV-1 综合", main: "cctv", sub: "general", logo: "cctv1.png", shift: true },
  { id: "cctv3", name: "CCTV-3 综艺", main: "cctv", sub: "general", logo: "cctv3.png", shift: true },
  { id: "cctv13", name: "CCTV-13 新闻", main: "cctv", sub: "general", logo: "cctv13.png", shift: true },
  { id: "cctv17", name: "CCTV-17 农业农村", main: "cctv", sub: "general", logo: "cctv17.png", shift: true },
  { id: "cctv20", name: "CCTV-20 女性", main: "cctv", sub: "general", logo: "cctv20.png", shift: true },
  // 央视 - 财经/科教/纪录
  { id: "cctv2", name: "CCTV-2 财经", main: "cctv", sub: "knowledge", logo: "cctv2.png", shift: true },
  { id: "cctv9", name: "CCTV-9 纪录", main: "cctv", sub: "knowledge", logo: "cctv9.png", shift: true },
  { id: "cctv10", name: "CCTV-10 科教", main: "cctv", sub: "knowledge", logo: "cctv10.png", shift: true },
  { id: "cctv22", name: "CCTV-22 纪录", main: "cctv", sub: "knowledge", logo: "cctv22.png", shift: true },
  { id: "cctv23", name: "CCTV-23 科教", main: "cctv", sub: "knowledge", logo: "cctv23.png", shift: true },
  // 央视 - 体育/奥林匹克
  { id: "cctv5", name: "CCTV-5 体育", main: "cctv", sub: "sports", logo: "cctv5.png", shift: true },
  { id: "cctv5p", name: "CCTV-5+ 体育赛事", main: "cctv", sub: "sports", logo: "cctv5p.png", shift: true },
  { id: "cctv16", name: "CCTV-16 奥林匹克", main: "cctv", sub: "sports", logo: "cctv16.png", shift: true },
  { id: "cctv21", name: "CCTV-21 体育赛事", main: "cctv", sub: "sports", logo: "cctv21.png", shift: true },
  // 央视 - 电影/电视剧/戏曲
  { id: "cctv6", name: "CCTV-6 电影", main: "cctv", sub: "drama", logo: "cctv6.png", shift: true },
  { id: "cctv8", name: "CCTV-8 电视剧", main: "cctv", sub: "drama", logo: "cctv8.png", shift: true },
  { id: "cctv11", name: "CCTV-11 戏曲", main: "cctv", sub: "drama", logo: "cctv11.png", shift: true },
  { id: "cctv24", name: "CCTV-24 戏曲", main: "cctv", sub: "drama", logo: "cctv24.png", shift: true },
  // 央视 - 少儿/音乐/农业
  { id: "cctv14", name: "CCTV-14 少儿", main: "cctv", sub: "life", logo: "cctv14.png", shift: true },
  { id: "cctv15", name: "CCTV-15 音乐", main: "cctv", sub: "life", logo: "cctv15.png", shift: true },
  { id: "cctv19", name: "CCTV-19 农业农村", main: "cctv", sub: "life", logo: "cctv19.png", shift: true },
  { id: "cctv26", name: "CCTV-26 少儿", main: "cctv", sub: "life", logo: "cctv26.png", shift: true },
  { id: "cctv27", name: "CCTV-27 音乐", main: "cctv", sub: "life", logo: "cctv27.png", shift: true },
  // 央视 - 4K/8K 超高清
  { id: "cctv17b", name: "CCTV-4K 超高清", main: "cctv", sub: "uhd", logo: "cctv4k.png", shift: true },
  { id: "cctv17c", name: "CCTV-8K 超高清", main: "cctv", sub: "uhd", logo: "cctv8k.png", shift: true },
  { id: "cctv28", name: "CCTV-28 奥林匹克", main: "cctv", sub: "uhd", logo: "cctv28.png", shift: true },
  // 央视 - 国防/社会法
  { id: "cctv7", name: "CCTV-7 国防军事", main: "cctv", sub: "knowledge", logo: "cctv7.png", shift: true },
  { id: "cctv12", name: "CCTV-12 社会与法", main: "cctv", sub: "knowledge", logo: "cctv12.png", shift: true },
  { id: "cctv18", name: "CCTV-18 国防军事", main: "cctv", sub: "knowledge", logo: "cctv18.png", shift: true },
  { id: "cctv25", name: "CCTV-25 社会与法", main: "cctv", sub: "knowledge", logo: "cctv25.png", shift: true },
  { id: "cctv29", name: "CCTV-29 国防军事", main: "cctv", sub: "knowledge", logo: "cctv29.png", shift: true },
  { id: "cctv30", name: "CCTV-30 农业农村", main: "cctv", sub: "life", logo: "cctv30.png", shift: true },
  // 卫视 - 一线强省
  { id: "bstv", name: "北京卫视", main: "satellite", sub: "tier1", logo: "bstv.png", shift: true },
  { id: "hunan", name: "湖南卫视", main: "satellite", sub: "tier1", logo: "hunan.png", shift: true },
  { id: "zjstv", name: "浙江卫视", main: "satellite", sub: "tier1", logo: "zjstv.png", shift: true },
  { id: "jstv", name: "江苏卫视", main: "satellite", sub: "tier1", logo: "jstv.png", shift: true },
  { id: "dgstv", name: "东方卫视", main: "satellite", sub: "tier1", logo: "dgstv.png", shift: true },
  { id: "hbtv", name: "湖北卫视", main: "satellite", sub: "tier1", logo: "hbtv.png", shift: true },
  { id: "sctv", name: "四川卫视", main: "satellite", sub: "tier1", logo: "sctv.png", shift: true },
  { id: "sdtv", name: "山东卫视", main: "satellite", sub: "tier1", logo: "sdtv.png", shift: true },
  // 卫视 - 二线省
  { id: "hntv", name: "河南卫视", main: "satellite", sub: "tier2", logo: "hntv.png", shift: true },
  { id: "gatv", name: "广东卫视", main: "satellite", sub: "tier2", logo: "gatv.png", shift: true },
  { id: "ahtv", name: "安徽卫视", main: "satellite", sub: "tier2", logo: "ahtv.png", shift: true },
  { id: "hljtv", name: "黑龙江卫视", main: "satellite", sub: "tier2", logo: "hljtv.png", shift: true },
  { id: "jltv", name: "吉林卫视", main: "satellite", sub: "tier2", logo: "jltv.png", shift: true },
  { id: "lnvtv", name: "辽宁卫视", main: "satellite", sub: "tier2", logo: "lnvtv.png", shift: true },
  { id: "hbtv2", name: "河北卫视", main: "satellite", sub: "tier2", logo: "hbtv2.png", shift: true },
  { id: "scctv", name: "重庆卫视", main: "satellite", sub: "tier2", logo: "scctv.png", shift: true },
  { id: "tjstv", name: "天津卫视", main: "satellite", sub: "tier2", logo: "tjstv.png", shift: true },
  { id: "nmgtv", name: "内蒙古卫视", main: "satellite", sub: "tier2", logo: "nmgtv.png", shift: true },
  { id: "xmtv", name: "厦门卫视", main: "satellite", sub: "tier2", logo: "xmtv.png", shift: true },
  { id: "sxtv", name: "陕西卫视", main: "satellite", sub: "tier2", logo: "sxtv.png", shift: true },
  { id: "gxtv", name: "广西卫视", main: "satellite", sub: "tier2", logo: "gxtv.png", shift: true },
  { id: "gztv", name: "贵州卫视", main: "satellite", sub: "tier2", logo: "gztv.png", shift: true },
  { id: "ynvtv", name: "云南卫视", main: "satellite", sub: "tier2", logo: "ynvtv.png", shift: true },
  { id: "xjtv", name: "新疆卫视", main: "satellite", sub: "tier2", logo: "xjtv.png", shift: true },
  { id: "qhtv", name: "青海卫视", main: "satellite", sub: "tier2", logo: "qhtv.png", shift: true },
  { id: "nxtv", name: "宁夏卫视", main: "satellite", sub: "tier2", logo: "nxtv.png", shift: true },
  // 卫视 - 港澳台/海外
  { id: "hkstv", name: "香港卫视", main: "satellite", sub: "oversea", logo: "hkstv.png", shift: true },
  { id: "mactv", name: "澳门卫视", main: "satellite", sub: "oversea", logo: "mactv.png", shift: true },
  { id: "twwtv", name: "台湾卫视", main: "satellite", sub: "oversea", logo: "twwtv.png", shift: true },
  // 卫视 - 央视海外/备用
  { id: "cctv4eu", name: "CCTV-4 欧洲", main: "satellite", sub: "cctv_backup", logo: "cctv4eu.png", shift: true },
  { id: "cctv4as", name: "CCTV-4 美洲", main: "satellite", sub: "cctv_backup", logo: "cctv4as.png", shift: true },
  { id: "cctv4af", name: "CCTV-4 非洲", main: "satellite", sub: "cctv_backup", logo: "cctv4af.png", shift: true },
  { id: "cctv5p2", name: "CCTV-5+ 备用", main: "satellite", sub: "cctv_backup", logo: "cctv5p2.png", shift: true },
];

function getServer() {
  const raw = (Widget.globalParams && Widget.globalParams.server) || "127.0.0.1:8767";
  return raw.trim().replace(/^https?:\/\//, "");
}

function buildM3U8Url(chId) {
  const server = getServer();
  return "http://" + server + "/" + chId + ".m3u8";
}

function getSubGroupLabel(main, sub) {
  if (main === "cctv") {
    const map = {
      "general": "综合/新闻/综艺", "knowledge": "财经/科教/纪录",
      "sports": "体育/奥林匹克", "drama": "电影/电视剧/戏曲",
      "life": "少儿/音乐/农业", "uhd": "4K/8K 超高清"
    };
    return map[sub] || sub;
  } else if (main === "satellite") {
    const map = {
      "tier1": "一线强省卫视", "tier2": "二线省卫视",
      "oversea": "港澳台/海外卫视", "cctv_backup": "央视海外/备用"
    };
    return map[sub] || sub;
  }
  return sub;
}

async function loadList(params) {
  params = params || {};
  const mainGroup = params.main_group || "all";
  const subGroup = (mainGroup === "cctv") ? (params.sub_group || "all") : (params.sub_group_sat || "all");

  let filtered = CHANNELS;
  if (mainGroup !== "all") {
    filtered = filtered.filter(function(ch) { return ch.main === mainGroup; });
  }
  if (subGroup !== "all") {
    filtered = filtered.filter(function(ch) { return ch.sub === subGroup; });
  }

  let items = filtered.map(function(ch) {
    const label = getSubGroupLabel(ch.main, ch.sub);
    return {
      id: "ysplive:" + ch.id,
      type: "url",
      mediaType: "tv",
      title: ch.name,
      coverUrl: LOGO_BASE + "/" + ch.logo,
      posterPath: LOGO_BASE + "/" + ch.logo,
      backdropPath: LOGO_BASE + "/" + ch.logo,
      link: "ysplive:" + ch.id,
      genreItems: [{ id: label, title: label }],
      description: label + " - " + ch.name + (ch.shift ? " [7-day timeshift]" : ""),
      releaseDate: "",
      rating: 0,
    };
  });
  return items;
}

async function loadDetail(link) {
  if (!link || !link.startsWith("ysplive:")) return null;
  const chId = link.slice("ysplive:".length);
  const ch = CHANNELS.find(function(c) { return c.id === chId; });
  if (!ch) return null;

  const now = new Date();
  const timeStr = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
  const label = getSubGroupLabel(ch.main, ch.sub);

  return {
    id: "ysplive:" + chId,
    type: "url",
    mediaType: "tv",
    title: ch.name + " - Live Now",
    coverUrl: LOGO_BASE + "/" + ch.logo,
    posterPath: LOGO_BASE + "/" + ch.logo,
    backdropPath: LOGO_BASE + "/" + ch.logo,
    link: "ysplive:" + chId,
    genreItems: [{ id: label, title: label }],
    description: "Category: " + label + "\nChannel: " + ch.name + "\nTime: " + timeStr + " Live" + (ch.shift ? " [7-day timeshift]" : "") + "\nTap to play",
    releaseDate: "",
    rating: 0,
  };
}

async function loadResource(params) {
  params = params || {};
  const link = params.link || "";
  if (!link.startsWith("ysplive:")) return [];
  const chId = link.slice("ysplive:".length);

  const m3u8Url = buildM3U8Url(chId);
  const ch = CHANNELS.find(function(c) { return c.id === chId; });
  const name = ch ? ch.name : chId;

  return [{
    name: name,
    description: "HLS Live - " + (ch ? getSubGroupLabel(ch.main, ch.sub) : "") + " - Auto refresh signature",
    url: m3u8Url,
    customHeaders: {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      "Referer": "https://garysclub.sharewithyou.dpdns.org/",
    },
    playerType: "app",
  }];
}
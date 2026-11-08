/**
 * forward.ysp-live — 央视频全频道直播 v9.5 (S1 版：Apple TV 本地 127.0.0.1)
 * 依赖：Apple TV 运行 APTV 服务（ysp-live 监听 8767）
 * 频道：央视 33 路 + 卫视 33 路 = 66 路，真 4K/1080p，7 天时移
 * 参考：demo.js（官方权威示例）
 */

WidgetMetadata = {
  id: "forward.ysp-live",
  title: "央视频直播",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "央视频全频道直播（央视 33+ 卫视 33，4K/1080p，7 天时移）。需 Apple TV 侧 APTV 跑 ysp-live 服务。",
  author: "Tea",
  site: "https://t.me/garysclub",
  detailCacheDuration: 300,
  modules: [
    {
      // id 必须固定为 loadResource，type: "stream" 表示起播时动态解析
      id: "loadResource",
      title: "加载资源",
      functionName: "loadResource",
      type: "stream",
      cacheDuration: 0,
      params: [],
    },
    {
      id: "loadList",
      title: "频道列表",
      functionName: "loadList",
      params: [
        { name: "group", title: "分组", type: "input", value: "" },
      ],
    },
    {
      id: "loadDetail",
      title: "频道详情",
      functionName: "loadDetail",
      params: [],
    },
  ],
  globalParams: [
    {
      key: "server",
      title: "直播服务地址",
      type: "text",
      value: "127.0.0.1:8767",
      description: "默认 127.0.0.1:8767（Apple TV 本地 APTV）。如用局域网/Tailscale，填 IP:端口或域名:端口。",
    },
  ],
};

const LOGO_BASE = "https://garysclub.sharewithyou.dpdns.org/logos/ysp-live-logos";

// 频道定义：66 路（央视 33 + 卫视 33）
const CHANNELS = [
  // 央视 33 路
  { id: "cctv1", name: "CCTV-1 综合", group: "央视", logo: "cctv1.png", tvgId: "CCTV1", shift: true },
  { id: "cctv2", name: "CCTV-2 财经", group: "央视", logo: "cctv2.png", tvgId: "CCTV2", shift: true },
  { id: "cctv3", name: "CCTV-3 综艺", group: "央视", logo: "cctv3.png", tvgId: "CCTV3", shift: true },
  { id: "cctv4", name: "CCTV-4 中文国际", group: "央视", logo: "cctv4.png", tvgId: "CCTV4", shift: true },
  { id: "cctv5", name: "CCTV-5 体育", group: "央视", logo: "cctv5.png", tvgId: "CCTV5", shift: true },
  { id: "cctv5p", name: "CCTV-5+ 体育赛事", group: "央视", logo: "cctv5p.png", tvgId: "CCTV5+", shift: true },
  { id: "cctv6", name: "CCTV-6 电影", group: "央视", logo: "cctv6.png", tvgId: "CCTV6", shift: true },
  { id: "cctv7", name: "CCTV-7 国防军事", group: "央视", logo: "cctv7.png", tvgId: "CCTV7", shift: true },
  { id: "cctv8", name: "CCTV-8 电视剧", group: "央视", logo: "cctv8.png", tvgId: "CCTV8", shift: true },
  { id: "cctv9", name: "CCTV-9 纪录", group: "央视", logo: "cctv9.png", tvgId: "CCTV9", shift: true },
  { id: "cctv10", name: "CCTV-10 科教", group: "央视", logo: "cctv10.png", tvgId: "CCTV10", shift: true },
  { id: "cctv11", name: "CCTV-11 戏曲", group: "央视", logo: "cctv11.png", tvgId: "CCTV11", shift: true },
  { id: "cctv12", name: "CCTV-12 社会与法", group: "央视", logo: "cctv12.png", tvgId: "CCTV12", shift: true },
  { id: "cctv13", name: "CCTV-13 新闻", group: "央视", logo: "cctv13.png", tvgId: "CCTV13", shift: true },
  { id: "cctv14", name: "CCTV-14 少儿", group: "央视", logo: "cctv14.png", tvgId: "CCTV14", shift: true },
  { id: "cctv15", name: "CCTV-15 音乐", group: "央视", logo: "cctv15.png", tvgId: "CCTV15", shift: true },
  { id: "cctv16", name: "CCTV-16 奥林匹克", group: "央视", logo: "cctv16.png", tvgId: "CCTV16", shift: true },
  { id: "cctv17", name: "CCTV-17 农业农村", group: "央视", logo: "cctv17.png", tvgId: "CCTV17", shift: true },
  { id: "cctv17b", name: "CCTV-4K 超高清", group: "央视", logo: "cctv4k.png", tvgId: "CCTV4K", shift: true },
  { id: "cctv17c", name: "CCTV-8K 超高清", group: "央视", logo: "cctv8k.png", tvgId: "CCTV8K", shift: true },
  { id: "cctv18", name: "CCTV-18 国防军事", group: "央视", logo: "cctv18.png", tvgId: "CCTV18", shift: true },
  { id: "cctv19", name: "CCTV-19 农业农村", group: "央视", logo: "cctv19.png", tvgId: "CCTV19", shift: true },
  { id: "cctv20", name: "CCTV-20 女性", group: "央视", logo: "cctv20.png", tvgId: "CCTV20", shift: true },
  { id: "cctv21", name: "CCTV-21 体育赛事", group: "央视", logo: "cctv21.png", tvgId: "CCTV21", shift: true },
  { id: "cctv22", name: "CCTV-22 纪录", group: "央视", logo: "cctv22.png", tvgId: "CCTV22", shift: true },
  { id: "cctv23", name: "CCTV-23 科教", group: "央视", logo: "cctv23.png", tvgId: "CCTV23", shift: true },
  { id: "cctv24", name: "CCTV-24 戏曲", group: "央视", logo: "cctv24.png", tvgId: "CCTV24", shift: true },
  { id: "cctv25", name: "CCTV-25 社会与法", group: "央视", logo: "cctv25.png", tvgId: "CCTV25", shift: true },
  { id: "cctv26", name: "CCTV-26 少儿", group: "央视", logo: "cctv26.png", tvgId: "CCTV26", shift: true },
  { id: "cctv27", name: "CCTV-27 音乐", group: "央视", logo: "cctv27.png", tvgId: "CCTV27", shift: true },
  { id: "cctv28", name: "CCTV-28 奥林匹克", group: "央视", logo: "cctv28.png", tvgId: "CCTV28", shift: true },
  { id: "cctv29", name: "CCTV-29 国防军事", group: "央视", logo: "cctv29.png", tvgId: "CCTV29", shift: true },
  { id: "cctv30", name: "CCTV-30 农业农村", group: "央视", logo: "cctv30.png", tvgId: "CCTV30", shift: true },
  // 卫视 33 路（省级卫视）
  { id: "bstv", name: "北京卫视", group: "卫视", logo: "bstv.png", tvgId: "BSTV", shift: true },
  { id: "hunan", name: "湖南卫视", group: "卫视", logo: "hunan.png", tvgId: "HUNANTV", shift: true },
  { id: "zjstv", name: "浙江卫视", group: "卫视", logo: "zjstv.png", tvgId: "ZJSTV", shift: true },
  { id: "jstv", name: "江苏卫视", group: "卫视", logo: "jstv.png", tvgId: "JSTV", shift: true },
  { id: "dgstv", name: "东方卫视", group: "卫视", logo: "dgstv.png", tvgId: "DGSTV", shift: true },
  { id: "hbtv", name: "湖北卫视", group: "卫视", logo: "hbtv.png", tvgId: "HBTV", shift: true },
  { id: "sctv", name: "四川卫视", group: "卫视", logo: "sctv.png", tvgId: "SCTV", shift: true },
  { id: "sdtv", name: "山东卫视", group: "卫视", logo: "sdtv.png", tvgId: "SDTV", shift: true },
  { id: "hntv", name: "河南卫视", group: "卫视", logo: "hntv.png", tvgId: "HNTV", shift: true },
  { id: "gatv", name: "广东卫视", group: "卫视", logo: "gatv.png", tvgId: "GATV", shift: true },
  { id: "ahtv", name: "安徽卫视", group: "卫视", logo: "ahtv.png", tvgId: "AHTV", shift: true },
  { id: "hljtv", name: "黑龙江卫视", group: "卫视", logo: "hljtv.png", tvgId: "HLJTV", shift: true },
  { id: "jltv", name: "吉林卫视", group: "卫视", logo: "jltv.png", tvgId: "JLTV", shift: true },
  { id: "lnvtv", name: "辽宁卫视", group: "卫视", logo: "lnvtv.png", tvgId: "LNTV", shift: true },
  { id: "hbtv2", name: "河北卫视", group: "卫视", logo: "hbtv2.png", tvgId: "HBTV2", shift: true },
  { id: "scctv", name: "重庆卫视", group: "卫视", logo: "scctv.png", tvgId: "CQTV", shift: true },
  { id: "tjstv", name: "天津卫视", group: "卫视", logo: "tjstv.png", tvgId: "TJTV", shift: true },
  { id: "nmgtv", name: "内蒙古卫视", group: "卫视", logo: "nmgtv.png", tvgId: "NMTV", shift: true },
  { id: "xmtv", name: "厦门卫视", group: "卫视", logo: "xmtv.png", tvgId: "XMTV", shift: true },
  { id: "sxtv", name: "陕西卫视", group: "卫视", logo: "sxtv.png", tvgId: "SXTV", shift: true },
  { id: "gxtv", name: "广西卫视", group: "卫视", logo: "gxtv.png", tvgId: "GXTV", shift: true },
  { id: "gztv", name: "贵州卫视", group: "卫视", logo: "gztv.png", tvgId: "GZTV", shift: true },
  { id: "ynvtv", name: "云南卫视", group: "卫视", logo: "ynvtv.png", tvgId: "YNTV", shift: true },
  { id: "xjtv", name: "新疆卫视", group: "卫视", logo: "xjtv.png", tvgId: "XJTV", shift: true },
  { id: "qhtv", name: "青海卫视", group: "卫视", logo: "qhtv.png", tvgId: "QHTV", shift: true },
  { id: "nxtv", name: "宁夏卫视", group: "卫视", logo: "nxtv.png", tvgId: "NXTV", shift: true },
  { id: "cctv4eu", name: "CCTV-4 欧洲", group: "卫视", logo: "cctv4eu.png", tvgId: "CCTV4E", shift: true },
  { id: "cctv4as", name: "CCTV-4 美洲", group: "卫视", logo: "cctv4as.png", tvgId: "CCTV4A", shift: true },
  { id: "cctv4af", name: "CCTV-4 非洲", group: "卫视", logo: "cctv4af.png", tvgId: "CCTV4F", shift: true },
  { id: "hkstv", name: "香港卫视", group: "卫视", logo: "hkstv.png", tvgId: "HKSTV", shift: true },
  { id: "mactv", name: "澳门卫视", group: "卫视", logo: "mactv.png", tvgId: "MACTV", shift: true },
  { id: "twwtv", name: "台湾卫视", group: "卫视", logo: "twwtv.png", tvgId: "TWTV", shift: true },
  { id: "cctv5p2", name: "CCTV-5+ 备用", group: "卫视", logo: "cctv5p2.png", tvgId: "CCTV5P2", shift: true },
];

// 解析 globalParams.server
function getServer() {
  const raw = (Widget.globalParams && Widget.globalParams.server) || "127.0.0.1:8767";
  return raw.trim().replace(/^https?:\/\//, "");
}

// 生成 m3u8 播放地址
function buildM3U8Url(chId) {
  const server = getServer();
  return `http://${server}/${chId}.m3u8`;
}

// ── loadList：返回 66 个频道 VideoItem ──
async function loadList(params = {}) {
  const filterGroup = (params.group || "").trim();
  let items = CHANNELS.map((ch) => ({
    id: `ysplive:${ch.id}`,
    type: "url",
    mediaType: "tv",
    title: ch.name,
    coverUrl: `${LOGO_BASE}/${ch.logo}`,
    posterPath: `${LOGO_BASE}/${ch.logo}`,
    backdropPath: `${LOGO_BASE}/${ch.logo}`,
    link: `ysplive:${ch.id}`,
    genreItems: [{ id: ch.group, title: ch.group }],
    description: `${ch.group} · ${ch.name}${ch.shift ? " · 支持 7 天时移" : ""}`,
    releaseDate: "",
    rating: 0,
    _group: ch.group,
  }));
  if (filterGroup) {
    items = items.filter((i) => i._group === filterGroup);
  }
  return items;
}

// ── loadDetail：link 是字符串，返回单个 VideoItem ──
async function loadDetail(link) {
  if (!link || !link.startsWith("ysplive:")) return null;
  const chId = link.slice("ysplive:".length);
  const ch = CHANNELS.find((c) => c.id === chId);
  if (!ch) return null;

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return {
    id: `ysplive:${chId}`,
    type: "url",
    mediaType: "tv",
    title: `${ch.name} · 正在直播`,
    coverUrl: `${LOGO_BASE}/${ch.logo}`,
    posterPath: `${LOGO_BASE}/${ch.logo}`,
    backdropPath: `${LOGO_BASE}/${ch.logo}`,
    link: `ysplive:${chId}`,
    genreItems: [{ id: ch.group, title: ch.group }],
    description: `📺 ${ch.group} · ${ch.name}\n⏰ ${timeStr} 直播中${ch.shift ? " · 支持 7 天时移回看" : ""}\n🔗 点击播放`,
    releaseDate: "",
    rating: 0,
  };
}

// ── loadResource：type="stream"，起播时动态返回 HLS 直播流 ──
// 参考 demo.js：HLS/m3u8 直播流不需要 X-Forward-Skip-Redirect-Probe（仅 HTTP-FLV 一次性 URL 需要）
async function loadResource(params) {
  const link = params && params.link ? params.link : "";
  if (!link.startsWith("ysplive:")) return [];
  const chId = link.slice("ysplive:".length);

  const m3u8Url = buildM3U8Url(chId);
  const ch = CHANNELS.find((c) => c.id === chId);
  const name = ch ? ch.name : chId;

  return [
    {
      name: name,
      description: `HLS 直播 · ${ch ? ch.group : ""} · 自动刷新签名`,
      url: m3u8Url,
      customHeaders: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        "Referer": "https://garysclub.sharewithyou.dpdns.org/",
        // HLS live 标准流不需要 X-Forward-Skip-Redirect-Probe（参考 demo.js 注释）
      },
      playerType: "app",
    },
  ];
}
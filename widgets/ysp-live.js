/**
 * forward.ysp-live -- CCTV Live TV (S1: Apple TV local 127.0.0.1)
 * Requires: Apple TV running APTV service (ysp-live on port 8767)
 * Channels: 66 channels (33 CCTV + 33 Satellite), 4K/1080p, 7-day timeshift
 * Reference: demo.js (official example)
 */

WidgetMetadata = {
  id: "forward.ysp-live",
  title: "CCTV Live TV",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "CCTV Live TV (33 CCTV + 33 Satellite, 4K/1080p, 7-day timeshift). Requires APTV on Apple TV.",
  author: "Tea",
  site: "https://t.me/garysclub",
  detailCacheDuration: 300,
  modules: [
    {
      id: "loadResource",
      title: "Load Resource",
      functionName: "loadResource",
      type: "stream",
      cacheDuration: 0,
      params: [],
    },
    {
      id: "loadList",
      title: "Channel List",
      functionName: "loadList",
      params: [
        { name: "group", title: "Group", type: "input", value: "" },
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
      key: "server",
      title: "Live Server Address",
      type: "text",
      value: "127.0.0.1:8767",
      description: "Default 127.0.0.1:8767 (Apple TV local APTV). For LAN/Tailscale, use IP:port or domain:port.",
    },
  ],
};

const LOGO_BASE = "https://garysclub.sharewithyou.dpdns.org/logos/ysp-live-logos";

const CHANNELS = [
  { id: "cctv1", name: "CCTV-1", group: "CCTV", logo: "cctv1.png", shift: true },
  { id: "cctv2", name: "CCTV-2", group: "CCTV", logo: "cctv2.png", shift: true },
  { id: "cctv3", name: "CCTV-3", group: "CCTV", logo: "cctv3.png", shift: true },
  { id: "cctv4", name: "CCTV-4", group: "CCTV", logo: "cctv4.png", shift: true },
  { id: "cctv5", name: "CCTV-5", group: "CCTV", logo: "cctv5.png", shift: true },
  { id: "cctv5p", name: "CCTV-5+", group: "CCTV", logo: "cctv5p.png", shift: true },
  { id: "cctv6", name: "CCTV-6", group: "CCTV", logo: "cctv6.png", shift: true },
  { id: "cctv7", name: "CCTV-7", group: "CCTV", logo: "cctv7.png", shift: true },
  { id: "cctv8", name: "CCTV-8", group: "CCTV", logo: "cctv8.png", shift: true },
  { id: "cctv9", name: "CCTV-9", group: "CCTV", logo: "cctv9.png", shift: true },
  { id: "cctv10", name: "CCTV-10", group: "CCTV", logo: "cctv10.png", shift: true },
  { id: "cctv11", name: "CCTV-11", group: "CCTV", logo: "cctv11.png", shift: true },
  { id: "cctv12", name: "CCTV-12", group: "CCTV", logo: "cctv12.png", shift: true },
  { id: "cctv13", name: "CCTV-13", group: "CCTV", logo: "cctv13.png", shift: true },
  { id: "cctv14", name: "CCTV-14", group: "CCTV", logo: "cctv14.png", shift: true },
  { id: "cctv15", name: "CCTV-15", group: "CCTV", logo: "cctv15.png", shift: true },
  { id: "cctv16", name: "CCTV-16", group: "CCTV", logo: "cctv16.png", shift: true },
  { id: "cctv17", name: "CCTV-17", group: "CCTV", logo: "cctv17.png", shift: true },
  { id: "cctv17b", name: "CCTV-4K", group: "CCTV", logo: "cctv4k.png", shift: true },
  { id: "cctv17c", name: "CCTV-8K", group: "CCTV", logo: "cctv8k.png", shift: true },
  { id: "cctv18", name: "CCTV-18", group: "CCTV", logo: "cctv18.png", shift: true },
  { id: "cctv19", name: "CCTV-19", group: "CCTV", logo: "cctv19.png", shift: true },
  { id: "cctv20", name: "CCTV-20", group: "CCTV", logo: "cctv20.png", shift: true },
  { id: "cctv21", name: "CCTV-21", group: "CCTV", logo: "cctv21.png", shift: true },
  { id: "cctv22", name: "CCTV-22", group: "CCTV", logo: "cctv22.png", shift: true },
  { id: "cctv23", name: "CCTV-23", group: "CCTV", logo: "cctv23.png", shift: true },
  { id: "cctv24", name: "CCTV-24", group: "CCTV", logo: "cctv24.png", shift: true },
  { id: "cctv25", name: "CCTV-25", group: "CCTV", logo: "cctv25.png", shift: true },
  { id: "cctv26", name: "CCTV-26", group: "CCTV", logo: "cctv26.png", shift: true },
  { id: "cctv27", name: "CCTV-27", group: "CCTV", logo: "cctv27.png", shift: true },
  { id: "cctv28", name: "CCTV-28", group: "CCTV", logo: "cctv28.png", shift: true },
  { id: "cctv29", name: "CCTV-29", group: "CCTV", logo: "cctv29.png", shift: true },
  { id: "cctv30", name: "CCTV-30", group: "CCTV", logo: "cctv30.png", shift: true },
  { id: "bstv", name: "Beijing TV", group: "Satellite", logo: "bstv.png", shift: true },
  { id: "hunan", name: "Hunan TV", group: "Satellite", logo: "hunan.png", shift: true },
  { id: "zjstv", name: "Zhejiang TV", group: "Satellite", logo: "zjstv.png", shift: true },
  { id: "jstv", name: "Jiangsu TV", group: "Satellite", logo: "jstv.png", shift: true },
  { id: "dgstv", name: "Dragon TV", group: "Satellite", logo: "dgstv.png", shift: true },
  { id: "hbtv", name: "Hubei TV", group: "Satellite", logo: "hbtv.png", shift: true },
  { id: "sctv", name: "Sichuan TV", group: "Satellite", logo: "sctv.png", shift: true },
  { id: "sdtv", name: "Shandong TV", group: "Satellite", logo: "sdtv.png", shift: true },
  { id: "hntv", name: "Henan TV", group: "Satellite", logo: "hntv.png", shift: true },
  { id: "gatv", name: "Guangdong TV", group: "Satellite", logo: "gatv.png", shift: true },
  { id: "ahtv", name: "Anhui TV", group: "Satellite", logo: "ahtv.png", shift: true },
  { id: "hljtv", name: "Heilongjiang TV", group: "Satellite", logo: "hljtv.png", shift: true },
  { id: "jltv", name: "Jilin TV", group: "Satellite", logo: "jltv.png", shift: true },
  { id: "lnvtv", name: "Liaoning TV", group: "Satellite", logo: "lnvtv.png", shift: true },
  { id: "hbtv2", name: "Hebei TV", group: "Satellite", logo: "hbtv2.png", shift: true },
  { id: "scctv", name: "Chongqing TV", group: "Satellite", logo: "scctv.png", shift: true },
  { id: "tjstv", name: "Tianjin TV", group: "Satellite", logo: "tjstv.png", shift: true },
  { id: "nmgtv", name: "Neimenggu TV", group: "Satellite", logo: "nmgtv.png", shift: true },
  { id: "xmtv", name: "Xiamen TV", group: "Satellite", logo: "xmtv.png", shift: true },
  { id: "sxtv", name: "Shaanxi TV", group: "Satellite", logo: "sxtv.png", shift: true },
  { id: "gxtv", name: "Guangxi TV", group: "Satellite", logo: "gxtv.png", shift: true },
  { id: "gztv", name: "Guizhou TV", group: "Satellite", logo: "gztv.png", shift: true },
  { id: "ynvtv", name: "Yunnan TV", group: "Satellite", logo: "ynvtv.png", shift: true },
  { id: "xjtv", name: "Xinjiang TV", group: "Satellite", logo: "xjtv.png", shift: true },
  { id: "qhtv", name: "Qinghai TV", group: "Satellite", logo: "qhtv.png", shift: true },
  { id: "nxtv", name: "Ningxia TV", group: "Satellite", logo: "nxtv.png", shift: true },
  { id: "cctv4eu", name: "CCTV-4 Europe", group: "Satellite", logo: "cctv4eu.png", shift: true },
  { id: "cctv4as", name: "CCTV-4 America", group: "Satellite", logo: "cctv4as.png", shift: true },
  { id: "cctv4af", name: "CCTV-4 Africa", group: "Satellite", logo: "cctv4af.png", shift: true },
  { id: "hkstv", name: "Hong Kong TV", group: "Satellite", logo: "hkstv.png", shift: true },
  { id: "mactv", name: "Macau TV", group: "Satellite", logo: "mactv.png", shift: true },
  { id: "twwtv", name: "Taiwan TV", group: "Satellite", logo: "twwtv.png", shift: true },
  { id: "cctv5p2", name: "CCTV-5+ Backup", group: "Satellite", logo: "cctv5p2.png", shift: true },
];

function getServer() {
  const raw = (Widget.globalParams && Widget.globalParams.server) || "127.0.0.1:8767";
  return raw.trim().replace(/^https?:\/\//, "");
}

function buildM3U8Url(chId) {
  const server = getServer();
  return "http://" + server + "/" + chId + ".m3u8";
}

async function loadList(params) {
  params = params || {};
  const filterGroup = (params.group || "").trim();
  let items = CHANNELS.map(function(ch) {
    return {
      id: "ysplive:" + ch.id,
      type: "url",
      mediaType: "tv",
      title: ch.name,
      coverUrl: LOGO_BASE + "/" + ch.logo,
      posterPath: LOGO_BASE + "/" + ch.logo,
      backdropPath: LOGO_BASE + "/" + ch.logo,
      link: "ysplive:" + ch.id,
      genreItems: [{ id: ch.group, title: ch.group }],
      description: ch.group + " - " + ch.name + (ch.shift ? " - 7-day timeshift" : ""),
      releaseDate: "",
      rating: 0,
      _group: ch.group,
    };
  });
  if (filterGroup) {
    items = items.filter(function(i) { return i._group === filterGroup; });
  }
  return items;
}

async function loadDetail(link) {
  if (!link || !link.startsWith("ysplive:")) return null;
  const chId = link.slice("ysplive:".length);
  const ch = CHANNELS.find(function(c) { return c.id === chId; });
  if (!ch) return null;

  const now = new Date();
  const timeStr = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");

  return {
    id: "ysplive:" + chId,
    type: "url",
    mediaType: "tv",
    title: ch.name + " - Live Now",
    coverUrl: LOGO_BASE + "/" + ch.logo,
    posterPath: LOGO_BASE + "/" + ch.logo,
    backdropPath: LOGO_BASE + "/" + ch.logo,
    link: "ysplive:" + chId,
    genreItems: [{ id: ch.group, title: ch.group }],
    description: "TV: " + ch.group + " - " + ch.name + "\nTime: " + timeStr + " Live" + (ch.shift ? " - 7-day timeshift" : "") + "\nTap to play",
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
    description: "HLS Live - " + (ch ? ch.group : "") + " - Auto refresh signature",
    url: m3u8Url,
    customHeaders: {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      "Referer": "https://garysclub.sharewithyou.dpdns.org/",
    },
    playerType: "app",
  }];
}

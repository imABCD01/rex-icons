/**
 * forward.ysp-live -- CCTV Live TV minimal test
 */

WidgetMetadata = {
  id: "forward.ysp-live",
  title: "央视频直播",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "Minimal test",
  author: "Tea",
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
      params: [],
    },
  ],
};

const LOGO_BASE = "https://garysclub.sharewithyou.dpdns.org/logos/ysp-live-logos";
const CHANNELS = [
  { id: "cctv1", name: "CCTV-1", logo: "cctv1.png" },
  { id: "cctv2", name: "CCTV-2", logo: "cctv2.png" },
];

function getServer() { return "127.0.0.1:8767"; }
function buildM3U8Url(chId) { return "http://" + getServer() + "/" + chId + ".m3u8"; }

async function loadList() {
  return CHANNELS.map(function(ch) {
    return {
      id: "ysplive:" + ch.id,
      type: "url",
      mediaType: "tv",
      title: ch.name,
      coverUrl: LOGO_BASE + "/" + ch.logo,
      posterPath: LOGO_BASE + "/" + ch.logo,
      backdropPath: LOGO_BASE + "/" + ch.logo,
      link: "ysplive:" + ch.id,
      releaseDate: "",
      rating: 0,
    };
  });
}

async function loadResource(params) {
  params = params || {};
  const link = params.link || "";
  if (!link.startsWith("ysplive:")) return [];
  const chId = link.slice("ysplive:".length);
  return [{ name: chId, url: buildM3U8Url(chId), playerType: "app" }];
}

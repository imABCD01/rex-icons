/**
 * forward.ysp-live-minimal -- CCTV Live TV minimal test
 */

WidgetMetadata = {
  id: "forward.ysp-live-testD",
  title: "Test D: Enumeration",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "Minimal test module for CCTV live channels",
  author: "Tea",
  site: "https://t.me/garysclub",
  detailCacheDuration: 300,
  modules: [
    {
      id: "loadList",
      title: "Channel List",
      functionName: "loadList",
      params: [
        { name: "group", title: "Group", type: "enumeration", value: "all",
          enumOptions: [
            {title: "All", value: "all"},
            {title: "CCTV", value: "CCTV"},
          ],
        },
      ],
    },
  ],
};

const LOGO_BASE = "https://garysclub.sharewithyou.dpdns.org/logos/ysp-live-logos";

const CHANNELS = [
  { id: "cctv1", name: "CCTV-1", group: "CCTV", logo: "cctv1.png" },
  { id: "cctv2", name: "CCTV-2", group: "CCTV", logo: "cctv2.png" },
  { id: "cctv3", name: "CCTV-3", group: "CCTV", logo: "cctv3.png" },
  { id: "cctv4", name: "CCTV-4", group: "CCTV", logo: "cctv4.png" },
  { id: "cctv5", name: "CCTV-5", group: "CCTV", logo: "cctv5.png" },
];

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
      description: ch.group + " - " + ch.name,
      releaseDate: "",
      rating: 0,
    };
  });
  if (filterGroup) {
    items = items.filter(function(i) { return i.genreItems[0].id === filterGroup; });
  }
  return items;
}

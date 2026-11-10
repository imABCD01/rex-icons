/**
 * ysp-live v9.5 央视频全频道直播模块 (ForwardWidget)
 * 64 路频道（央视30+卫视34），真4K，纯直播
 * 服务端口：8767，M3U：/all.m3u，健康检查：/health
 * 作者：garysclub / 加里俱乐部
 */

// ============ WidgetMetadata (顶层直接赋值，供 Rex 静态解析) ============
WidgetMetadata = {
  id: "ysp.live.v9.5",
  title: "央视频全频道直播 v9.5",
  version: "9.5.0",
  requiredVersion: "0.0.1",
  description: "央视频全频道直播：64路频道（央视30+卫视34），真4K超高清，纯直播模式",
  author: "GarysClub",
  site: "https://garysclub.sharewithyou.dpdns.org",
  detailCacheDuration: 120,

  globalParams: [
    {
      name: "host",
      title: "服务地址",
      type: "input",
      placeholders: [{ title: "默认 127.0.0.1:8767", value: "127.0.0.1:8767" }],
    },
    {
      name: "quality",
      title: "画质优先",
      type: "enumeration",
      value: "4k",
      enumOptions: [
        { title: "4K 超高清", value: "4k" },
        { title: "1080P 高清", value: "1080p" },
        { title: "720P 标清", value: "720p" }
      ]
    },
    {
      name: "disableCatchup",
      title: "禁用回看/时移（仅直播）",
      type: "enumeration",
      value: "true",
      enumOptions: [
        { title: "开启（仅直播）", value: "true" },
        { title: "关闭（启用7天回看）", value: "false" }
      ]
    }
  ],

  modules: [
    {
      id: "loadList",
      title: "频道列表",
      functionName: "loadList",
      cacheDuration: 3600,
      params: [
        { name: "page", title: "页码", type: "page" },
        { name: "count", title: "每页数量", type: "count", value: "64" }
      ]
    },
    {
      id: "loadResource",
      title: "播放资源",
      functionName: "loadResource",
      type: "stream",
      cacheDuration: 0,
      params: []
    }
  ],

  search: {
    title: "搜索频道",
    functionName: "search",
    params: [
      { name: "keyword", title: "关键词", type: "input" },
      { name: "page", title: "页码", type: "page" }
    ]
  }
};

// ============ 工具函数 ============
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
const SITE = "https://garysclub.sharewithyou.dpdns.org";

function getBaseUrl(params) {
  const host = (params && params.host) || "127.0.0.1:8767";
  return `http://${host}`;
}

function parseM3U(m3uText) {
  const channels = [];
  const lines = m3uText.split('\n');
  let current = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('#EXTINF:')) {
      const extinf = trimmed.substring(8);
      const commaIdx = extinf.lastIndexOf(',');
      const attrs = extinf.substring(0, commaIdx);
      const name = extinf.substring(commaIdx + 1);

      current = { name };
      // 支持带连字符的属性名 (tvg-id, tvg-name, group-title, catchup-days, catchup-source 等)
      const attrRegex = /([\w-]+)="([^"]*)"/g;
      let match;
      while ((match = attrRegex.exec(attrs)) !== null) {
        current[match[1]] = match[2];
      }
    } else if (!trimmed.startsWith('#') && current.name) {
      current.url = trimmed;
      channels.push(current);
      current = {};
    }
  }
  return channels;
}

// 频道缓存：用于 loadResource 通过 link 反查 videoUrl
let channelsCache = null;
let channelsCacheTime = 0;
const CACHE_TTL = 300000; // 5 分钟

async function fetchChannels(baseUrl) {
  const now = Date.now();
  if (channelsCache && (now - channelsCacheTime) < CACHE_TTL) {
    return channelsCache;
  }
  try {
    const resp = await Widget.http.get(`${baseUrl}/all.m3u`, { headers: { 'User-Agent': UA } });
    const m3uText = resp?.data;
    if (!m3uText || typeof m3uText !== 'string') return [];
    const channels = parseM3U(m3uText);
    channelsCache = channels;
    channelsCacheTime = Date.now();
    return channels;
  } catch (e) {
    // 静默失败，返回缓存或空数组，不中断加载
    console.log('[ysp-live] fetchChannels 暂时失败，使用缓存');
    return channelsCache || [];
  }
}

// ============ 核心函数 ============
async function loadList(params) {
  const baseUrl = getBaseUrl(params);
  const m3uUrl = `${baseUrl}/all.m3u`;

  try {
    console.log('[ysp-live] 请求 M3U:', m3uUrl);
    const resp = await Widget.http.get(m3uUrl, { headers: { 'User-Agent': UA } });
    
    const m3uText = resp?.data;
    console.log('[ysp-live] 响应数据长度:', m3uText?.length || 0);
    
    if (!m3uText || typeof m3uText !== 'string') {
      console.error('[ysp-live] M3U 数据为空或非字符串:', typeof m3uText);
      return [];
    }

    let channels = parseM3U(m3uText);
    console.log('[ysp-live] 解析频道数:', channels.length);

    // 搜索过滤
    const keyword = (params?.keyword || '').toLowerCase();
    if (keyword) {
      channels = channels.filter(c =>
        (c.name && c.name.toLowerCase().includes(keyword)) ||
        (c['tvg-id'] && c['tvg-id'].toLowerCase().includes(keyword)) ||
        (c['group-title'] && c['group-title'].toLowerCase().includes(keyword))
      );
    }

    // 分页
    const page = Number(params?.page || 1);
    const count = Number(params?.count || 64);
    const start = (page - 1) * count;
    channels = channels.slice(start, start + count);

    // 提取简短频道名（如 "CCTV-1 综合" → "CCTV-1"）
    function getShortName(fullName) {
      if (!fullName) return '';
      // 匹配 "CCTV-1 综合"、"CCTV-5+ 体育赛事" 等，取第一个空格前的部分
      const match = fullName.match(/^([^\s]+)/);
      return match ? match[1] : fullName;
    }

    const items = channels.map((ch, idx) => {
      const channelId = ch['tvg-id'] || `channel_${idx}`;
      const logo = ch['tvg-logo'] || '';
      const group = ch['group-title'] || '其他';
      const shortName = getShortName(ch.name);

      return {
        id: channelId,
        type: "url",
        title: shortName,  // 显示简短名如 "CCTV-1"
        description: group,
        posterPath: logo,
        coverUrl: logo,
        mediaType: "tv",
        videoUrl: ch.url,
        link: channelId,
        genreItems: group ? [{ id: group, title: group }] : []
      };
    });
    
    console.log('[ysp-live] 返回条目数:', items.length);
    return items;
  } catch (e) {
    console.error('[ysp-live] loadList error:', e?.message || e, 'stack:', e?.stack);
    return [];
  }
}

async function search(params) {
  return loadList({ ...params, keyword: params?.keyword });
}

async function loadDetail(link) {
  if (!link) return null;
  const channelId = link.replace('channel:', '');
  // 从缓存获取完整频道信息用于显示简短名
  const baseUrl = getBaseUrl({});
  const channels = await fetchChannels(baseUrl);
  const ch = channels.find(c => c['tvg-id'] === channelId);
  const shortName = ch ? getShortName(ch.name) : channelId;
  
  return {
    id: link,
    type: "url",
    title: shortName,  // 显示简短名如 "CCTV-1"
    description: "直播频道，点击播放",
    genreItems: [{ id: "live", title: "直播" }],
    link: link
  };
}

async function loadResource(params) {
  const p = params || {};
  const host = p.host || p.globalParams?.host || "127.0.0.1:8767";
  const baseUrl = `http://${host}`;

  // 兼容所有可能的参数名
  const videoUrl = p.videoUrl || p.url || p.video_url || p.streamUrl;
  const link = p.link || p.id || p.itemId || p.channelId || p.item_id || p.channel_id;

  console.log('[ysp-live] loadResource 收到参数:', JSON.stringify({
    videoUrl: !!videoUrl,
    link,
    host,
    allKeys: Object.keys(p)
  }));

  // 优先使用传入的 videoUrl（这是 M3U 解析出的直接 m3u8 地址）
  if (videoUrl) {
    console.log('[ysp-live] 直接使用 videoUrl:', videoUrl);
    return [{
      name: "直播源",
      url: videoUrl,
      description: "央视频直播流",
      playerType: "native",
      headers: {
        "User-Agent": UA,
        "Referer": `http://${host}/`,
        "Accept": "*/*",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
      }
    }];
  }

  // 如果没有 videoUrl，从 link/id/title 反查频道
  const linkId = (p.link || p.id || p.itemId || p.channelId || p.item_id || p.channel_id || '').replace('channel:', '');
  const title = p.title || p.name || '';
  
  if (linkId || title) {
    // 重新拉取 M3U 反查
    const channels = await fetchChannels(baseUrl);
    let ch = null;
    
    if (linkId && linkId !== 'rex-test-media') {
      ch = channels.find(c => c['tvg-id'] === linkId || c.id === linkId);
    }
    if (!ch && title) {
      // 标题模糊匹配
      ch = channels.find(c => c.name && c.name.includes(title));
    }
    
    if (ch && ch.url) {
      console.log('[ysp-live] 反查成功:', ch.url, '来源:', linkId || title);
      return [{
        name: "直播源",
        url: ch.url,
        description: "央视频直播流",
        playerType: "native",
        headers: {
          "User-Agent": UA,
          "Referer": `http://${host}/`,
          "Accept": "*/*",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
        }
      }];
    }
  }

  // 最终兜底：返回默认频道（CCTV1 或第一个频道）
  const channels = await fetchChannels(baseUrl);
  const firstCh = channels[0] || { 'tvg-id': 'CCTV1', name: 'CCTV-1 综合', url: `http://${host}/cctv1.m3u8` };
  const fallbackUrl = firstCh.url || `http://${host}/cctv1.m3u8`;
  console.log('[ysp-live] 使用最终兜底:', fallbackUrl);
  return [{
    name: "直播源",
    url: fallbackUrl,
    description: "央视频直播流（默认频道）",
    playerType: "native",
    headers: {
      "User-Agent": UA,
      "Referer": `http://${host}/`,
      "Accept": "*/*",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
    }
  }];
}

// 导出到全局（供 Rex 调用）
Object.assign(globalThis, { loadList, search, loadDetail, loadResource, WidgetMetadata });
/**
 * ysp-live v9.5 央视频全频道直播模块 (ForwardWidget)
 * 64 路频道（央视30+卫视34），真4K，7天时移回看
 * 服务端口：8767，M3U：/all.m3u，健康检查：/health
 * 作者：garysclub / 加里俱乐部
 */

// ============ WidgetMetadata (顶层直接赋值，供 Rex 静态解析) ============
WidgetMetadata = {
  id: "ysp.live.v9.5",
  title: "央视频全频道直播 v9.5",
  version: "9.5.0",
  requiredVersion: "0.0.1",
  description: "央视频全频道直播：64路频道（央视30+卫视34），真4K超高清，7天时移回看，SWR毫秒秒开",
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
    console.error('[ysp-live] fetchChannels error:', e);
    return [];
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

    const items = channels.map((ch, idx) => {
      const channelId = ch['tvg-id'] || `channel_${idx}`;
      const logo = ch['tvg-logo'] || '';
      const group = ch['group-title'] || '其他';

      return {
        id: channelId,
        type: "url",
        title: ch.name,
        description: `${group} | ${ch['tvg-id'] || ''}`,
        posterPath: logo,
        coverUrl: logo,
        mediaType: "tv",
        videoUrl: ch.url,  // M3U 里直接就是可播放的 m3u8 地址
        genreItems: group ? [{ id: group, title: group }] : [],
        link: `channel:${channelId}`
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
  if (!link || !link.startsWith('channel:')) return null;
  const channelId = link.replace('channel:', '');
  return {
    id: link,
    type: "url",
    title: `频道回看: ${link}`,
    mediaType: "tv",
    description: "支持 7 天时移回看，选择日期和时间观看",
    genreItems: [{ id: "timeshift", title: "7天时移回看" }],
    link: link
  };
}

async function loadResource(params) {
  const p = params || {};
  // 兼容多种参数名：Rex 可能把 videoUrl 放在不同字段
  const videoUrl = p.videoUrl || p.url || p.video_url || p.streamUrl || p.video_url;
  const link = p.link || p.id || p.itemId || p.channelId || p.item_id || p.channel_id;
  const timeShift = p.timeShift || p.time_shift;
  const host = p.host || p.globalParams?.host || "127.0.0.1:8767";
  const baseUrl = `http://${host}`;

  console.log('[ysp-live] loadResource 收到参数:', JSON.stringify(p));

  // 如果是时移请求（频道支持 catchup）
  if (timeShift && link) {
    const tsUrl = `${getBaseUrl({host})}/timeshift/${encodeURIComponent(link.replace('channel:', ''))}/${timeShift}.m3u8`;
    return [{
      name: "时移流",
      url: tsUrl,
      description: `时移: ${new Date(timeShift * 1000).toLocaleString()}`,
      playerType: "app"
    }];
  }

  // 优先使用传入的 videoUrl
  let streamUrl = p.videoUrl || p.url || p.video_url || p.streamUrl;
  
  if (!streamUrl && link) {
    // 兜底1：通过频道 ID 拼接（ysp-live 支持 /stream/频道ID.m3u8）
    const channelId = link.replace('channel:', '');
    streamUrl = `${getBaseUrl({host})}/stream/${encodeURIComponent(channelId)}.m3u8`;
  }
  
  // 兜底2：如果有 host 参数，尝试获取频道列表反查
  if (!streamUrl) {
    const channels = await fetchChannels(baseUrl);
    if (link) {
      const channelId = link.replace('channel:', '');
      const ch = channels.find(c => c['tvg-id'] === channelId || c.id === channelId);
      if (ch && ch.url) {
        streamUrl = ch.url;
      }
    }
  }
  
  if (!streamUrl) {
    streamUrl = `${getBaseUrl({host})}/stream/`;
  }

  console.log('[ysp-live] 最终播放地址:', streamUrl);

  if (!streamUrl) {
    console.error('[ysp-live] 无法获取播放地址');
    return [];
  }

  return [{
    name: "直播源",
    url: streamUrl,
    description: "央视频直播流",
    playerType: "app",
    headers: {
      "User-Agent": UA,
      "Referer": getBaseUrl({host})
    }
  }];
}

// 导出到全局（供 Rex 调用）
Object.assign(globalThis, { loadList, search, loadDetail, loadResource, WidgetMetadata });
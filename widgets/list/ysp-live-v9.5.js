/**
 * ysp-live v9.5 央视频全频道直播模块 (ForwardWidget)
 * 64 路频道（央视30+卫视34），真4K，7天时移回看
 * 服务端口：8767，M3U：/all.m3u，健康检查：/health
 * 作者：garysclub / 加里俱乐部
 */

(function () {
  'use strict';

  const SITE = 'https://garysclub.sharewithyou.dpdns.org';

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
        // #EXTINF:-1 tvg-id="cctv1" tvg-name="CCTV-1" tvg-logo="..." group-title="央视",CCTV-1 综合
        const extinf = trimmed.substring(8);
        const commaIdx = extinf.lastIndexOf(',');
        const attrs = extinf.substring(0, commaIdx);
        const name = extinf.substring(commaIdx + 1);

        current = { name };
        const attrRegex = /(\w+)="([^"]*)"/g;
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

  // ============ 核心函数 ============
  async function loadList(params) {
    const baseUrl = getBaseUrl(params);
    const m3uUrl = `${baseUrl}/all.m3u`;

    try {
      const resp = await Widget.http.get(m3uUrl, { headers: { 'User-Agent': UA } });
      if (!resp || resp.status !== 200) {
        console.error('获取 M3U 失败:', resp?.status);
        return [];
      }

      let channels = parseM3U(resp.data);

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

      // 转为 VideoItem
      return channels.map((ch, idx) => {
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
          videoUrl: ch.url,
          genreItems: group ? [{ id: group, title: group }] : [],
          link: `channel:${channelId}` // 用于 loadDetail 回看
        };
      });
    } catch (e) {
      console.error('loadList error:', e);
      return [];
    }
  }

  async function search(params) {
    // 复用 loadList，传入 keyword
    return loadList({ ...params, keyword: params?.keyword });
  }

  // 频道详情/回看
  async function loadDetail(link) {
    if (!link || !link.startsWith('channel:')) return null;
    const channelId = link.replace('channel:', '');
    const baseUrl = getBaseUrl({}); // 使用全局参数

    // 返回详情页数据，包含 7 天时移入口
    return {
      id: link,
      type: "url",
      title: `频道回看: ${link}`,
      mediaType: "tv",
      description: "支持 7 天时移回看，选择日期和时间观看",
      genreItems: [
        { id: "timeshift", title: "7天时移回看" }
      ],
      link: link
    };
  }

  // 播放资源加载（支持时移）
  async function loadResource(params) {
    const { link, videoUrl, timeShift, host, quality } = params;
    const baseHost = host || (params && params.host) || "127.0.0.1:8767";
    const baseUrl = `http://${baseHost}`;

    // 如果是时移请求
    if (timeShift) {
      // ysp-live 支持 timeshift 参数，格式：/timeshift/频道ID/时间戳.m3u8
      const tsUrl = `${baseUrl}/timeshift/${encodeURIComponent(link.replace('channel:', ''))}/${timeShift}.m3u8`;
      return [{
        name: "时移流",
        url: tsUrl,
        description: `时移: ${new Date(timeShift * 1000).toLocaleString()}`,
        playerType: "app"
      }];
    }

    // 普通直播流
    const streamUrl = params?.videoUrl || `${baseUrl}/stream/${encodeURIComponent(link.replace('channel:', ''))}.m3u8`;

    return [{
      name: "直播源",
      url: streamUrl,
      description: "央视频直播流",
      playerType: "app",
      headers: {
        "User-Agent": UA,
        "Referer": baseUrl
      }
    }];
  }

  // 导出
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { loadList, search, loadDetail, loadResource, WidgetMetadata };
  } else {
    Object.assign(globalThis, { loadList, search, loadDetail, loadResource, WidgetMetadata });
  }
})();
/**
 * subtitle-xunlei.js — 迅雷看看字幕模块 (ForwardWidget)
 * 基于迅雷看看接口的字幕搜索，仅支持按片名搜索
 * 作者：EL
 */

WidgetMetadata = {
  id: "subtitle.xunlei",
  title: "迅雷看看 字幕",
  version: "1.2.0",
  requiredVersion: "0.0.1",
  description: "基于迅雷看看接口的字幕搜索-仅支持按片名搜索",
  author: "EL",
  globalParams: [
    {
      name: "token",
      title: "API Token",
      type: "input",
      placeholders: [{ title: "迅雷看看 API Token（如需）", value: "" }],
    },
  ],
  modules: [
    { id: "loadSubtitle", title: "加载字幕", functionName: "loadSubtitle", type: "subtitle", params: [] },
  ],
};

const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
const SEARCH_API = "https://api.xunlei.com/subtitle/search";  // 占位，需替换为真实接口

async function loadSubtitle(params) {
  const { title, year, season, episode, mediaType, token } = params;
  if (!title) return [];

  try {
    const query = encodeURIComponent(title);
    const url = `${SEARCH_API}?q=${query}&year=${year || ''}`;
    
    const headers = { 'User-Agent': UA };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const resp = await Widget.http.get(url, { headers });
    if (!resp || resp.status !== 200) return [];
    
    const data = resp.data;
    const results = [];
    
    // 解析迅雷看看返回格式（需根据实际接口调整）
    if (data && data.list) {
      for (const item of data.list) {
        results.push({
          title: item.name || title,
          lang: item.lang || 'zh-cn',
          url: item.download_url || item.url,
          description: `${item.format || 'srt'} ${item.size ? `(${item.size})` : ''}`,
        });
      }
    }
    
    return results;
  } catch (e) {
    console.error('迅雷看看字幕搜索失败:', e);
    return [];
  }
}

// 导出供 Rex 调用
global.loadSubtitle = loadSubtitle;

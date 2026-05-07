// Weather service — IP geolocation + Open-Meteo (no API keys required)
// Privacy: IPs are never stored or logged in full

const WEATHER_CODE_MAP = {
  0:  { zh: '晴',           en: 'Clear',            icon: '☀️' },
  1:  { zh: '少云',         en: 'Mainly clear',      icon: '🌤️' },
  2:  { zh: '多云',         en: 'Partly cloudy',     icon: '⛅' },
  3:  { zh: '阴天',         en: 'Overcast',          icon: '☁️' },
  45: { zh: '雾',           en: 'Fog',               icon: '🌫️' },
  48: { zh: '霜雾',         en: 'Rime fog',          icon: '🌫️' },
  51: { zh: '小毛毛雨',     en: 'Light drizzle',     icon: '🌦️' },
  53: { zh: '毛毛雨',       en: 'Moderate drizzle',  icon: '🌦️' },
  55: { zh: '大毛毛雨',     en: 'Dense drizzle',     icon: '🌧️' },
  61: { zh: '小雨',         en: 'Slight rain',       icon: '🌧️' },
  63: { zh: '中雨',         en: 'Moderate rain',     icon: '🌧️' },
  65: { zh: '大雨',         en: 'Heavy rain',        icon: '🌧️' },
  71: { zh: '小雪',         en: 'Slight snow',       icon: '🌨️' },
  73: { zh: '中雪',         en: 'Moderate snow',     icon: '🌨️' },
  75: { zh: '大雪',         en: 'Heavy snow',        icon: '❄️' },
  80: { zh: '阵雨',         en: 'Rain showers',      icon: '🌦️' },
  81: { zh: '中阵雨',       en: 'Moderate showers',  icon: '🌧️' },
  82: { zh: '大阵雨',       en: 'Violent showers',   icon: '🌧️' },
  95: { zh: '雷暴',         en: 'Thunderstorm',      icon: '⛈️' },
  96: { zh: '雷暴+小冰雹',  en: 'T-storm + slight hail', icon: '⛈️' },
  99: { zh: '雷暴+大冰雹',  en: 'T-storm + heavy hail',  icon: '⛈️' },
};

function weatherDesc(code) {
  return WEATHER_CODE_MAP[code] || { zh: '未知', en: 'Unknown', icon: '❓' };
}

// ── IP Geolocation (ipinfo.io — free, no key required for basic use) ──────
async function ipToCity(ip) {
  const queryIp = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' ? '' : ip;
  const url = queryIp
    ? `https://ipinfo.io/${encodeURIComponent(queryIp)}/json`
    : 'https://ipinfo.io/json';

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.city) return null;
    const [lat, lon] = (data.loc || '').split(',').map(Number);
    return { city: data.city, country: data.country || '', lat, lon };
  } catch {
    return null;
  }
}

// ── Open-Meteo Geocoding (city → lat/lon) ──────────────────────
async function cityToCoords(city) {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results?.length) return null;
    const r = data.results[0];
    return {
      name: r.name || city,
      country: r.country || '',
      lat: r.latitude,
      lon: r.longitude,
    };
  } catch {
    return null;
  }
}

// ── Open-Meteo Weather (lat/lon → forecast) ────────────────────
async function getWeather(lat, lon) {
  try {
    const params = new URLSearchParams({
      latitude: lat.toFixed(4),
      longitude: lon.toFixed(4),
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      timezone: 'auto',
      forecast_days: '2',
    });
    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function getSuggestion(temp, code, precipProb) {
  if (code === 0 || code === 1) {
    if (temp > 30) return '天气晴朗但很热，建议做好防晒，多喝水，穿轻薄透气的衣物。';
    if (temp > 20) return '天气晴朗舒适，非常适合出门活动。';
    if (temp > 10) return '天气晴朗但稍凉，建议穿一件薄外套。';
    return '天气晴朗但偏冷，注意保暖，穿厚外套。';
  }
  if (code >= 51 && code <= 65) {
    return '有雨，建议带伞，穿防滑的鞋子。';
  }
  if (code >= 71 && code <= 75) {
    return '有雪，注意保暖防滑，穿防滑的鞋子。';
  }
  if (code === 95 || code === 96 || code === 99) {
    return '有雷暴，不建议外出，留在室内比较安全。';
  }
  if (precipProb > 50) {
    return '降水概率较高，建议带伞。';
  }
  return '天气尚可，正常出行即可。';
}

// ── Main: get weather for a request ────────────────────────────
export async function getWeatherForRequest(req, manualCity) {
  let lat, lon;
  let cityName;
  let country;

  if (manualCity) {
    const geo = await cityToCoords(manualCity);
    if (!geo) {
      return { success: false, error: `我没有找到"${manualCity}"的天气，请换一个更准确的城市名。` };
    }
    lat = geo.lat;
    lon = geo.lon;
    cityName = geo.name;
    country = geo.country;
  } else {
    // Get IP
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0]?.trim()
      || req.headers['x-real-ip']
      || req.ip
      || req.socket?.remoteAddress
      || '';

    // Mask local IPs
    const isLocal = !ip || ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1'
      || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')
      || ip === '1' || ip === 'localhost';

    if (isLocal) {
      return { success: false, needsCity: true, error: '我无法自动判断你的位置（本地网络），你可以告诉我城市名，例如"长沙天气怎么样"。' };
    }

    const loc = await ipToCity(ip);
    if (!loc || !loc.city) {
      return { success: false, needsCity: true, error: '我无法准确判断你的位置，你可以告诉我城市名，例如"长沙天气怎么样"。' };
    }
    lat = loc.lat;
    lon = loc.lon;
    cityName = loc.city;
    country = loc.country;
  }

  // Fetch weather
  const data = await getWeather(lat, lon);
  if (!data) {
    return { success: false, error: '天气服务暂时不可用，请稍后再试。' };
  }

  const cur = data.current || {};
  const today = data.daily || {};
  const t0 = today.temperature_2m_max?.[0] ?? cur.temperature_2m;
  const t0min = today.temperature_2m_min?.[0] ?? cur.temperature_2m;
  const t1 = today.temperature_2m_max?.[1];
  const t1min = today.temperature_2m_min?.[1];
  const curCode = cur.weather_code ?? 0;
  const todayCode = today.weather_code?.[0] ?? curCode;
  const tomCode = today.weather_code?.[1] ?? todayCode;
  const curWd = weatherDesc(curCode);
  const todayWd = weatherDesc(todayCode);
  const tomWd = weatherDesc(tomCode);
  const precipProb = today.precipitation_probability_max?.[0] ?? 0;

  const result = {
    city: cityName,
    country,
    current: {
      weather: curWd.zh,
      weatherIcon: curWd.icon,
      temp: Math.round(cur.temperature_2m ?? 0),
      humidity: Math.round(cur.relative_humidity_2m ?? 0),
      apparentTemp: Math.round(cur.apparent_temperature ?? 0),
      windSpeed: Math.round((cur.wind_speed_10m ?? 0) * 10) / 10,
      precipitation: cur.precipitation ?? 0,
    },
    today: {
      weather: todayWd.zh,
      weatherIcon: todayWd.icon,
      maxTemp: Math.round(t0),
      minTemp: Math.round(t0min),
      precipProb: Math.round(precipProb),
    },
    tomorrow: {
      weather: tomWd.zh,
      weatherIcon: tomWd.icon,
      maxTemp: t1 != null ? Math.round(t1) : Math.round(t0),
      minTemp: t1min != null ? Math.round(t1min) : Math.round(t0min),
      precipProb: Math.round(today.precipitation_probability_max?.[1] ?? 0),
    },
    suggestion: getSuggestion(Math.round(cur.temperature_2m ?? 20), curCode, precipProb),
  };

  return { success: true, data: result };
}

// ── Format weather data for AI system prompt ────────────────────
export function formatWeatherForAI(data) {
  return `【用户当前位置的真实天气数据 — 必须基于此回答】
城市：${data.city}${data.country ? ', ' + data.country : ''}

当前天气：${data.current.weather} ${data.current.weatherIcon}
当前温度：${data.current.temp}°C
体感温度：${data.current.apparentTemp}°C
湿度：${data.current.humidity}%
风速：${data.current.windSpeed} km/h
降水量：${data.current.precipitation} mm

今天：${data.today.weather} ${data.today.weatherIcon} | 最高 ${data.today.maxTemp}°C / 最低 ${data.today.minTemp}°C | 降水概率 ${data.today.precipProb}%
明天：${data.tomorrow.weather} ${data.tomorrow.weatherIcon} | 最高 ${data.tomorrow.maxTemp}°C / 最低 ${data.tomorrow.minTemp}°C | 降水概率 ${data.tomorrow.precipProb}%

出行建议：${data.suggestion}

（以上为真实天气数据，请基于此回答用户关于天气的问题。用中文自然回复。）`;
}

// ── Weather intent detection ────────────────────────────────────
const WEATHER_KEYWORDS = [
  '天气', '温度', '下雨', '雨', '冷不冷', '热不热', '出门', '穿什么',
  'weather', 'rain', 'temperature', 'hot', 'cold', 'sunny', 'cloudy',
  '刮风', '下雪', '雪', '雾', '湿度', '防晒', '带伞', '闷热', '凉爽',
  '晴天', '阴天', '多云', '雷', '台风', 'wind', 'snow', 'storm',
];

export function hasWeatherIntent(message) {
  const lower = message.toLowerCase();
  return WEATHER_KEYWORDS.some(k => lower.includes(k.toLowerCase()));
}

// ── Extract city from message ───────────────────────────────────

const NON_CITY = new Set([
  '今天', '明天', '这里', '当地', '现在', '那儿', '那里', '我们', '你们', '他们',
  '这个', '那个', '哪个', '请问', '麻烦', '帮我', '给我', '我要', '想知道',
  '怎么样', '怎么', '会不会', '为什么', '什么', '哪里', '哪儿', '如何',
]);

const NON_CITY_START = new Set('我你他她这那哪请帮给想要麻告诉知觉怎为如是可否查看找问让'.split(''));
const CITY_PREFIXES = new Set('的在去到从离往跟和与或比诉问查找让给把被叫对一下过你我他'.split(''));

const WEATHER_KW = ['明天', '气候', '会不会', '下雨', '下雪', '刮风', '温度', '气温', '热不热', '冷不冷'];

function isCityWord(w) {
  if (w.length < 2 || w.length > 3) return false;
  if (NON_CITY.has(w)) return false;
  if (NON_CITY_START.has(w[0])) return false;
  if (CITY_PREFIXES.has(w[0])) return false;
  return true;
}

// Check if a candidate city has a valid left boundary
function hasValidBoundary(before, len) {
  if (before.length < len) return false;
  const prevChar = before.length > len ? before[before.length - len - 1] : null;
  // At start of string → OK
  if (prevChar === null) return true;
  // Preceded by non-Chinese → OK
  if (!/[\u4e00-\u9fa5]/.test(prevChar)) return true;
  // Preceded by a known separator → OK
  if (CITY_PREFIXES.has(prevChar)) return true;
  // Preceded by the end of a NON_CITY word → OK (e.g. "今天|北京")
  if (before.length >= len + 2) {
    const twoBefore = before.slice(-len - 2, -len);
    if (NON_CITY.has(twoBefore)) return true;
  }
  return false;
}

function tryExtractCity(before) {
  for (let len = 3; len >= 2; len--) {
    if (before.length < len) continue;
    const candidate = before.slice(-len);
    if (!/^[\u4e00-\u9fa5]+$/.test(candidate)) continue;
    if (!isCityWord(candidate)) continue;
    // If len=3 and the two chars before candidate form a NON_CITY word,
    // the candidate likely includes part of that word — skip to len=2
    if (len === 3 && before.length >= 5) {
      const twoBefore = before.slice(-5, -3);
      if (NON_CITY.has(twoBefore)) continue;
    }
    if (hasValidBoundary(before, len)) return candidate;
  }
  return null;
}

export function extractCity(message) {
  // Strategy A: find "天气", extract the word right before it
  const wxIdx = message.indexOf('天气');
  if (wxIdx >= 0) {
    let before = message.slice(0, wxIdx);
    before = before.replace(/[的了呢吧吗啊哦哟]+$/, '');
    if (before) {
      const city = tryExtractCity(before);
      if (city) return city;
    }
  }

  // Strategy B: "天气XX" — city after 天气
  const afterMatch = message.match(/天气[^\u4e00-\u9fa5]*?([\u4e00-\u9fa5]{2,3})/);
  if (afterMatch && isCityWord(afterMatch[1])) return afterMatch[1];

  // Strategy C: city before weather keywords (no 天气)
  let kwIdx = Infinity;
  for (const kw of WEATHER_KW) {
    const idx = message.indexOf(kw);
    if (idx >= 0 && idx < kwIdx) kwIdx = idx;
  }
  if (kwIdx < Infinity) {
    let before = message.slice(0, kwIdx);
    before = before.replace(/[的了呢吧吗啊哦哟]+$/, '');
    if (before) {
      const city = tryExtractCity(before);
      if (city) return city;
    }
  }

  // Strategy D: English cities
  const eng = message.match(/weather\s+(?:in|for)\s+([A-Za-z\s]{2,20})/i)
    || message.match(/([A-Za-z]{2,20})(?:'s)?\s+weather/i)
    || message.match(/what(?:'s| is) the weather (?:like )?in ([A-Za-z\s]{2,20})/i);
  if (eng) return eng[1].trim();

  return null;
}

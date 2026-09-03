const { supabaseRequest, getEnv } = require('../server-lib/supabase');

function parseDateWindow(rawRange) {
  const now = new Date();
  const normalizedRange = String(rawRange || '7d').toLowerCase();
  let days = 7;

  if (normalizedRange.endsWith('d')) {
    days = Number.parseInt(normalizedRange, 10) || 7;
  }

  const start = new Date(now.getTime() - ((days - 1) * 24 * 60 * 60 * 1000));
  start.setHours(0, 0, 0, 0);

  const end = new Date(now.getTime() + (24 * 60 * 60 * 1000));
  end.setHours(23, 59, 59, 999);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    label: `${days}d`
  };
}

function normalizeCount(value) {
  return Number(value || 0);
}

function groupBy(entries, key) {
  const map = new Map();

  for (const entry of entries) {
    const item = entry[key];
    if (!item) continue;
    map.set(item, (map.get(item) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function buildDailySeries(events) {
  const map = new Map();

  for (const event of events) {
    if (!event.created_at) continue;
    const date = new Date(event.created_at);
    const key = date.toISOString().slice(0, 10);
    if (!map.has(key)) {
      map.set(key, { date: key, page_views: 0, unique_visitors: new Set() });
    }
    const bucket = map.get(key);
    if (event.event_name === 'page_view') {
      bucket.page_views += 1;
    }
    if (event.visitor_id) {
      bucket.unique_visitors.add(event.visitor_id);
    }
  }

  return Array.from(map.entries())
    .map(([date, bucket]) => ({
      date,
      page_views: bucket.page_views,
      unique_visitors: bucket.unique_visitors.size
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  const adminToken = getEnv('ADMIN_ANALYTICS_TOKEN');
  const headerToken = req.headers && (req.headers['x-admin-token'] || req.headers.authorization || '');
  const tokenValue = typeof headerToken === 'string' ? headerToken.replace(/^Bearer\s+/i, '').trim() : '';

  if (!adminToken) {
    return res.status(501).json({
      success: false,
      error: 'Admin analytics endpoint requires proper server-side protection before production use. Set ADMIN_ANALYTICS_TOKEN in Vercel environment variables.'
    });
  }

  if (!tokenValue || tokenValue !== adminToken) {
    return res.status(401).json({ success: false, error: 'Unauthorized.' });
  }

  try {
    const range = parseDateWindow(req.query && req.query.range ? String(req.query.range) : '7d');
    const query = `/rest/v1/analytics_events?created_at=gte.${encodeURIComponent(range.start)}&created_at=lt.${encodeURIComponent(range.end)}&select=*`;
    const rows = await supabaseRequest({ path: query, method: 'GET' });
    const events = Array.isArray(rows) ? rows : [];

    const pageViews = events.filter((event) => event.event_name === 'page_view').length;
    const uniqueVisitors = new Set(events.map((event) => event.visitor_id).filter(Boolean)).size;
    const sessions = new Set(events.map((event) => event.session_id).filter(Boolean)).size;
    const buyClicks = events.filter((event) => event.event_name === 'click_buy').length;
    const successfulPayments = events.filter((event) => event.event_name === 'payment_success').length;
    const websitesCreated = events.filter((event) => event.event_name === 'website_created').length;

    const topPages = groupBy(events.filter((event) => event.page_path), 'page_path').slice(0, 10);
    const topTemplates = groupBy(events.filter((event) => event.template_id), 'template_id').slice(0, 10);
    const trafficSources = groupBy(events.filter((event) => event.utm_source), 'utm_source').slice(0, 10);
    const dailyBreakdown = buildDailySeries(events);

    return res.status(200).json({
      success: true,
      range: {
        start: range.start,
        end: range.end,
        days: range.label
      },
      stats: {
        total_page_views: pageViews,
        unique_visitors: uniqueVisitors,
        sessions,
        buy_clicks: buyClicks,
        successful_payments: successfulPayments,
        websites_created: websitesCreated,
        event_count: events.length
      },
      top_pages: topPages,
      top_templates: topTemplates,
      traffic_sources: trafficSources,
      daily_page_views: dailyBreakdown,
      daily_unique_visitors: dailyBreakdown.map((entry) => ({
        date: entry.date,
        unique_visitors: entry.unique_visitors
      }))
    });
  } catch (error) {
    const statusCode = Number(error && error.statusCode) || 500;
    return res.status(statusCode).json({
      success: false,
      error: error && error.message ? error.message : 'Internal server error.'
    });
  }
};

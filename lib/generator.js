'use strict';

const { URL } = require('url');

const DEFAULTS = {
  status: true,
  path: 'sitemap.xml',
  rel: true,
  tags: true,
  categories: true,
  exclude: [],
  extra_urls: [],
  include_home: true,
  lastmod: true,
  changefreq: false,
  priority: false
};

function toList(value) {
  if (value === null || value === undefined) return [];
  const items = Array.isArray(value) ? value : [value];
  const result = [];
  for (const item of items) {
    if (item === null || item === undefined) continue;
    if (typeof item === 'string') {
      item.split(/[\r\n,]/).forEach(function (part) {
        const trimmed = part.trim();
        if (trimmed) result.push(trimmed);
      });
    } else {
      result.push(item);
    }
  }
  return result;
}

function isAbsoluteUrl(value) {
  return /^https?:\/\//i.test(String(value));
}

function normalizePath(value) {
  let path = String(value === null || value === undefined ? '' : value).trim();
  if (!path) return '/';
  if (isAbsoluteUrl(path)) {
    try {
      path = new URL(path).pathname;
    } catch (err) {
      return '/';
    }
  }
  if (!path.startsWith('/')) path = '/' + path;
  if (path.length > 1) path = path.replace(/\/+$/, '');
  return path;
}

function isFilePath(entry) {
  const clean = String(entry).replace(/\/+$/, '');
  const last = clean.split('/').pop() || '';
  return /\.[A-Za-z0-9]+$/.test(last);
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toIsoString(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function siteBase(config) {
  const url = String(config.url || '').replace(/\/+$/, '');
  let root = String(config.root || '/');
  if (!root.startsWith('/')) root = '/' + root;
  root = root.replace(/\/+$/, '');
  return url + root;
}

function joinUrl(base, value) {
  if (isAbsoluteUrl(value)) return String(value);
  const path = String(value === null || value === undefined ? '' : value);
  const trimmed = base.replace(/\/+$/, '');
  if (!path || path === '/') return trimmed + '/';
  return trimmed + (path.startsWith('/') ? path : '/' + path);
}

function matchExclude(routePath, excludeList) {
  const target = normalizePath(routePath).toLowerCase();
  for (const raw of toList(excludeList)) {
    if (raw === null || raw === undefined) continue;
    const entry = String(raw).trim();
    if (!entry) continue;
    const normalized = normalizePath(entry).toLowerCase();
    if (isFilePath(normalized)) {
      if (target === normalized) return true;
    } else if (target === normalized || target.startsWith(normalized + '/')) {
      return true;
    }
  }
  return false;
}

function register(hexo) {
  hexo.extend.generator.register('custom_sitemap', function (locals) {
    const config = hexo.config || {};
    const scoped = config.sitemap && typeof config.sitemap === 'object' ? config.sitemap : {};
    const options = Object.assign({}, DEFAULTS, scoped);
    if (scoped.exclude === undefined && config.exclude !== undefined) options.exclude = config.exclude;
    if (scoped.extra_urls === undefined && config.extra_urls !== undefined) options.extra_urls = config.extra_urls;

    if (options.status === false || options.status === 'false') return null;

    const base = siteBase(config);
    const excludeList = toList(options.exclude);
    const extraUrls = toList(options.extra_urls);

    const collected = [];
    const seen = new Set();

    const collect = function (routePathSource, url, lastmod) {
      const routePath = normalizePath(routePathSource);
      const key = routePath.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      collected.push({ routePath: routePath, url: String(url), lastmod: toIsoString(lastmod) });
    };

    if (options.include_home !== false) collect('/', joinUrl(base, '/'), null);

    if (locals.posts) {
      locals.posts.forEach(function (post) {
        if (!post || !post.path) return;
        collect(post.path, post.permalink || joinUrl(base, post.path), post.updated || post.date);
      });
    }

    if (options.rel !== false && locals.pages) {
      locals.pages.forEach(function (page) {
        if (!page || !page.path) return;
        collect(page.path, page.permalink || joinUrl(base, page.path), page.updated || page.date);
      });
    }

    if (options.tags !== false && locals.tags) {
      locals.tags.forEach(function (tag) {
        if (!tag || !tag.path) return;
        collect(tag.path, joinUrl(base, tag.path), tag.updated);
      });
    }

    if (options.categories !== false && locals.categories) {
      locals.categories.forEach(function (category) {
        if (!category || !category.path) return;
        collect(category.path, joinUrl(base, category.path), category.updated);
      });
    }

    const entries = [];
    const finalKeys = new Set();

    const addEntry = function (routePath, url, lastmod, dedupeKey) {
      const normalized = normalizePath(routePath);
      const key = String(dedupeKey || normalized).toLowerCase();
      if (finalKeys.has(key)) return;
      finalKeys.add(key);
      entries.push({ routePath: normalized, url: String(url), lastmod: lastmod });
    };

    for (const item of collected) {
      if (matchExclude(item.routePath, excludeList)) continue;
      addEntry(item.routePath, item.url, item.lastmod);
    }

    const now = toIsoString(new Date());

    for (const raw of extraUrls) {
      if (raw === null || raw === undefined) continue;
      const value = String(raw).trim();
      if (!value) continue;
      if (isAbsoluteUrl(value)) {
        addEntry(normalizePath(value), value, now, value);
      } else {
        addEntry(normalizePath(value), joinUrl(base, value), now);
      }
    }

    const lines = ['<?xml version="1.0" encoding="UTF-8"?>'];
    lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    for (const entry of entries) {
      lines.push('  <url>');
      lines.push('    <loc>' + escapeXml(entry.url) + '</loc>');
      if (options.lastmod !== false && entry.lastmod) {
        lines.push('    <lastmod>' + escapeXml(entry.lastmod) + '</lastmod>');
      }
      if (options.changefreq) {
        lines.push('    <changefreq>' + escapeXml(options.changefreq) + '</changefreq>');
      }
      if (options.priority) {
        lines.push('    <priority>' + escapeXml(options.priority) + '</priority>');
      }
      lines.push('  </url>');
    }
    lines.push('</urlset>');

    return {
      path: options.path || DEFAULTS.path,
      data: lines.join('\n')
    };
  });
}

module.exports = register;
module.exports.DEFAULTS = DEFAULTS;
module.exports.normalizePath = normalizePath;
module.exports.isFilePath = isFilePath;
module.exports.matchExclude = matchExclude;
module.exports.joinUrl = joinUrl;
module.exports.siteBase = siteBase;
module.exports.toIsoString = toIsoString;
module.exports.toList = toList;

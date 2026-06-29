// FishStock — API Client for MySQL backend
// Auto-detect: if backend is reachable, use API. Otherwise fall back to localStorage.

window.API = (() => {
  const STORAGE_TOKEN_KEY = 'fs-api-token';
  const STORAGE_URL_KEY   = 'fs-api-base-url';
  // Default: use same origin (when frontend served from backend), else read from localStorage
  let baseUrl = localStorage.getItem(STORAGE_URL_KEY) || '';
  let token = localStorage.getItem(STORAGE_TOKEN_KEY) || '';
  let isAvailable = false;

  function setBaseUrl(url) {
    baseUrl = (url || '').replace(/\/+$/, '');
    localStorage.setItem(STORAGE_URL_KEY, baseUrl);
  }
  function getBaseUrl() { return baseUrl; }
  function setToken(t) { token = t || ''; localStorage.setItem(STORAGE_TOKEN_KEY, token); }
  function clearToken() { token = ''; localStorage.removeItem(STORAGE_TOKEN_KEY); }
  function isLoggedIn() { return !!token; }
  function available() { return isAvailable; }

  async function request(method, path, body) {
    const url = baseUrl + path;
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (token) opts.headers.Authorization = 'Bearer ' + token;
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    if (!res.ok) {
      const errText = await res.text();
      let err;
      try { err = JSON.parse(errText); } catch(e) { err = { error: errText }; }
      const e = new Error(err.error || ('HTTP ' + res.status));
      e.status = res.status; e.body = err;
      throw e;
    }
    return res.status === 204 ? null : res.json();
  }

  async function checkAvailable() {
    try {
      const url = (baseUrl || '') + '/api/health';
      const res = await fetch(url, { method: 'GET' });
      isAvailable = res.ok;
    } catch (e) { isAvailable = false; }
    return isAvailable;
  }

  // ===== Auth =====
  async function login(username, password) {
    const r = await request('POST', '/api/login', { username, password, device_id: localStorage.getItem('fs-device-id') });
    setToken(r.token);
    return r.user;
  }
  function logout() { clearToken(); }

  // ===== CRUD wrappers =====
  const products = {
    list:    () => request('GET',    '/api/products'),
    get:     (code) => request('GET', '/api/products/' + encodeURIComponent(code)),
    create:  (p) => request('POST',   '/api/products', p),
    update:  (code, p) => request('PUT', '/api/products/' + encodeURIComponent(code), p),
    remove:  (code) => request('DELETE', '/api/products/' + encodeURIComponent(code)),
    clear:   () => request('DELETE',  '/api/products')
  };
  const categories = {
    list:   () => request('GET',  '/api/categories'),
    create: (c) => request('POST',  '/api/categories', c),
    update: (id, c) => request('PUT',  '/api/categories/' + id, c),
    remove: (id, fallback) => request('DELETE', '/api/categories/' + id, { fallback })
  };
  const suppliers = {
    list:   () => request('GET',  '/api/suppliers'),
    create: (s) => request('POST',  '/api/suppliers', s),
    update: (id, s) => request('PUT',  '/api/suppliers/' + id, s),
    remove: (id) => request('DELETE', '/api/suppliers/' + id)
  };
  const customers = {
    list:   () => request('GET',  '/api/customers'),
    create: (c) => request('POST',  '/api/customers', c),
    update: (id, c) => request('PUT',  '/api/customers/' + id, c),
    remove: (id) => request('DELETE', '/api/customers/' + id)
  };
  const expenses = {
    list:   (opts={}) => request('GET',  '/api/expenses?' + new URLSearchParams(opts)),
    create: (e) => request('POST',  '/api/expenses', e),
    remove: (id) => request('DELETE', '/api/expenses/' + id)
  };
  const stock = {
    list:    (opts={}) => request('GET', '/api/stock?' + new URLSearchParams(opts)),
    receive: (data) => request('POST',   '/api/stock/in', data),
    issue:   (data) => request('POST',   '/api/stock/out', data)
  };
  const sales = {
    list:     (opts={}) => request('GET',  '/api/sales?' + new URLSearchParams(opts)),
    checkout: (bill) => request('POST',     '/api/sales', bill),
    voidBill: (billNo) => request('DELETE', '/api/sales/' + encodeURIComponent(billNo)),
    summary:  (opts={}) => request('GET',   '/api/sales/summary/kpi?' + new URLSearchParams(opts))
  };
  const sync = {
    pull: () => request('GET',  '/api/sync'),
    push: (data) => request('POST', '/api/sync', data)
  };

  return {
    setBaseUrl, getBaseUrl, setToken, clearToken, isLoggedIn, available, checkAvailable,
    login, logout,
    products, categories, suppliers, customers, expenses, stock, sales, sync
  };
})();

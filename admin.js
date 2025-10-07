const DEMO_USER = { login: 'admin', password: 'admin' };

function isLoggedIn(){
  return localStorage.getItem('riviera_admin_token') !== null;
}

function setLoggedIn(v, token = null){
  if (v && token) {
    localStorage.setItem('riviera_admin_token', token);
  } else {
    localStorage.removeItem('riviera_admin_token');
  }
}

function getRequests(){
  return JSON.parse(localStorage.getItem('riviera_requests') || '[]');
}

function formatDate(iso){
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

function filterRequests(requests, q){
  if (!q) return requests;
  const s = q.toLowerCase();
  return requests.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(s)));
}

function filterByDateRange(requests, range){
  if (!range || range === 'all') return requests;
  const now = new Date();
  const from = new Date(now);
  switch(range){
    case 'day': from.setDate(now.getDate() - 1); break;
    case 'week': from.setDate(now.getDate() - 7); break;
    case 'month': from.setMonth(now.getMonth() - 1); break;
    case '3months': from.setMonth(now.getMonth() - 3); break;
    case '6months': from.setMonth(now.getMonth() - 6); break;
    case 'year': from.setFullYear(now.getFullYear() - 1); break;
    default: return requests;
  }
  const fromMs = from.getTime();
  return requests.filter(r => {
    const t = Date.parse(r.createdAt);
    return !isNaN(t) && t >= fromMs;
  });
}

function safe(v){
  return (v === undefined || v === null || String(v).trim() === '') ? '-' : String(v);
}

// Преобразует служебные значения цели в человекочитаемые на выбранном языке
function formatPurpose(purpose, lang){
  const language = (lang || 'ru').toLowerCase();
  const dictByLang = {
    ru: { by_request: 'По заявке', by_invite: 'По приглашению' },
    kz: { by_request: 'Өтінім бойынша', by_invite: 'Шақыру бойынша' },
    en: { by_request: 'By request', by_invite: 'By invitation' },
  };
  const dict = dictByLang[language] || dictByLang.ru;
  return dict[purpose] || purpose;
}

// Отображает язык в верхнем регистре и добавляет соответствующий флаг
function formatDestination(destination){
  const destMap = {
    'admin': 'Администрация',
    'sales': 'В коммерческий отдел', 
    'primary': 'В начальную школу',
    'secondary': 'В среднюю и старшую школу',
    'other': 'Иное'
  };
  return destMap[destination] || destination || '-';
}

function formatLang(lang){
  const code = (lang || '').toLowerCase();
  // Возвращаем HTML со значком флага (через CSS background-image) и подписью
  const map = {
    ru: { cls: 'flag-ru', label: 'RU' },
    kz: { cls: 'flag-kz', label: 'KZ' },
    en: { cls: 'flag-gb', label: 'EN' },
  };
  const item = map[code];
  if (!item) return code ? code.toUpperCase() : '-';
  return `<span class="flag ${item.cls}" aria-hidden="true"></span> ${item.label}`;
}

function renderTable(rows){
  const tbody = document.querySelector('#requestsTable tbody');
  tbody.innerHTML = '';
  rows.forEach((r, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="">
        <input type="checkbox" ${state.selectedIds.has(r.id) ? 'checked' : ''} onchange="toggleSelect(${r.id})">
      </td>
      <td data-label="№">${idx + 1}</td>
      <td data-label="Дата и время">${safe(formatDate(r.createdAt))}</td>
      <td data-label="ФИО">${safe(r.fullName)}</td>
      <td data-label="Куда">${safe(formatDestination(r.destination))}</td>
      <td data-label="От кого">${safe(r.fromWhom)}</td>
      <td data-label="Цель">${safe(formatPurpose(r.purpose, r.lang))}</td>
      <td data-label="Язык" class="lang-cell">${safe(formatLang(r.lang))}</td>
    `;
    tbody.appendChild(tr);
  });
}

function toggleSelectAll(){
  const currentSlice = paginate(currentFiltered(), state.page, parseInt(pageSizeSel?.value || '10', 10)).slice;
  if (state.selectAll) {
    state.selectedIds.clear();
    state.selectAll = false;
  } else {
    currentSlice.forEach(item => state.selectedIds.add(item.id));
    state.selectAll = true;
  }
  updateDeleteButton();
}

function toggleSelect(id){
  if (state.selectedIds.has(id)) {
    state.selectedIds.delete(id);
    state.selectAll = false;
  } else {
    state.selectedIds.add(id);
    // Проверяем, выбраны ли все элементы на текущей странице
    const currentSlice = paginate(currentFiltered(), state.page, parseInt(pageSizeSel?.value || '10', 10)).slice;
    const currentPageIds = currentSlice.map(item => item.id);
    state.selectAll = currentPageIds.every(id => state.selectedIds.has(id));
  }
  updateDeleteButton();
}

function updateDeleteButton(){
  const deleteBtn = document.getElementById('deleteSelectedBtn');
  if (deleteBtn) {
    if (state.selectedIds.size > 0) {
      deleteBtn.style.display = 'inline-flex';
      deleteBtn.textContent = `Удалить выбранные (${state.selectedIds.size})`;
    } else {
      deleteBtn.style.display = 'none';
    }
  }
}

function deleteSelected(){
  if (state.selectedIds.size === 0) return;
  const count = state.selectedIds.size;
  if (!confirm(`Вы уверены, что хотите удалить ${count} записей?`)) return;
  
  fetch('/api/requests', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: Array.from(state.selectedIds) })
  })
    .then(r => r.json())
    .then(() => {
      state.selectedIds.clear();
      state.selectAll = false;
      load(); // Перезагружаем список
    })
    .catch(() => alert('Ошибка при удалении записей'));
}

function deleteRequest(id){
  if (!confirm('Вы уверены, что хотите удалить эту запись?')) return;
  fetch(`/api/requests/${id}`, { method: 'DELETE' })
    .then(r => r.json())
    .then(() => {
      load(); // Перезагружаем список
    })
    .catch(() => alert('Ошибка при удалении записи'));
}

function paginate(rows, page, pageSize){
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * pageSize;
  const slice = rows.slice(start, start + pageSize);
  return { slice, current, pages, total };
}

function exportCSV(rows){
  const headers = ['createdAt','fullName','destination','fromWhom','purpose','lang'];
  const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => {
    const value = (r[h] ?? '').toString().replaceAll('"','""');
    return `"${value}"`;
  }).join(','))).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'requests.csv'; a.click();
  URL.revokeObjectURL(url);
}

function exportXLSX(rows){
  // Подготовим данные с форматированием значений
  const data = rows.map(r => ({
    'Дата и время': formatDate(r.createdAt),
    'ФИО': r.fullName || '',
    'Куда': formatDestination(r.destination),
    'От кого': r.fromWhom || '',
    'Цель': formatPurpose(r.purpose, r.lang),
    'Язык': (r.lang || '').toUpperCase(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Requests');
  XLSX.writeFile(workbook, 'requests.xlsx');
}

function show(section){
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('tableSection').classList.add('hidden');
  document.getElementById(section).classList.remove('hidden');
}

function initLogin(){
  const loginBtn = document.getElementById('loginBtn');
  loginBtn.addEventListener('click', () => {
    const login = document.getElementById('login').value.trim();
    const password = document.getElementById('password').value;
    if (login === DEMO_USER.login && password === DEMO_USER.password){
      // Создаем демо токен
      const demoToken = 'demo-token-' + Date.now();
      setLoggedIn(true, demoToken);
      initTable();
      show('tableSection');
    } else {
      alert('Неверный логин или пароль');
    }
  });
}

function initTable(){
  const all = getRequests();
  renderTable(all);
  const search = document.getElementById('search');
  const dateRange = document.getElementById('dateRange');
  const actionsToggle = document.querySelector('.actions-toggle');
  const actionsPanel = document.getElementById('actionsPanel');
  const pageSizeSel = document.getElementById('pageSize');
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');
  const pageInfo = document.getElementById('pageInfo');

  let state = { 
    page: 1, 
    selectedIds: new Set(),
    selectAll: false
  };

  function currentFiltered(){
    const byDate = filterByDateRange(all, dateRange.value);
    return filterRequests(byDate, search.value);
  }

  function rerender(){
    const size = parseInt(pageSizeSel?.value || '10', 10);
    const { slice, current, pages } = paginate(currentFiltered(), state.page, size);
    renderTable(slice);
    updateDeleteButton();
    if (pageInfo) pageInfo.textContent = `${current} / ${pages}`;
    if (prevPageBtn) prevPageBtn.disabled = current <= 1;
    if (nextPageBtn) nextPageBtn.disabled = current >= pages;
  }

  search.addEventListener('input', () => { state.page = 1; rerender(); });
  dateRange.addEventListener('change', () => { state.page = 1; rerender(); });
  if (pageSizeSel) pageSizeSel.addEventListener('change', () => { state.page = 1; rerender(); });
  if (prevPageBtn) prevPageBtn.addEventListener('click', () => { state.page--; rerender(); });
  if (nextPageBtn) nextPageBtn.addEventListener('click', () => { state.page++; rerender(); });

  document.getElementById('exportBtn').addEventListener('click', () => exportCSV(currentFiltered()));
  const exportXlsxBtn = document.getElementById('exportXlsxBtn');
  if (exportXlsxBtn) exportXlsxBtn.addEventListener('click', () => exportXLSX(currentFiltered()))
  document.getElementById('logoutBtn').addEventListener('click', () => { setLoggedIn(false); show('loginSection'); });

  // Коллапс панели действий только для узких экранов
  if (actionsToggle && actionsPanel) {
    actionsToggle.addEventListener('click', () => {
      actionsPanel.classList.toggle('open');
      const expanded = actionsPanel.classList.contains('open');
      actionsToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
  }

  // первичный рендер с пагинацией
  rerender();
}

document.addEventListener('DOMContentLoaded', () => {
  if (isLoggedIn()) {
    initTable();
    show('tableSection');
  } else {
    initLogin();
    show('loginSection');
  }
});



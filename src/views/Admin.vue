<template>
  <div class="app">
    <main class="app-main app-main-wide">
      <section v-if="!isAuthed" class="card admin-login-card">
        <div class="admin-header">
          <img src="/img/logo.png" alt="Riviera Entry Logo" class="admin-logo" />
          <h1 class="admin-title">Administrator</h1>
        </div>
        <h2 style="margin-top:0;margin-bottom:12px;font-size:16px;text-align:center">Вход</h2>
        <div class="form-group">
          <label>Логин</label>
          <input v-model.trim="login" type="text" autocomplete="username" placeholder="admin" />
        </div>
        <div class="form-group">
          <label>Пароль</label>
          <input v-model="password" type="password" autocomplete="current-password" placeholder="••••••••" />
        </div>
        <button class="btn btn-primary" @click="doLogin">Войти</button>
        <p class="small muted" style="margin-top:8px">Демодоступ: admin / admin</p>
        <a href="/index.html" class="btn btn-back">← Назад</a>
      </section>

      <section v-else class="card">
        <div class="table-header">
          <div class="table-title">
            <img src="/img/logo.png" alt="Logo" class="table-title-logo" />
            <h2 class="table-title-text">Заявки</h2>
          </div>
          <button class="actions-toggle" :aria-expanded="actionsOpen ? 'true' : 'false'" aria-label="Меню" @click="actionsOpen = !actionsOpen">
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
          </button>
        </div>
        <div class="actions-panel" :class="{ open: actionsOpen }" style="flex-wrap:wrap">
          <select v-model="range" @change="load" class="range-select">
            <option value="all">За всё время</option>
            <option value="day">За день</option>
            <option value="week">За неделю</option>
            <option value="month">За месяц</option>
            <option value="3months">За 3 месяца</option>
            <option value="6months">За полгода</option>
            <option value="year">За год</option>
          </select>
          <button v-if="selectedIds.size > 0" class="btn btn-danger" @click="deleteSelected">
            Удалить выбранные ({{ selectedIds.size }})
          </button>
          <button id="exportBtn" class="btn" @click="exportCSV">Экспорт CSV</button>
          <button id="exportXlsxBtn" class="btn" @click="exportXLSX">Экспорт Excel</button>
          <button class="btn" style="background:#0e1116;border:1px solid var(--border);color:var(--text)" @click="logout">Выйти</button>
        </div>
        <div class="form-group" style="margin-bottom:12px;display:flex;gap:8px">
          <input v-model.trim="q" @input="load" type="search" placeholder="Поиск..." style="flex:1 1 auto" />
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th class="col-checkbox">
                  <input type="checkbox" :checked="selectAll" @change="toggleSelectAll">
                </th>
                <th class="col-index">№</th>
                <th>Дата и время</th>
                <th>ФИО</th>
                <th>Куда</th>
                <th>От кого</th>
                <th>Цель</th>
                <th>Язык</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, idx) in slice" :key="r.id">
                <td data-label="">
                  <input type="checkbox" :checked="selectedIds.has(r.id)" @change="toggleSelect(r.id)">
                </td>
                <td data-label="№">{{ (page - 1) * pageSize + idx + 1 }}</td>
                <td data-label="Дата и время">{{ formatDate(r.createdAt) }}</td>
                <td data-label="ФИО">{{ r.fullName || '-' }}</td>
                <td data-label="Куда">{{ formatDestination(r.destination) }}</td>
                <td data-label="От кого">{{ r.fromWhom || '-' }}</td>
                <td data-label="Цель">{{ formatPurpose(r.purpose, r.lang) }}</td>
                <td data-label="Язык"><span v-html="formatLang(r.lang)"></span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="table-pagination">
          <div class="page-size">
            <label class="small muted">Показывать по</label>
            <select v-model.number="pageSize" class="range-select" style="width:auto">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
          </div>
          <div class="pager">
            <button class="btn" :disabled="page<=1" @click="page = Math.max(1, page-1)">‹</button>
            <span class="small muted">{{ page }} / {{ pages }}</span>
            <button class="btn" :disabled="page>=pages" @click="page = Math.min(pages, page+1)">›</button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

function formatDate(iso){ try { return new Date(iso).toLocaleString(); } catch { return iso; } }
function formatPurpose(purpose, lang){
  const language = (lang || 'ru').toLowerCase();
  const dictByLang = {
    ru: { by_request: 'По заявке', by_invite: 'По приглашению' },
    kz: { by_request: 'Өтінім бойынша', by_invite: 'Шақыру бойынша' },
    en: { by_request: 'By request', by_invite: 'By invitation' },
  };
  const dict = dictByLang[language] || dictByLang.ru;
  return dict[purpose] || (purpose || '-');
}
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
  const map = { ru: { cls: 'flag-ru', label: 'RU' }, kz: { cls: 'flag-kz', label: 'KZ' }, en: { cls: 'flag-gb', label: 'EN' } };
  const item = map[code];
  if (!item) return (code ? code.toUpperCase() : '-');
  return `<span class="flag ${item.cls}" aria-hidden="true"></span> ${item.label}`;
}

const token = ref('');
const isAuthed = ref(false);
const login = ref('');
const password = ref('');
const items = ref([]);
const q = ref('');
const range = ref('all');
const page = ref(1);
const pageSize = ref(10);
const actionsOpen = ref(false);
const selectedIds = ref(new Set());
const selectAll = ref(false);

const filtered = computed(() => items.value);
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)));
const slice = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return filtered.value.slice(start, start + pageSize.value);
});

function doLogin(){
  fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login: login.value, password: password.value }) })
    .then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json(); })
    .then(d => { 
      token.value = d.token; 
      isAuthed.value = true; 
      // Сохраняем токен в localStorage
      localStorage.setItem('riviera_admin_token', d.token);
      load(); 
    })
    .catch(() => alert('Неверный логин или пароль'));
}
function load(){
  const params = new URLSearchParams();
  if (q.value) params.set('q', q.value);
  if (range.value && range.value !== 'all') params.set('range', range.value);
  fetch('/api/requests?' + params.toString())
    .then(r => r.json())
    .then(d => { items.value = d; page.value = 1; });
}
function exportCSV(){
  const headers = ['createdAt','fullName','destination','fromWhom','purpose','lang'];
  const rows = filtered.value.map(r => headers.map(h => {
    const val = (r[h] ?? '').toString().replaceAll('"','""');
    return `"${val}"`;
  }).join(','));
  const csv = [headers.join(',')].concat(rows).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'requests.csv'; a.click(); URL.revokeObjectURL(url);
}
function exportXLSX(){
  if (typeof XLSX === 'undefined') { alert('Библиотека XLSX не подключена'); return; }
  const data = filtered.value.map(r => ({
    'Дата и время': formatDate(r.createdAt),
    'ФИО': r.fullName || '',
    'Куда': formatDestination(r.destination),
    'От кого': r.fromWhom || '',
    'Цель': formatPurpose(r.purpose, r.lang),
    'Язык': (r.lang || '').toUpperCase(),
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Requests');
  XLSX.writeFile(wb, 'requests.xlsx');
}
function toggleSelectAll(){
  if (selectAll.value) {
    selectedIds.value.clear();
    selectAll.value = false;
  } else {
    slice.value.forEach(item => selectedIds.value.add(item.id));
    selectAll.value = true;
  }
}

function toggleSelect(id){
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id);
    selectAll.value = false;
  } else {
    selectedIds.value.add(id);
    // Проверяем, выбраны ли все элементы на текущей странице
    const currentPageIds = slice.value.map(item => item.id);
    selectAll.value = currentPageIds.every(id => selectedIds.value.has(id));
  }
}

function deleteSelected(){
  if (selectedIds.value.size === 0) return;
  const count = selectedIds.value.size;
  if (!confirm(`Вы уверены, что хотите удалить ${count} записей?`)) return;
  
  fetch('/api/requests', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: Array.from(selectedIds.value) })
  })
    .then(r => r.json())
    .then(() => {
      selectedIds.value.clear();
      selectAll.value = false;
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

function logout(){ 
  token.value=''; 
  isAuthed.value=false; 
  // Удаляем токен из localStorage
  localStorage.removeItem('riviera_admin_token');
}

onMounted(() => { 
  // Проверяем сохраненный токен при загрузке страницы
  const savedToken = localStorage.getItem('riviera_admin_token');
  if (savedToken) {
    token.value = savedToken;
    isAuthed.value = true;
    load();
  }
});
</script>

<style scoped>
/* использует глобальный styles.css */
</style>



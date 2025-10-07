import { createApp, ref, computed, onMounted } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

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

createApp({
  setup(){
    const token = ref('');
    const isAuthed = ref(false);
    const login = ref('');
    const password = ref('');
    const userRole = ref('');
    const userLogin = ref('');
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
          userRole.value = d.role;
          userLogin.value = d.login;
          isAuthed.value = true; 
          // Сохраняем токен и роль в localStorage
          localStorage.setItem('riviera_admin_token', d.token);
          localStorage.setItem('riviera_admin_role', d.role);
          localStorage.setItem('riviera_admin_login', d.login);
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
      userRole.value='';
      userLogin.value='';
      isAuthed.value=false; 
      // Удаляем токен и роль из localStorage
      localStorage.removeItem('riviera_admin_token');
      localStorage.removeItem('riviera_admin_role');
      localStorage.removeItem('riviera_admin_login');
    }

    onMounted(() => { 
      // Проверяем сохраненный токен при загрузке страницы
      const savedToken = localStorage.getItem('riviera_admin_token');
      const savedRole = localStorage.getItem('riviera_admin_role');
      const savedLogin = localStorage.getItem('riviera_admin_login');
      if (savedToken && savedRole && savedLogin) {
        token.value = savedToken;
        userRole.value = savedRole;
        userLogin.value = savedLogin;
        isAuthed.value = true;
        load();
      }
    });

    return { token, isAuthed, login, password, userRole, userLogin, doLogin, items, q, range, page, pageSize, pages, slice, load, exportCSV, exportXLSX, deleteRequest, deleteSelected, toggleSelectAll, toggleSelect, selectedIds, selectAll, logout, formatDate, formatPurpose, formatDestination, formatLang, actionsOpen };
  }
}).mount('#app');



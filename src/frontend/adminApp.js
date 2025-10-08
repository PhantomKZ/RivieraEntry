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

function formatLang(lang){
  const code = (lang || '').toLowerCase();
  const map = { ru: { cls: 'flag-ru', label: 'RU' }, kz: { cls: 'flag-kz', label: 'KZ' }, en: { cls: 'flag-gb', label: 'EN' } };
  const item = map[code];
  if (!item) return (code ? code.toUpperCase() : '-');
  return `<span class="flag ${item.cls}" aria-hidden="true"></span> ${item.label}`;
}

function formatDestination(value, lang){
  const code = (value || '').toString();
  const language = (lang || 'ru').toLowerCase();
  const dictByLang = {
    ru: { admin: 'Администрация', sales: 'Коммерческий отдел', primary: 'Начальная школа', secondary: 'Средняя и старшая школа' },
    kz: { admin: 'Әкімшілік', sales: 'Коммерциялық бөлім', primary: 'Бастауыш мектеп', secondary: 'Орта және жоғары мектеп' },
    en: { admin: 'Administration', sales: 'Commercial department', primary: 'Primary school', secondary: 'Middle & high school' },
  };
  const dict = dictByLang[language] || dictByLang.ru;
  return dict[code] || code;
}

createApp({
  setup(){
    const token = ref('');
    const role = ref('');
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
          token.value = d.token; role.value = d.role || 'admin'; isAuthed.value = true;
          try { sessionStorage.setItem('riviera_auth', JSON.stringify({ token: token.value, role: role.value })); } catch {}
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
        .then(d => {
          items.value = d; page.value = 1;
          const ids = new Set(d.map(x => x.id));
          selectedIds.value = new Set([...selectedIds.value].filter(id => ids.has(id)));
        });
    }

    function exportCSV(){
      const headers = ['createdAt','fullName','destination','fromWhom','purpose','lang'];
      const rows = filtered.value.map(r => headers.map(h => {
        let val = r[h] ?? '';
        if (h === 'destination') val = formatDestination(r.destination, r.lang);
        if (h === 'purpose') val = formatPurpose(r.purpose, r.lang);
        val = val.toString().replaceAll('"','""');
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
        'Куда': formatDestination(r.destination, r.lang) || '',
        'От кого': r.fromWhom || '',
        'Цель': formatPurpose(r.purpose, r.lang),
        'Язык': (r.lang || '').toUpperCase(),
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Requests');
      XLSX.writeFile(wb, 'requests.xlsx');
    }

    function logout(){ token.value=''; role.value=''; isAuthed.value=false; try { sessionStorage.removeItem('riviera_auth'); } catch {} }

    const hasSelection = computed(() => selectedIds.value.size > 0);
    const allOnPageSelected = computed(() => slice.value.length > 0 && slice.value.every(r => selectedIds.value.has(r.id)));
    function toggleRow(id, ev){
      const next = new Set(selectedIds.value);
      if (ev.target.checked) next.add(id); else next.delete(id);
      selectedIds.value = next;
    }
    function toggleSelectAll(ev){
      if (ev.target.checked){
        const next = new Set(selectedIds.value);
        slice.value.forEach(r => next.add(r.id));
        selectedIds.value = next;
      } else {
        const next = new Set(selectedIds.value);
        slice.value.forEach(r => next.delete(r.id));
        selectedIds.value = next;
      }
    }
    async function deleteSelected(){
      const ids = [...selectedIds.value];
      if (!ids.length) return;
      if (!confirm('Удалить выбранные записи?')) return;
      for (const id of ids){
        await fetch('/api/requests/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token.value } });
      }
      selectedIds.value = new Set();
      load();
    }

    onMounted(() => {
      try {
        const raw = sessionStorage.getItem('riviera_auth');
        if (raw){ const parsed = JSON.parse(raw); token.value = parsed.token || ''; role.value = parsed.role || ''; if (token.value) { isAuthed.value = true; load(); } }
      } catch {}
    });

    return { token, role, isAuthed, login, password, doLogin, items, q, range, page, pageSize, pages, slice, load, exportCSV, exportXLSX, logout, formatDate, formatPurpose, formatLang, formatDestination, actionsOpen, selectedIds, hasSelection, allOnPageSelected, toggleRow, toggleSelectAll, deleteSelected };
  }
}).mount('#app');



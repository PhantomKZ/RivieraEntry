// admin logic: login, fetch, export, delete
const API = "/api";
const USERS = [
  { login: "admin", password: "admin", role: "admin" },
  { login: "reseption", password: "Riviera2025!", role: "reseption" }
];
const SECRET = process?.env?.SECRET || "riviera_secret";

function saveToken(token){ localStorage.setItem("riviera_token", token); }
function getToken(){ return localStorage.getItem("riviera_token"); }
function clearToken(){ localStorage.removeItem("riviera_token"); }

function showLoginError(show){ document.getElementById("loginError").style.display = show ? "block":"none"; }

async function loginRequest(login, password){
  const res = await fetch(API + "/login", {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify({ login, password })
  });
  return res.json();
}

function renderTable(data){
  const tbody = document.querySelector("#requestsTable tbody");
  tbody.innerHTML = "";
  data.forEach((r, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input class="row-chk" data-id="${idx}" type="checkbox"></td>
      <td>${r.createdAt || ""}</td>
      <td>${r.fullName || ""}</td>
      <td>${r.destination || ""}</td>
      <td>${r.fromWhom || ""}</td>
      <td>${r.purpose || ""}</td>
      <td>${r.lang || ""}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function loadRequests(){
  const token = getToken();
  if (!token) return;
  const res = await fetch(API + "/requests", { headers: { "Authorization":"Bearer "+token } });
  if (res.status === 401){ logout(); return; }
  const data = await res.json();
  renderTable(data);
  return data;
}

function enableButtonsForRole(role){
  const deleteBtn = document.getElementById("deleteSelectedBtn");
  if (role === "admin") deleteBtn.style.display = "inline-block"; else deleteBtn.style.display = "none";
}

function downloadCSV(data, filename){
  if (!data) data = [];
  const headers = ["createdAt","fullName","destination","fromWhom","purpose","lang"];
  const rows = data.map(r => headers.map(h => `"${(r[h]||"").toString().replace(/"/g,'""')}"`).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

function logout(){
  clearToken();
  document.getElementById("adminPanel").style.display = "none";
  document.getElementById("loginBox").style.display = "block";
}

document.addEventListener("DOMContentLoaded", () =>{
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const exportCsvBtn = document.getElementById("exportCsvBtn");
  const exportExcelBtn = document.getElementById("exportExcelBtn");
  const deleteBtn = document.getElementById("deleteSelectedBtn");
  const selectAll = document.getElementById("selectAll");

  loginBtn.addEventListener("click", async () =>{
    const login = document.getElementById("loginInput").value.trim();
    const pass = document.getElementById("passwordInput").value;
    const r = await loginRequest(login, pass);
    if (r && r.success){
      saveToken(r.token);
      document.getElementById("loginBox").style.display = "none";
      document.getElementById("adminPanel").style.display = "block";
      document.getElementById("roleLabel").textContent = r.role;
      enableButtonsForRole(r.role);
      await loadRequests();
    } else {
      showLoginError(true);
    }
  });

  logoutBtn.addEventListener("click", () => logout());

  exportCsvBtn.addEventListener("click", async () =>{
    const data = await loadRequests();
    downloadCSV(data, "requests.csv");
  });

  exportExcelBtn.addEventListener("click", async () =>{
    const data = await loadRequests();
    // simple Excel-compatible CSV with .xls extension
    downloadCSV(data, "requests.xls");
  });

  deleteBtn.addEventListener("click", async () =>{
    const chks = Array.from(document.querySelectorAll(".row-chk:checked"));
    if (!chks.length) return alert("Нет выбранных");
    const ids = chks.map(c => parseInt(c.dataset.id,10));
    const token = getToken();
    const res = await fetch("/api/requests/delete", {
      method: "POST",
      headers: { "Content-Type":"application/json", "Authorization":"Bearer "+token },
      body: JSON.stringify({ ids })
    });
    if (res.ok){ await loadRequests(); }
  });

  selectAll.addEventListener("change", ()=>{
    const checked = selectAll.checked;
    document.querySelectorAll(".row-chk").forEach(c=>c.checked = checked);
  });

  // if already logged in
  (async ()=>{
    const token = getToken();
    if (token){
      // try to load and display
      const res = await fetch("/api/validate", { headers: { "Authorization":"Bearer "+token } });
      if (res.ok){
        const j = await res.json();
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("adminPanel").style.display = "block";
        document.getElementById("roleLabel").textContent = j.role;
        enableButtonsForRole(j.role);
        await loadRequests();
      } else {
        clearToken();
      }
    }
  })();
});

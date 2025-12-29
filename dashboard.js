/* dashboard.js
   نسخة مدمجة: Dashboard كامل + Staff Password + Rank Permission + Logs
   مضاف: Kick Logs مدمج بدقة داخل openLogPage (لا حاجة لإلحاق كود خارجي)
*/

/* ===== rankValue mapping ===== */
const rankValue = {
  "CO": 1, "SCO": 2, "Sergeant": 3, "Lieutenant": 4, "Major": 5,
  "Captain": 6, "Superintendent": 7, "Staff Manager": 8, "Training Officer": 9,
  "Prison Administration": 10, "Game Administration": 11, "Senior Prison Administration": 12,
  "Chief Of Staff": 13, "Chief Executive Officer (CEO)": 14, "Assistant Warden": 15,
  "Warden": 16, "Player": 0
};
function getRankValue(name){ return rankValue[name] || 0; }

/* ===== Utilities ===== */
function escapeHtml(str){ if(!str) return ""; return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
function clearActive(){ document.querySelectorAll('.menu-item').forEach(el=>el.classList.remove('active')); }
function capitalize(s){ if(!s) return s; return s.charAt(0).toUpperCase()+s.slice(1); }

/* ===== initSidebar ===== */
function initSidebar(){
  const stored = localStorage.getItem("loggedUser");
  if(!stored) return;
  const user = JSON.parse(stored);
  const userRankVal = getRankValue(user.rank);
  const un = document.getElementById("sidebarUsername"), rk = document.getElementById("sidebarRank");
  if(un) un.textContent = user.username;
  if(rk) rk.textContent = user.rank;
  document.querySelectorAll('#mainMenu .menu-item, #mainMenu .sub-item').forEach(btn=>{
    const min = Number(btn.getAttribute('data-min-rank') || 1);
    btn.style.display = (userRankVal < min) ? 'none' : 'flex';
  });
  const firstVisible = document.querySelector('#mainMenu .menu-item:not([style*="display: none"])');
  if(firstVisible){ document.querySelectorAll('#mainMenu .menu-item').forEach(el=>el.classList.remove('active')); firstVisible.classList.add('active'); }
  const visibleItems = Array.from(document.querySelectorAll('#mainMenu .menu-item')).filter(el=>el.style.display!=='none');
  visibleItems.forEach((el, idx)=>{ el.tabIndex = 0; el.addEventListener('keydown', e=>{ if(e.key==='ArrowDown'){ e.preventDefault(); visibleItems[(idx+1)%visibleItems.length].focus(); } else if(e.key==='ArrowUp'){ e.preventDefault(); visibleItems[(idx-1+visibleItems.length)%visibleItems.length].focus(); } else if(e.key==='Enter'){ el.click(); } }); });
}

/* ===== Storage helpers: logs, staffPasswords, rankPermissions ===== */
function getLogs(){ return JSON.parse(localStorage.getItem('logs') || '[]'); }
function saveLogs(arr){ localStorage.setItem('logs', JSON.stringify(arr)); }

function getStaffPasswords(){ return JSON.parse(localStorage.getItem('staffPasswords') || '[]'); }
function saveStaffPasswords(arr){ localStorage.setItem('staffPasswords', JSON.stringify(arr)); }

function getRankPermissions(){ return JSON.parse(localStorage.getItem('rankPermissions') || '{}'); }
function saveRankPermissions(obj){ localStorage.setItem('rankPermissions', JSON.stringify(obj)); }

/* ===== pagesConfig (standard pages) ===== */
const pagesConfig = {
  search: { title:"Search", fields:[{id:"q",label:"Username Or User ID",type:"text",placeholder:"Write username or numeric ID",required:true}], submitLabel:"Search",
    onSubmit: function(values){ const result = document.getElementById("pageResult"); if(result) result.innerHTML = `<div class="user-card" onclick="openProfile('${escapeHtml(values.q)}')"><strong>${escapeHtml(values.q)}</strong><div>Click To Open Profile</div></div>`; }
  },

  ban: {
    title:"Ban",
    fields:[
      {id:"banUser",label:"Target Username",type:"text",placeholder:"Username Or ID",required:true},
      {id:"banReason",label:"Reason",type:"text",placeholder:"Short reason",required:true},
      {id:"banDuration",label:"Duration",type:"text",placeholder:"1s/1min/1h/1d/1w/1mon/1y (optional)",required:false}
    ],
    submitLabel:"Submit Ban",
    onSubmit:function(values){ submitAction("BAN",{target:values.banUser,reason:values.banReason,duration:values.banDuration},"Ban request created."); }
  },

  pban: { title:"P-Ban", fields:[{id:"pbanUser",label:"Target Username",type:"text",placeholder:"Username Or ID",required:true},{id:"pbanReason",label:"Reason",type:"text",placeholder:"Reason",required:true}], submitLabel:"Submit P-Ban",
    onSubmit:function(v){ submitAction("P-BAN",{target:v.pbanUser,reason:v.pbanReason},"P-Ban request created."); }
  },

  blacklist: { title:"Blacklist", fields:[{id:"blUser",label:"Target Username",type:"text",placeholder:"Username Or ID",required:true},{id:"blReason",label:"Reason",type:"text",placeholder:"Reason",required:true}], submitLabel:"Add To Blacklist",
    onSubmit:function(v){ submitAction("BLACKLIST",{target:v.blUser,reason:v.blReason},"Added to blacklist."); }
  },

  promote: { title:"Promote", fields:[{id:"promUser",label:"Target Username",type:"text",placeholder:"Username Or ID",required:true},{id:"promRank",label:"New Rank",type:"text",placeholder:"Exact Rank Name",required:true},{id:"promReason",label:"Reason",type:"text",placeholder:"Reason",required:false}], submitLabel:"Promote",
    onSubmit:function(v){ submitAction("PROMOTE",{target:v.promUser,newRank:v.promRank,reason:v.promReason},"Promotion requested."); }
  },

  demote: { title:"Demote", fields:[{id:"demUser",label:"Target Username",type:"text",placeholder:"Username Or ID",required:true},{id:"demRank",label:"New Rank",type:"text",placeholder:"Rank To Demote To",required:true},{id:"demReason",label:"Reason",type:"text",placeholder:"Reason",required:false}], submitLabel:"Demote",
    onSubmit:function(v){ submitAction("DEMOTE",{target:v.demUser,newRank:v.demRank,reason:v.demReason},"Demote requested."); }
  },

  kick: { title:"Kick", fields:[{id:"kickUser",label:"Target Username",type:"text",placeholder:"Username Or ID",required:true},{id:"kickReason",label:"Reason",type:"text",placeholder:"Reason",required:true}], submitLabel:"Kick",
    onSubmit:function(v){ submitAction("KICK",{target:v.kickUser,reason:v.kickReason},"Kick requested."); }
  },

  logs: { title:"Logs", fields:[], submitLabel:null, onSubmit:null }
};

/* ===== Rank Permission pages (Add / Remove) ===== */
pagesConfig["rank-permission-add"] = {
  title:"Rank Permission Add",
  fields:[{id:"rpaRank",label:"Rank Name",type:"text",placeholder:"Exact Rank Name",required:true},{id:"rpaPerms",label:"Permissions (comma)",type:"text",placeholder:"e.g. ban,kick,promote",required:true},{id:"rpaReason",label:"Reason",type:"text",placeholder:"Reason (optional)",required:false}],
  submitLabel:"Add Permissions",
  onSubmit:function(values){
    const rank = values.rpaRank.trim(); const perms = values.rpaPerms.split(',').map(s=>s.trim()).filter(Boolean);
    if(!rank || perms.length===0){ const out=document.getElementById("pageResult"); if(out) out.innerHTML=`<div class="form-result" style="color:#f87171">Please fill Rank and Permissions.</div>`; return; }
    const obj = getRankPermissions(); obj[rank] = Array.from(new Set([...(obj[rank]||[]), ...perms])); saveRankPermissions(obj);
    submitAction("RANK-PERM-ADD",{rank,perms,reason:values.rpaReason},"Rank permissions added."); renderRankPermissionsPreview(rank,'rankPermPreview');
  }
};

pagesConfig["rank-permission-remove"] = {
  title:"Rank Permission Remove",
  fields:[{id:"rprRank",label:"Rank Name",type:"text",placeholder:"Exact Rank Name",required:true},{id:"rprPerms",label:"Permissions To Remove (comma)",type:"text",placeholder:"e.g. ban,kick",required:true},{id:"rprReason",label:"Reason",type:"text",placeholder:"Reason (optional)",required:false}],
  submitLabel:"Remove Permissions",
  onSubmit:function(values){
    const rank = values.rprRank.trim(); const perms = values.rprPerms.split(',').map(s=>s.trim()).filter(Boolean);
    if(!rank || perms.length===0){ const out=document.getElementById("pageResult"); if(out) out.innerHTML=`<div class="form-result" style="color:#f87171">Please fill Rank and Permissions.</div>`; return; }
    const obj = getRankPermissions(); if(!obj[rank]) obj[rank] = []; obj[rank] = obj[rank].filter(p=>!perms.includes(p)); saveRankPermissions(obj);
    submitAction("RANK-PERM-REMOVE",{rank,perms,reason:values.rprReason},"Rank permissions removed."); renderRankPermissionsPreview(rank,'rankPermPreview');
  }
};

/* ===== Staff Password pages (Add / Remove) ===== */
pagesConfig["staff-password-add"] = {
  title:"Staff Password Add",
  fields:[{id:"spaUser",label:"Staff Username",type:"text",placeholder:"Staff Username",required:true},{id:"spaPass",label:"Password",type:"text",placeholder:"Password",required:true},{id:"spaReason",label:"Reason",type:"text",placeholder:"Reason (optional)",required:false}],
  submitLabel:"Add Staff Password",
  onSubmit:function(values){
    const by = (JSON.parse(localStorage.getItem("loggedUser"))||{}).username || 'Unknown';
    const arr = getStaffPasswords();
    arr.unshift({id:Date.now(), staff:values.spaUser, password:values.spaPass, addedBy:by, reason:values.spaReason||'', time:new Date().toISOString(), removed:false, removedBy:null, removedReason:null, removedTime:null});
    saveStaffPasswords(arr);
    submitAction("STAFF-PASSWORD-ADD",{staff:values.spaUser,password:values.spaPass,reason:values.spaReason},"Staff password added.");
    renderStaffAddList();
  }
};

pagesConfig["staff-password-remove"] = {
  title:"Staff Password Remove",
  fields:[{id:"sprTarget",label:"Target Username",type:"text",placeholder:"Staff Username To Remove (exact)",required:true},{id:"sprReason",label:"Reason",type:"text",placeholder:"Reason",required:true}],
  submitLabel:"Remove Password",
  onSubmit:function(values){
    const by = (JSON.parse(localStorage.getItem("loggedUser"))||{}).username || 'Unknown';
    const target = values.sprTarget; const arr = getStaffPasswords();
    let foundIndex = -1;
    for(let i=0;i<arr.length;i++){ if(arr[i].staff.toLowerCase() === String(target).toLowerCase() && !arr[i].removed){ foundIndex = i; break; } }
    if(foundIndex>=0){ arr[foundIndex].removed = true; arr[foundIndex].removedBy = by; arr[foundIndex].removedReason = values.sprReason||''; arr[foundIndex].removedTime = new Date().toISOString(); saveStaffPasswords(arr); submitAction("STAFF-PASSWORD-REMOVE",{target,reason:values.sprReason},"Staff password removed."); renderStaffRemoveList(); renderStaffAddList(); } else { const out=document.getElementById("pageResult"); if(out) out.innerHTML=`<div class="form-result" style="color:#f87171">No active password found for that username.</div>`; }
  }
};

/* ===== submitAction (save log + handle staff-password updates) ===== */
function submitAction(type, payload, message){
  const by = (JSON.parse(localStorage.getItem("loggedUser"))||{}).username || 'Unknown';
  const entry = { id: Date.now(), type, payload, by, time: new Date().toISOString() };
  const logs = getLogs(); logs.unshift(entry); saveLogs(logs);

  // special handling for staff-password add/remove already done in pages above, but keep safe hooks:
  if(type === 'STAFF-PASSWORD-ADD' || type === 'STAFF-PASSWORD-REMOVE'){ /* handled earlier */ }

  const out = document.getElementById("pageResult"); if(out) out.innerHTML = `<div class="form-result">${escapeHtml(message)}</div>`;

  // auto-refresh if viewing logs pages
  const titleEl = document.getElementById("pageTitle");
  if(titleEl && titleEl.textContent){
    const cur = titleEl.textContent.toLowerCase();
    if(cur === 'logs') renderLogs();
    else if(cur.includes(type.toLowerCase())) openLogPage(type.toLowerCase(), `${capitalize(type.toLowerCase())} Logs`);
  }
}

/* ===== Styles injection for logs & staff list (inject once) ===== */
(function setupLogsBoxStyle(){
  if(!document.getElementById('logs-box-style')){
    const s = document.createElement('style'); s.id = 'logs-box-style';
    s.innerHTML = `
      .logs-box { width:100%; min-height:56vh; max-height:72vh; overflow-y:auto; padding:16px; border-radius:10px;
                 background: rgba(255,255,255,0.01); border:1px solid rgba(255,255,255,0.03); box-sizing:border-box;
                 white-space: pre-wrap; word-break: break-word; font-family: monospace; font-size:13px; color:#dbeafe; }
      .logs-box .entry { padding:10px; margin-bottom:8px; background: rgba(0,0,0,0.25); border-radius:6px; border:1px solid rgba(255,255,255,0.02); }
      .logs-box .meta { color:#94a3b8; font-size:12px; margin-bottom:6px; }
      .logs-box .payload { color:#cbd5e1; font-size:13px; white-space:pre-wrap; }
      .staff-pass-list { margin-top:14px; display:flex; flex-direction:column; gap:10px; }
      .pass-entry { background: rgba(255,255,255,0.01); border:1px solid rgba(255,255,255,0.03); padding:12px; border-radius:8px; font-size:13px; color:#cbd5e1; }
      .pass-entry .top { display:flex; justify-content:space-between; gap:8px; align-items:center; margin-bottom:8px; }
      .pass-entry .meta { color:#94a3b8; font-size:12px; }
      .pass-entry .pwd { font-family:monospace; margin-top:6px; color:#dbeafe; background: rgba(0,0,0,0.05); padding:8px; border-radius:6px; word-break:break-all; }
      .pass-entry.removed { opacity:0.6; }
      .load-more-wrap { margin-top:10px; display:flex; justify-content:center; }
      .load-more-btn { padding:8px 12px; border-radius:8px; border:none; cursor:pointer; background:#2563eb; color:white; font-weight:700; }
    `;
    document.head.appendChild(s);
  }
})();

/* ===== openLogPage (generic) =====
   Special case: if logType === 'kick' we add summary + export button
*/
function openLogPage(logType, titleText){
  const area = document.getElementById("pageArea"); if(!area) return;
  const normalized = String(logType || '').toUpperCase();
  document.getElementById("pageTitle").innerText = titleText || `${capitalize(logType)} Logs`;

  // If kick -> include summary + export button; else generic search + box
  const isKick = (normalized === 'KICK');

  area.innerHTML = `
    <div class="page-center" style="padding:18px;">
      <div style="margin-bottom:12px;">
        <label style="color:#94a3b8; display:block; margin-bottom:6px;">Search Name Or User ID</label>
        <div style="display:flex; gap:8px; align-items:center;">
          <input id="logSearchInput" class="field-input" placeholder="Username or UserId" />
          <button class="button" id="logSearchBtn">Search</button>
          <button class="button" id="logClearBtn" style="background:#6b7280">Clear</button>
          ${isKick ? `<button class="button" id="kickExportBtn" style="margin-left:auto;background:#111827">Export JSON</button>` : ''}
        </div>
      </div>

      ${isKick ? `<div id="kickSummary" style="margin-bottom:12px;color:#cbd5e1;font-size:13px;"></div>` : ''}

      <div id="logsContainerWrapper">
        <div id="logsBox" class="logs-box"></div>
        <div class="load-more-wrap" id="loadMoreWrap" style="display:none;"><button class="load-more-btn" id="loadMoreBtn">Load More</button></div>
      </div>
    </div>
  `;

  // handlers
  const searchBtn = document.getElementById('logSearchBtn'), clearBtn = document.getElementById('logClearBtn');
  if(searchBtn) searchBtn.addEventListener('click', ()=>{ const q = document.getElementById('logSearchInput').value.trim(); renderLogsForType(normalized, q); });
  if(clearBtn) clearBtn.addEventListener('click', ()=>{ document.getElementById('logSearchInput').value=''; renderLogsForType(normalized, ''); });
  if(isKick){
    const exportBtn = document.getElementById('kickExportBtn'); if(exportBtn) exportBtn.addEventListener('click', exportKickLogs);
  }

  // initial render
  renderLogsForType(normalized, '');
}

/* ===== renderLogsForType ===== */
function renderLogsForType(typeUpper, searchTerm){
  const box = document.getElementById('logsBox'); const wrap = document.getElementById('loadMoreWrap'); if(!box) return;
  box.innerHTML = '';
  const logs = getLogs();
  const filtered = logs.filter(l => { if(!l.type) return false; if(l.type.toUpperCase() !== String(typeUpper).toUpperCase()) return false; if(!searchTerm) return true; const q = searchTerm.toLowerCase(); const p = JSON.stringify(l.payload).toLowerCase(); const by = String(l.by||'').toLowerCase(); return p.includes(q) || by.includes(q); });

  // special: if typeUpper === 'KICK' show summary
  if(String(typeUpper).toUpperCase() === 'KICK'){
    const summaryEl = document.getElementById('kickSummary');
    const kicks = filtered;
    const total = kicks.length;
    const targets = {}; kicks.forEach(k=>{ const t = String((k.payload && (k.payload.target||k.payload.user||k.payload.username))||'Unknown'); targets[t] = (targets[t]||0)+1; });
    const uniqueTargets = Object.keys(targets).length;
    const topTargets = Object.entries(targets).sort((a,b)=>b[1]-a[1]).slice(0,5);
    if(summaryEl) summaryEl.innerHTML = `<div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap"><div style="color:#94a3b8">Total Kicks: <strong style="color:#e5e7eb">${total}</strong></div><div style="color:#94a3b8">Unique Targets: <strong style="color:#e5e7eb">${uniqueTargets}</strong></div><div style="color:#94a3b8">Top Targets: <strong style="color:#e5e7eb">${topTargets.map(t=>escapeHtml(t[0])+' ('+t[1]+')').join(', ')||'—'}</strong></div></div>`;
  }

  if(filtered.length === 0){ if(wrap) wrap.style.display='none'; return; }

  filtered.forEach(entry => {
    const div = document.createElement('div'); div.className='entry';
    const meta = document.createElement('div'); meta.className='meta'; meta.textContent = `${entry.type} — ${entry.by} — ${new Date(entry.time).toLocaleString()}`;
    const payload = document.createElement('div'); payload.className='payload';
    try{ payload.textContent = JSON.stringify(entry.payload, null, 2); } catch(e){ payload.textContent = String(entry.payload||''); }
    div.appendChild(meta); div.appendChild(payload); box.appendChild(div);
  });

  if(filtered.length > 100){ if(wrap) wrap.style.display='flex'; const btn = document.getElementById('loadMoreBtn'); if(btn) btn.onclick = ()=>{ btn.style.display='none'; }; } else { if(wrap) wrap.style.display='none'; }

  box.scrollTop = 0;
}

/* ===== Export for Kick Logs (matches current search filter) ===== */
function exportKickLogs(){
  const searchEl = document.getElementById('logSearchInput'); const q = searchEl ? searchEl.value.trim() : '';
  const logs = getLogs(); let kicks = logs.filter(l=>String(l.type||'').toUpperCase()==='KICK');
  if(q){ const qq=q.toLowerCase(); kicks = kicks.filter(l=>{ const p=JSON.stringify(l.payload||{}).toLowerCase(); const by=String(l.by||'').toLowerCase(); return p.includes(qq) || by.includes(qq) || String(l.payload && (l.payload.target||'')).toLowerCase().includes(qq); }); }
  const blob = new Blob([JSON.stringify(kicks,null,2)],{type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download = `kick_logs_${new Date().toISOString().replace(/[:.]/g,'-')}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

/* ===== grouped renderLogs (general Logs page) ===== */
function renderLogs(){
  const area = document.getElementById("pageArea"); if(!area) return;
  area.innerHTML = `<div class="page-center" style="padding:18px;"><div id="logsBox" class="logs-box"></div><div class="load-more-wrap" id="loadMoreWrap" style="display:none;"><button class="load-more-btn" id="loadMoreBtn">Load More</button></div></div>`;
  const logs = getLogs(); const box = document.getElementById('logsBox'); if(!box) return; if(logs.length===0){ box.innerHTML=''; document.getElementById('loadMoreWrap').style.display='none'; return; }
  const groups = {}; logs.forEach(l=>{ const t = l.type || 'UNKNOWN'; if(!groups[t]) groups[t]=[]; groups[t].push(l); });
  Object.keys(groups).forEach(type => { const section = document.createElement('div'); section.className='type-section'; const title = document.createElement('div'); title.className='type-title'; title.textContent = `${type} Logs`; section.appendChild(title);
    groups[type].forEach(entry=>{ const div=document.createElement('div'); div.className='entry'; const meta=document.createElement('div'); meta.className='meta'; meta.textContent = `${entry.type} — ${entry.by} — ${new Date(entry.time).toLocaleString()}`; const payload=document.createElement('div'); payload.className='payload'; try{ payload.textContent = JSON.stringify(entry.payload,null,2); }catch(e){ payload.textContent = String(entry.payload); } div.appendChild(meta); div.appendChild(payload); section.appendChild(div); });
    box.appendChild(section);
  });
  if(logs.length>100) document.getElementById('loadMoreWrap').style.display='flex'; else document.getElementById('loadMoreWrap').style.display='none';
}

/* ===== Rank permissions preview helper ===== */
function renderRankPermissionsPreview(rankName, containerId){
  const container = document.getElementById(containerId); if(!container) return; container.innerHTML=''; if(!rankName) return;
  const obj = getRankPermissions(); const perms = obj[rankName] || [];
  if(perms.length===0){ container.innerHTML = `<div style="color:#94a3b8">No permissions set for "${escapeHtml(rankName)}".</div>`; return; }
  container.innerHTML = `<div style="color:#94a3b8; margin-bottom:8px">Current Permissions For "${escapeHtml(rankName)}":</div><div style="display:flex;gap:8px;flex-wrap:wrap">${perms.map(p=>`<div style="background:rgba(255,255,255,0.02);padding:6px 8px;border-radius:6px;font-size:13px">${escapeHtml(p)}</div>`).join('')}</div>`;
}

/* ===== Staff password lists helpers ===== */
function renderStaffAddList(){ const wrap = document.getElementById('staffPassAddList'); if(!wrap) return; wrap.innerHTML=''; const arr = getStaffPasswords().filter(i=>!i.removed); if(!arr.length) return; arr.forEach(item=>{ const div=document.createElement('div'); div.className='pass-entry'; div.innerHTML = `<div class="top"><div style="font-weight:700">${escapeHtml(item.staff)}</div><div class="meta">Added By: ${escapeHtml(item.addedBy||'')} — ${new Date(item.time).toLocaleString()}</div></div><div class="meta">${item.reason ? 'Reason: '+escapeHtml(item.reason):''}</div><div class="pwd">${escapeHtml(item.password||'')}</div>`; wrap.appendChild(div); }); }
function renderStaffRemoveList(){ const wrap = document.getElementById('staffPassRemoveList'); if(!wrap) return; wrap.innerHTML=''; const arr = getStaffPasswords().filter(i=>i.removed); if(!arr.length) return; arr.forEach(item=>{ const div=document.createElement('div'); div.className='pass-entry removed'; let removedMeta = `Removed By: ${escapeHtml(item.removedBy||'')} — ${item.removedTime ? new Date(item.removedTime).toLocaleString() : ''}`; div.innerHTML = `<div class="top"><div style="font-weight:700">${escapeHtml(item.staff)}</div><div class="meta" style="text-align:right;color:#f87171">Disabled</div></div><div class="meta">${item.reason ? 'Added Reason: '+escapeHtml(item.reason):''}</div><div class="meta" style="margin-top:6px">Removal: ${escapeHtml(item.removedReason||'')}</div><div class="pwd">${escapeHtml(item.password||'')}</div><div class="meta" style="margin-top:8px">${removedMeta}</div>`; wrap.appendChild(div); }); }

/* ===== renderForm (handles special pages) ===== */
function renderForm(pageKey){
  if(typeof pageKey === 'string' && pageKey.endsWith('-logs')){ const typeKey = pageKey.replace('-logs',''); openLogPage(typeKey, `${capitalize(typeKey)} Logs`); return; }
  const area = document.getElementById("pageArea"); if(!area) return;

  if(pageKey === 'staff-password'){
    area.innerHTML = `<div class="page-center" style="padding:18px;"><h2 style="margin-bottom:12px">Staff Password</h2><div style="display:flex; gap:12px; margin-bottom:12px;"><button class="button" onclick="showPage('staff-password-add')">Staff Password Add</button><button class="button" style="background:#ef4444" onclick="showPage('staff-password-remove')">Staff Password Remove</button></div><div id="staffPassListWrap"><div style="color:#94a3b8; margin-bottom:8px;">All Staff Passwords (including removed):</div><div id="staffPassList" class="staff-pass-list"></div></div></div>`;
    document.getElementById("pageTitle").textContent = "Staff Password";
    const wrap = document.getElementById('staffPassList'); wrap.innerHTML=''; const arr = getStaffPasswords(); arr.forEach(item=>{ const div=document.createElement('div'); div.className = 'pass-entry' + (item.removed ? ' removed' : ''); let removedMeta = item.removed ? `Removed By: ${escapeHtml(item.removedBy||'')} — ${item.removedTime? new Date(item.removedTime).toLocaleString():''}` : ''; div.innerHTML = `<div class="top"><div style="font-weight:700">${escapeHtml(item.staff)}</div><div class="meta">${item.removed ? '<span style="color:#f87171">Disabled</span>':'<span style="color:#34d399">Active</span>'}</div></div><div class="meta">${item.reason? 'Reason: '+escapeHtml(item.reason):''}</div><div class="pwd">${escapeHtml(item.password||'')}</div>${item.removed ? `<div class="meta" style="margin-top:8px">${removedMeta}</div>` : ''}`; wrap.appendChild(div); });
    return;
  }

  if(pageKey === 'rank-editor'){ area.innerHTML = `<div class="page-center" style="padding:18px;"><h2 style="margin-bottom:12px">Rank Permission</h2><div style="display:flex; gap:12px;"><button class="button" onclick="showPage('rank-permission-add')">Rank Permission Add</button><button class="button" style="background:#ef4444" onclick="showPage('rank-permission-remove')">Rank Permission Remove</button></div></div>`; document.getElementById("pageTitle").textContent="Rank Permission"; return; }

  const conf = pagesConfig[pageKey]; if(!conf) return;
  let html = `<div class="page-center">`;
  if(conf.fields.length>0){ conf.fields.forEach(f=>{ html += `<div class="form-field"><label class="field-label" for="${f.id}">${escapeHtml(f.label)}</label>`; if(f.type==='textarea') html += `<textarea id="${f.id}" class="field-input" placeholder="${escapeHtml(f.placeholder||'')}"></textarea>`; else html += `<input id="${f.id}" class="field-input" type="text" placeholder="${escapeHtml(f.placeholder||'')}" />`; html += `</div>`; }); }
  if(pageKey === 'rank-permission-add' || pageKey === 'rank-permission-remove') html += `<div id="rankPermPreview" style="margin-top:8px;"></div>`;
  html += `<div id="pageResult" class="form-result"></div>`;
  if(conf.submitLabel) html += `<div class="form-actions"><button class="button" id="pageSubmit">${escapeHtml(conf.submitLabel)}</button></div>`;
  if(pageKey === 'staff-password-add') html += `<div style="margin-top:14px;"><div style="color:#94a3b8; margin-bottom:8px;">Active Staff Passwords:</div><div id="staffPassAddList" class="staff-pass-list"></div></div>`;
  if(pageKey === 'staff-password-remove') html += `<div style="margin-top:14px;"><div style="color:#94a3b8; margin-bottom:8px;">Disabled Staff Passwords (Removed):</div><div id="staffPassRemoveList" class="staff-pass-list"></div></div>`;
  html += `</div>`;
  area.innerHTML = html;

  if(conf.submitLabel && conf.onSubmit){
    const btn = document.getElementById("pageSubmit");
    if(btn) btn.addEventListener('click', ()=>{ const values = {}; conf.fields.forEach(f=>{ const el=document.getElementById(f.id); values[f.id] = el ? el.value.trim() : ""; }); for(const f of conf.fields){ if(f.required && (!values[f.id] || values[f.id].length===0)){ const out=document.getElementById("pageResult"); out.innerHTML = `<div class="form-result" style="color:#f87171">Please fill: ${escapeHtml(f.label)}</div>`; return; } } conf.onSubmit(values); });
  }

  if(pageKey === 'rank-permission-add' || pageKey === 'rank-permission-remove'){
    const rankInputId = (pageKey === 'rank-permission-add') ? 'rpaRank' : 'rprRank';
    const rankInput = document.getElementById(rankInputId);
    if(rankInput){ rankInput.addEventListener('input', function(){ renderRankPermissionsPreview(this.value.trim(),'rankPermPreview'); }); renderRankPermissionsPreview(rankInput.value.trim(),'rankPermPreview'); }
  }
  if(pageKey === 'staff-password-add') renderStaffAddList();
  if(pageKey === 'staff-password-remove') renderStaffRemoveList();
}

/* ===== showPage wrapper ===== */
function showPage(page){
  clearActive();
  const el = document.querySelector(`.menu-item[onclick="showPage('${page}')"]`);
  if(el) el.classList.add('active');
  const titleEl = document.getElementById("pageTitle");
  if(titleEl){ const title = (pagesConfig[page] && pagesConfig[page].title) || (page.endsWith('-logs') ? `${capitalize(page.replace('-logs',''))} Logs` : capitalize(page)); titleEl.textContent = title; }
  renderForm(page);
}

/* ===== openProfile (unchanged) ===== */
function openProfile(name){
  const area = document.getElementById("pageArea"); if(!area) return;
  document.getElementById("pageTitle").textContent = "Profile";
  area.innerHTML = `<div class="page-center"><div class="log-item"><strong>${escapeHtml(name)}</strong><div>Rank: Prisoner (Example)</div></div><div style="margin-top:12px; display:flex; gap:8px;"><button class="action-btn btn-kick" onclick="submitAction('KICK',{target:'${escapeHtml(name)}',reason:'Manual'},'Kick queued')">Kick</button><button class="action-btn btn-ban" onclick="submitAction('BAN',{target:'${escapeHtml(name)}',reason:'Manual'},'Ban queued')">Ban</button><button class="action-btn btn-promote" onclick="submitAction('PROMOTE',{target:'${escapeHtml(name)}',newRank:'Captain'},'Promote queued')">Promote</button></div></div>`;
}

/* ===== appendExternal helpers ===== */
function appendExternalLog(entry){ if(!entry || !entry.type) return; const e={id:entry.id||Date.now(), type:String(entry.type).toUpperCase(), payload:entry.payload||{}, by:entry.by||'External', time:entry.time||new Date().toISOString()}; const logs = getLogs(); logs.unshift(e); saveLogs(logs); const title = document.getElementById('pageTitle'); if(title){ const cur = title.textContent.toLowerCase(); if(cur === 'logs') renderLogs(); else if(cur.includes(e.type.toLowerCase())) openLogPage(e.type.toLowerCase(), `${capitalize(e.type.toLowerCase())} Logs`); } }
function appendExternalStaffPass(entry){ if(!entry || !entry.staff) return; const arr = getStaffPasswords(); arr.unshift({id:entry.id||Date.now(), staff:entry.staff, password:entry.password||'', addedBy:entry.addedBy||'External', reason:entry.reason||'', time:entry.time||new Date().toISOString(), removed:false, removedBy:null, removedReason:null, removedTime:null}); saveStaffPasswords(arr); const title = document.getElementById('pageTitle'); if(title && title.textContent && title.textContent.toLowerCase().includes('staff password')){ renderStaffAddList(); renderStaffRemoveList(); } }

/* ===== logout ===== */
function logout(){ localStorage.removeItem("loggedUser"); window.location.href = "index.html"; }

/* ===== storage listener: refresh views on external changes (optional) ===== */
window.addEventListener('storage', function(e){ if(e.key === 'logs'){ const title = document.getElementById('pageTitle'); if(title && title.textContent && title.textContent.toLowerCase().includes('kick logs')){ const qel = document.getElementById('logSearchInput'); const q = qel ? qel.value.trim() : ''; renderLogsForType('KICK', q); } } });

/* ===== Initialize on DOM ready ===== */
if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', ()=>{ initSidebar(); showPage('search'); }); } else { initSidebar(); showPage('search'); }
/* ===== SAFE PATCH: Add Kick Logs sub-item under Kick, match Kick visuals, hide Export JSON ===== */
(function addAndTuneKickLogs(){
  try {
    // find the menu container (try common ids/classes)
    let mainMenu = document.getElementById('mainMenu') || document.querySelector('.menu') || document.querySelector('.sidebar .menu');
    if(!mainMenu){
      console.warn('[addAndTuneKickLogs] main menu (.menu or #mainMenu) not found.');
      return;
    }

    // helper to normalize text
    const text = el => (el && el.textContent || '').trim().toLowerCase();

    // find Kick button (prefer one that calls showPage('kick') or exact text match)
    let kickEl = Array.from(mainMenu.querySelectorAll('.menu-item, .sub-item, button, [role="button"]')).find(el=>{
      const on = (el.getAttribute && (el.getAttribute('onclick') || '')) || '';
      if(on.includes("showPage('kick')") || on.includes('showPage("kick")')) return true;
      const t = text(el);
      if(t === 'kick' || t.startsWith('kick ')) return true;
      return false;
    });

    if(!kickEl){
      console.warn('[addAndTuneKickLogs] Kick element not found automatically. Looking for any element containing "kick"...');
      kickEl = Array.from(mainMenu.querySelectorAll('.menu-item, .sub-item, button')).find(el => text(el).includes('kick'));
    }

    if(!kickEl){
      console.warn('[addAndTuneKickLogs] Still could not find Kick element. Aborting addition.');
      return;
    }

    // check if Kick Logs already exists (avoid duplicates)
    const exists = Array.from(mainMenu.querySelectorAll('.menu-item, .sub-item, button'))
      .some(el => (el.textContent || '').trim().toLowerCase() === 'kick logs');
    if(exists){
      // still ensure Export hidden and style tuned
      hideExportJsonButtons();
      matchStyleToKick();
      console.log('[addAndTuneKickLogs] Kick Logs already present — ensured styling & export hidden.');
      return;
    }

    // create new button
    const sub = document.createElement('button');
    sub.type = 'button';
    sub.textContent = 'Kick Logs';
    // make it act like other menu items
    sub.className = 'menu-item'; // use menu-item so it participates in active/visibility logic
    // copy parent's data-min-rank if any to maintain visibility rules
    const min = kickEl.getAttribute && kickEl.getAttribute('data-min-rank');
    if(min) sub.setAttribute('data-min-rank', min);

    // clicking opens the logs page (renderForm handles '-logs' specially)
    sub.setAttribute('onclick', "showPage('kick-logs')");

    // insert after the Kick element
    kickEl.parentNode.insertBefore(sub, kickEl.nextSibling);

    // style-match: copy key computed styles from kickEl to sub to match visuals
    function matchStyleToKick(){
      try {
        const cs = window.getComputedStyle(kickEl);
        // copy key visual properties
        const props = ['color','fontWeight','fontSize','paddingTop','paddingBottom','paddingLeft','paddingRight','backgroundColor','borderRadius','display','alignItems','gap','textAlign'];
        props.forEach(p=>{
          try{
            const v = cs.getPropertyValue(p);
            if(v) sub.style.setProperty(p, v);
          }catch(e){}
        });
        // ensure it's visible (override any .sub-item hiding)
        sub.style.removeProperty('display');
        sub.style.cursor = 'pointer';
      } catch(e){
        // ignore silently if computed style fails
      }
    }
    matchStyleToKick();

    // visibility rules: re-run initSidebar if present to apply data-min-rank logic
    if(typeof initSidebar === 'function') initSidebar();

    // Hide any Export JSON buttons (immediate) and install observer to hide future ones
    function hideExportJsonButtons(){
      // immediate pass: hide elements with id kickExportBtn or exact text "Export JSON"
      const byId = document.querySelectorAll('#kickExportBtn');
      byId.forEach(b => { b.style.display = 'none'; });
      document.querySelectorAll('button, a').forEach(el=>{
        if((el.textContent||'').trim().toLowerCase() === 'export json') el.style.display = 'none';
      });
    }
    hideExportJsonButtons();

    // inject CSS rule to hide known id
    if(!document.getElementById('hide-kick-export-style')){
      const s = document.createElement('style');
      s.id = 'hide-kick-export-style';
      s.innerHTML = `
        #kickExportBtn { display: none !important; }
        button.export-json, .export-json-btn { display: none !important; }
      `;
      document.head.appendChild(s);
    }

    // MutationObserver: hide any newly added Export JSON buttons
    const mo = new MutationObserver((mutations)=>{
      mutations.forEach(m=>{
        if(!m.addedNodes) return;
        m.addedNodes.forEach(node=>{
          try {
            if(!(node instanceof HTMLElement)) return;
            if((node.textContent||'').trim().toLowerCase() === 'export json'){
              node.style.display = 'none';
            }
            // also check within node subtree
            node.querySelectorAll && node.querySelectorAll('button, a').forEach(el=>{
              if((el.textContent||'').trim().toLowerCase() === 'export json') el.style.display='none';
            });
          } catch(e){}
        });
      });
    });
    mo.observe(document.body, { childList:true, subtree:true });

    console.log('[addAndTuneKickLogs] Kick Logs added under Kick, styled to match, export hidden.');
  } catch(err){
    console.error('[addAndTuneKickLogs] Error:', err);
  }
})();


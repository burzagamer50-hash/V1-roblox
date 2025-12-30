/* ===============================
   RANK SYSTEM
=============================== */
const RANKS = {
  "Trial Mod": 1,
  "Moderator": 3,
  "Senior Moderator": 5,
  "Admin": 7,
  "Senior Admin": 9,
  "Staff Manager": 10,
  "Chief Of Staff": 13,
  "CEO": 14
};

const rankValue = r => RANKS[r] || 0;

/* ===============================
   INIT
=============================== */
document.addEventListener("DOMContentLoaded", () => {
  const user = App.loadUser();
  if (!user) {
    location.href = "index.html";
    return;
  }

  document.getElementById("sidebarUsername").textContent = user.username;
  document.getElementById("sidebarRank").textContent = user.rank;

  applyPermissions(user.rank);
});

/* ===============================
   PERMISSIONS
=============================== */
function applyPermissions(rank) {
  const value = rankValue(rank);
  document.querySelectorAll("[data-min-rank]").forEach(el => {
    el.style.display = value >= Number(el.dataset.minRank) ? "flex" : "none";
  });
}

/* ===============================
   ROUTER
=============================== */
function showPage(page) {
  document.getElementById("pageTitle").textContent =
    page.replace(/-/g, " ").toUpperCase();

  document.getElementById("pageArea").innerHTML = buildPage(page);
}

/* ===============================
   PAGE BUILDER
=============================== */
function buildPage(page) {
  switch (page) {

    case "ban":
      return banPage();

    case "pban":
      return permanentBanPage();

    case "blacklist":
      return blacklistPage();

    case "kick":
      return kickPage();

    case "promote":
      return promoteDemotePage(false);

    case "demote":
      return promoteDemotePage(true);

    case "search":
      return simplePage("Search Player", "Search system coming soon");

    case "ban-logs":
      return logsPage("Ban Logs");

    case "promote-logs":
      return logsPage("Promote Logs");

    case "demote-logs":
      return logsPage("Demote Logs");

    case "chat-logs":
      return logsPage("Chat Logs");

    default:
      return `<p>Page not found</p>`;
  }
}

/* ===============================
   PAGES
=============================== */

function banPage() {
  return `
  <div class="page-center">
    <h2>Ban Player</h2>

    <div class="form-field">
      <label>Username</label>
      <input id="targetUser" class="field-input">
    </div>

    <div class="form-field">
      <label>Duration (ex: 10s, 3min, 2h)</label>
      <input id="duration" class="field-input">
    </div>

    <div class="form-field">
      <label>Reason</label>
      <input id="reason" class="field-input">
    </div>

    <button class="action-btn btn-ban" onclick="sendAction('ban')">
      Ban
    </button>

    <div id="actionResult"></div>
  </div>`;
}

function permanentBanPage() {
  return `
  <div class="page-center">
    <h2>Permanent Ban</h2>

    <div class="form-field">
      <label>Username</label>
      <input id="targetUser" class="field-input">
    </div>

    <div class="form-field">
      <label>Reason</label>
      <input id="reason" class="field-input">
    </div>

    <button class="action-btn btn-ban" onclick="sendAction('pban')">
      Permanent Ban
    </button>

    <div id="actionResult"></div>
  </div>`;
}

function blacklistPage() {
  return `
  <div class="page-center">
    <h2>Blacklist Player</h2>

    <div class="form-field">
      <label>Username</label>
      <input id="targetUser" class="field-input">
    </div>

    <div class="form-field">
      <label>Reason</label>
      <input id="reason" class="field-input">
    </div>

    <button class="action-btn btn-ban" onclick="sendAction('blacklist')">
      Blacklist
    </button>

    <div id="actionResult"></div>
  </div>`;
}

function kickPage() {
  return `
  <div class="page-center">
    <h2>Kick Player</h2>

    <div class="form-field">
      <label>Username</label>
      <input id="targetUser" class="field-input">
    </div>

    <div class="form-field">
      <label>Reason</label>
      <input id="reason" class="field-input">
    </div>

    <button class="action-btn btn-kick" onclick="sendAction('kick')">
      Kick
    </button>

    <div id="actionResult"></div>
  </div>`;
}

function promoteDemotePage(isDemote) {
  return `
  <div class="page-center">
    <h2>${isDemote ? "Demote Staff" : "Promote Staff"}</h2>

    <div class="form-field">
      <label>Username</label>
      <input id="targetUser" class="field-input">
    </div>

    <div class="form-field">
      <label>New Rank</label>
      <input id="rank" class="field-input">
    </div>

    <div class="form-field">
      <label>Reason</label>
      <input id="reason" class="field-input">
    </div>

    <button class="action-btn btn-promote"
      onclick="sendAction('${isDemote ? "demote" : "promote"}')">
      Confirm
    </button>

    <div id="actionResult"></div>
  </div>`;
}

function logsPage(title) {
  return `
  <div class="page-center">
    <h2>${title}</h2>
    <div class="logs-box">
      Logs will come from Roblox
    </div>
  </div>`;
}

function simplePage(title, text) {
  return `
  <div class="page-center">
    <h2>${title}</h2>
    <p>${text}</p>
  </div>`;
}

/* ===============================
   SEND ACTION
=============================== */
function sendAction(type) {
  fetch("https://js-2-6f3k.onrender.com/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "مرحبا من الموقع",
      action: type
    })
  });

  document.getElementById("actionResult").textContent =
    "تم إرسال رسالة اختبار";
}



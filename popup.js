var usernameInput = document.getElementById('usernameInput');
var passwordInput = document.getElementById('passwordInput');
var saveBtn       = document.getElementById('saveBtn');
var clearBtn      = document.getElementById('clearBtn');
var togglePw      = document.getElementById('togglePw');
var statusDot     = document.getElementById('statusDot');
var statusText    = document.getElementById('statusText');
var toast         = document.getElementById('toast');
var roleButtons   = document.querySelectorAll('.role-btn');
var enableToggle  = document.getElementById('enableToggle');
var toggleRow     = document.getElementById('toggleRow');
var toggleLabel   = document.getElementById('toggleLabel');
var toggleSub     = document.getElementById('toggleSub');

var selectedRole = 'student';

/* ── Toggle on/off ── */
function applyToggleUI(enabled) {
  if (enabled) {
    toggleRow.classList.remove('off');
    toggleLabel.textContent = 'Auto-Login Enabled';
    toggleSub.textContent   = 'Extension is active';
  } else {
    toggleRow.classList.add('off');
    toggleLabel.textContent = 'Auto-Login Disabled';
    toggleSub.textContent   = 'Click to turn on';
  }
}

enableToggle.addEventListener('change', function () {
  var enabled = enableToggle.checked;
  chrome.storage.local.set({ vtop_enabled: enabled }, function () {
    applyToggleUI(enabled);
    if (enabled) {
      showToast('success', '✓ Auto-login is now ON');
    } else {
      showToast('error', '✕ Auto-login is now OFF');
    }
  });
});

/* ── Role button logic ── */
roleButtons.forEach(function(btn) {
  btn.addEventListener('click', function() {
    selectedRole = btn.dataset.role;
    roleButtons.forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
  });
});

/* ── Load saved settings ── */
chrome.storage.local.get(['vtop_username','vtop_password','vtop_role','vtop_enabled'], function(r) {
  if (r.vtop_username) usernameInput.value = r.vtop_username;
  if (r.vtop_password) passwordInput.value = r.vtop_password;

  var role = r.vtop_role || 'student';
  selectedRole = role;
  roleButtons.forEach(function(b) {
    if (b.dataset.role === role) b.classList.add('active');
  });

  // Default enabled = true if not set
  var enabled = (r.vtop_enabled === undefined) ? true : r.vtop_enabled;
  enableToggle.checked = enabled;
  applyToggleUI(enabled);

  if (r.vtop_username && r.vtop_password) {
    var roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
    setStatus('saved', '✓ Ready · ' + roleLabel + ' · ' + r.vtop_username);
  } else {
    setStatus('empty', 'Enter your credentials to begin');
  }
});

/* ── Save ── */
saveBtn.addEventListener('click', function() {
  var u = usernameInput.value.trim();
  var p = passwordInput.value;
  if (!u || !p) { showToast('error', '⚠ Enter username and password.'); return; }

  chrome.storage.local.set({ vtop_username: u, vtop_password: p, vtop_role: selectedRole }, function() {
    var roleLabel = selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1);
    setStatus('saved', '✓ Ready · ' + roleLabel + ' · ' + u);
    showToast('success', '✓ Saved! Auto-login active as ' + roleLabel + '.');
  });
});

/* ── Clear ── */
clearBtn.addEventListener('click', function() {
  chrome.storage.local.remove(['vtop_username','vtop_password','vtop_role'], function() {
    usernameInput.value = ''; passwordInput.value = '';
    roleButtons.forEach(function(b) { b.classList.remove('active'); });
    document.querySelector('[data-role="student"]').classList.add('active');
    selectedRole = 'student';
    setStatus('empty', 'Credentials cleared.');
    showToast('error', '✕ All data removed.');
  });
});

/* ── Toggle password ── */
var pwVis = false;
togglePw.addEventListener('click', function() {
  pwVis = !pwVis;
  passwordInput.type = pwVis ? 'text' : 'password';
  togglePw.textContent = pwVis ? '🙈' : '👁';
});

/* ── Helpers ── */
function setStatus(type, msg) {
  statusDot.className = 'dot ' + type;
  statusText.textContent = msg;
}
var tt;
function showToast(type, msg) {
  toast.className = 'toast ' + type;
  toast.textContent = msg;
  clearTimeout(tt);
  tt = setTimeout(function() { toast.className = 'toast'; }, 3000);
}

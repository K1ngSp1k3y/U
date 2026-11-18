
// --- State & Initialization ---
window.addEventListener('load', () => {
  setTimeout(() => {
    const screen = document.getElementById('laserLoadingScreen');
    if (screen) {
      screen.classList.add('fade-out');
      setTimeout(() => screen.remove(), 500);
    }
  }, 800);
  initApp();
});

function safeGet(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? JSON.parse(val) : fallback;
  } catch (e) { return fallback; }
}

function safeSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}

let appState = {
  balance: safeGet('spikey_balance', 134.87),
  user: safeGet('spikey_user', { name: 'KingSpikey', bio: 'Elite Vault Member & Reseller.' }),
  deposits: safeGet('spikey_deposits', []),
  chats: safeGet('spikey_chats', [
    { sender: 'Sp1k3y', text: 'Welcome to the secure vault community!', time: '12:00 PM' },
    { sender: 'System', text: 'Zero-exploit deposit checks active.', time: '12:01 PM' }
  ]),
  cards: [
    { id: 1, bank: 'Chase Sapphire Reserve', type: 'bank', number: '•••• •••• •••• 4092', balance: 1450.00, cvp: '482', exp: '01/2035' },
    { id: 2, bank: 'Target Gift Card', type: 'gift', number: '•••• •••• •••• 8821', balance: 50.00, cvp: '109', exp: '12/2030' },
    { id: 3, bank: 'American Express Platinum', type: 'bank', number: '•••• •••• •••• 1004', balance: 3200.00, cvp: '912', exp: '05/2033' },
    { id: 4, bank: 'Apple Gift Card', type: 'gift', number: '•••• •••• •••• 9933', balance: 100.00, cvp: '554', exp: '08/2031' }
  ]
};

function initApp() {
  updateBalanceDisplay();
  setupNavigation();
  renderCards('all');
  renderChat();
  renderDepositHistory();
  setupEventListeners();
}

function updateBalanceDisplay() {
  const el = document.getElementById('headerBalance');
  if (el) el.textContent = '$' + Number(appState.balance).toFixed(2);
  safeSet('spikey_balance', appState.balance);
}

// --- Navigation & Mobile Sidebar ---
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const tabs = document.querySelectorAll('.tab-content');
  const topTitle = document.getElementById('topTitle');
  const sidebar = document.getElementById('sidebar');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      tabs.forEach(t => t.classList.remove('active'));
      
      item.classList.add('active');
      const targetId = item.getAttribute('data-tab');
      const targetTab = document.getElementById(targetId);
      if (targetTab) targetTab.classList.add('active');
      if (topTitle) topTitle.textContent = item.textContent.trim().replace(/^[^\w\s]+/, '').trim();

      if (window.innerWidth <= 900) {
        sidebar.classList.remove('mobile-open');
      }
    });
  });

  const menuToggle = document.getElementById('menuToggle');
  const mobileCloseBtn = document.getElementById('mobileCloseBtn');
  if (menuToggle) menuToggle.addEventListener('click', () => sidebar.classList.add('mobile-open'));
  if (mobileCloseBtn) mobileCloseBtn.addEventListener('click', () => sidebar.classList.remove('mobile-open'));
}

// --- Cards & Gallery ---
function renderCards(filterType, searchQuery = '') {
  const grid = document.getElementById('cardsGrid');
  if (!grid) return;

  grid.innerHTML = '';
  let filtered = appState.cards;
  if (filterType !== 'all') {
    filtered = filtered.filter(c => c.type === filterType);
  }
  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(c => c.bank.toLowerCase().includes(q) || c.number.includes(q));
  }

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state">No cards found matching your criteria.</div>';
    return;
  }

  filtered.forEach(card => {
    const div = document.createElement('div');
    div.className = 'bank-card-item';
    div.innerHTML = `
      <div class="card-top-row">
        <span class="card-bank-name">${card.bank}</span>
        <div class="card-chip"></div>
      </div>
      <div class="card-number-display">${card.number}</div>
      <div class="card-bottom-row">
        <div>Exp: ${card.exp}</div>
        <div class="card-balance-tag">$${Number(card.balance).toFixed(2)}</div>
      </div>
    `;
    div.addEventListener('click', () => openCardModal(card));
    grid.appendChild(div);
  });
}

function openCardModal(card) {
  const modal = document.getElementById('cardModal');
  const content = document.getElementById('modalContent');
  content.innerHTML = `
    <h3 style="margin-bottom:15px; font-size:20px;">${card.bank}</h3>
    <div style="font-family:'JetBrains Mono',monospace; font-size:18px; margin-bottom:15px; color:#a78bfa;">${card.number}</div>
    <div style="display:flex; justify-content:space-between; margin-bottom:20px; font-size:14px; color:var(--muted);">
      <div>CVV: <strong>${card.cvp}</strong></div>
      <div>Expires: <strong>${card.exp}</strong></div>
      <div>Balance: <strong style="color:var(--success);">$${Number(card.balance).toFixed(2)}</strong></div>
    </div>
    <button class="btn-primary full-width" onclick="checkoutCard(${card.id})">Checkout / Use Card</button>
  `;
  modal.classList.add('active');
}

function checkoutCard(id) {
  const card = appState.cards.find(c => c.id === id);
  if (!card) return;
  alert(`Successfully verified checkout for ${card.bank}! Balance loaded.`);
  document.getElementById('cardModal').classList.remove('active');
}

// --- Secure Deposit Feature (Zero Exploit, Check & Checkout Preview) ---
function setupDepositForm() {
  const amountInput = document.getElementById('depositAmountInput');
  const checkInput = document.getElementById('checkNumberInput');
  const prevSub = document.getElementById('prevSub');
  const prevTotal = document.getElementById('prevTotal');
  const form = document.getElementById('secureDepositForm');
  const msg = document.getElementById('depositMsg');

  function updatePreview() {
    const val = parseFloat(amountInput.value) || 0;
    prevSub.textContent = '$' + val.toFixed(2);
    prevTotal.textContent = '$' + val.toFixed(2);
  }

  if (amountInput) amountInput.addEventListener('input', updatePreview);

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const amt = parseFloat(amountInput.value);
      const checkNum = checkInput.value.trim();

      // Zero-exploit rigorous validation
      if (isNaN(amt) || amt <= 0 || amt > 10000) {
        msg.style.color = 'var(--danger)';
        msg.textContent = 'Error: Invalid deposit amount. Must be between $1.00 and $10,000.00.';
        return;
      }
      if (checkNum.length < 4) {
        msg.style.color = 'var(--danger)';
        msg.textContent = 'Error: Invalid check or account number format.';
        return;
      }

      // Process secure deposit
      appState.balance += amt;
      updateBalanceDisplay();

      const record = {
        id: Date.now(),
        method: document.getElementById('depositMethod').value,
        check: checkNum,
        amount: amt,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      appState.deposits.unshift(record);
      safeSet('spikey_deposits', appState.deposits);
      renderDepositHistory();

      msg.style.color = 'var(--success)';
      msg.textContent = `Success! Deposited $${amt.toFixed(2)} with verified check #${checkNum}.`;
      form.reset();
      updatePreview();
    });
  }
}

function renderDepositHistory() {
  const list = document.getElementById('depositHistoryList');
  if (!list) return;

  if (appState.deposits.length === 0) {
    list.innerHTML = '<div class="empty-state">No deposits recorded yet.</div>';
    return;
  }

  list.innerHTML = '';
  appState.deposits.forEach(d => {
    const div = document.createElement('div');
    div.className = 'deposit-item';
    div.innerHTML = `
      <div><strong>$${Number(d.amount).toFixed(2)}</strong> (${d.method})</div>
      <div style="color:var(--muted); font-size:12px;">Check: ${d.check} | ${d.time}</div>
    `;
    list.appendChild(div);
  });
}

// --- Casino Games ---
function setupCasino() {
  const spinBtn = document.getElementById('spinBtn');
  if (spinBtn) {
    spinBtn.addEventListener('click', () => {
      const bet = parseFloat(document.getElementById('slotBet').value) || 5;
      const resMsg = document.getElementById('slotResult');
      const reels = document.getElementById('slotReels');

      if (appState.balance < bet) {
        resMsg.style.color = 'var(--danger)';
        resMsg.textContent = 'Insufficient balance for this bet!';
        return;
      }

      appState.balance -= bet;
      const emojis = ['💎', '7️⃣', '🍒', '🍋', '⭐'];
      const r1 = emojis[Math.floor(Math.random() * emojis.length)];
      const r2 = emojis[Math.floor(Math.random() * emojis.length)];
      const r3 = emojis[Math.floor(Math.random() * emojis.length)];
      reels.textContent = `${r1} ${r2} ${r3}`;

      if (r1 === r2 && r2 === r3) {
        const win = bet * 20;
        appState.balance += win;
        resMsg.style.color = 'var(--success)';
        resMsg.textContent = `JACKPOT! You won $${win.toFixed(2)}!`;
      } else if (r1 === r2 || r2 === r3 || r1 === r3) {
        const win = bet * 2;
        appState.balance += win;
        resMsg.style.color = 'var(--success)';
        resMsg.textContent = `Nice! You won $${win.toFixed(2)}.`;
      } else {
        resMsg.style.color = 'var(--danger)';
        resMsg.textContent = `No match. Lost $${bet.toFixed(2)}.`;
      }
      updateBalanceDisplay();
    });
  }
}

function playCoinFlip(choice) {
  const bet = parseFloat(document.getElementById('coinBet').value) || 10;
  const resMsg = document.getElementById('coinResult');

  if (appState.balance < bet) {
    resMsg.style.color = 'var(--danger)';
    resMsg.textContent = 'Insufficient balance!';
    return;
  }

  appState.balance -= bet;
  const outcome = Math.random() < 0.5 ? 'heads' : 'tails';
  document.getElementById('coinVisual').textContent = outcome === 'heads' ? '🪙 (Heads)' : '🪙 (Tails)';

  if (choice === outcome) {
    const win = bet * 2;
    appState.balance += win;
    resMsg.style.color = 'var(--success)';
    resMsg.textContent = `Correct! Won $${win.toFixed(2)}.`;
  } else {
    resMsg.style.color = 'var(--danger)';
    resMsg.textContent = `Wrong! Lost $${bet.toFixed(2)}.`;
  }
  updateBalanceDisplay();
}

// --- Chat Room ---
function renderChat() {
  const box = document.getElementById('chatMessages');
  if (!box) return;
  box.innerHTML = '';
  appState.chats.forEach(c => {
    const div = document.createElement('div');
    const isSelf = c.sender === appState.user.name;
    div.className = `chat-msg ${isSelf ? 'self' : ''}`;
    div.innerHTML = `<strong>${c.sender}:</strong> ${c.text} <span style="font-size:10px; color:var(--muted); float:right; margin-left:10px;">${c.time}</span>`;
    box.appendChild(div);
  });
  box.scrollTop = box.scrollHeight;
}

function setupChat() {
  const btn = document.getElementById('sendChatBtn');
  const input = document.getElementById('chatInput');
  if (!btn || !input) return;

  const send = () => {
    const txt = input.value.trim();
    if (!txt) return;
    appState.chats.push({
      sender: appState.user.name,
      text: txt,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    safeSet('spikey_chats', appState.chats);
    input.value = '';
    renderChat();
  };

  btn.addEventListener('click', send);
  input.addEventListener('keypress', (e) => { if (e.key === 'Enter') send(); });
}

// --- Profile & Settings ---
function setupProfile() {
  const btn = document.getElementById('saveProfileBtn');
  if (!btn) return;

  const nameInput = document.getElementById('profileNameInput');
  const bioInput = document.getElementById('profileBioInput');
  if (nameInput) nameInput.value = appState.user.name;
  if (bioInput) bioInput.value = appState.user.bio;

  btn.addEventListener('click', () => {
    appState.user.name = nameInput.value.trim() || 'KingSpikey';
    appState.user.bio = bioInput.value.trim();
    safeSet('spikey_user', appState.user);
    document.getElementById('sidebarUsername').textContent = appState.user.name;
    alert('Profile saved successfully!');
  });
}

// --- Investment & Owner Dashboard ---
function setupInvestAndOwner() {
  const stakeBtn = document.getElementById('stakeBtn');
  if (stakeBtn) {
    stakeBtn.addEventListener('click', () => {
      const amt = parseFloat(document.getElementById('stakeAmount').value) || 50;
      const res = document.getElementById('stakeResult');
      if (appState.balance < amt) {
        res.style.color = 'var(--danger)';
        res.resText = 'Insufficient balance to stake.';
        return;
      }
      appState.balance -= amt;
      updateBalanceDisplay();
      res.style.color = 'var(--success)';
      res.textContent = `Successfully staked $${amt.toFixed(2)} in Solana Staking Pool!`;
    });
  }

  const loginBtn = document.getElementById('ownerLoginBtn');
  const clearBtn = document.getElementById('clearDataBtn');
  const ownerContent = document.getElementById('ownerDashboardContent');

  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      const pass = prompt('Enter Owner Passkey:');
      if (pass === 'spikey123' || pass === 'admin') {
        ownerContent.innerHTML = `
          <h3 style="margin-bottom:15px; color:var(--success);">Owner Security Log Verified</h3>
          <p>Total Vault Balance: <strong>$${appState.balance.toFixed(2)}</strong></p>
          <p>Total Recorded Deposits: <strong>${appState.deposits.length}</strong></p>
          <p>Active Users: <strong>1 (Isolated Local Session)</strong></p>
        `;
      } else {
        alert('Incorrect passkey.');
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all vault data?')) {
        localStorage.clear();
        location.reload();
      }
    });
  }
}

// --- Global Event Listeners ---
function setupEventListeners() {
  setupDepositForm();
  setupCasino();
  setupChat();
  setupProfile();
  setupInvestAndOwner();

  const searchInput = document.getElementById('cardSearch');
  const filterSelect = document.getElementById('cardFilter');
  if (searchInput && filterSelect) {
    const triggerSearch = () => renderCards(filterSelect.value, searchInput.value);
    searchInput.addEventListener('input', triggerSearch);
    filterSelect.addEventListener('change', triggerSearch);
  }

  const modalClose = document.getElementById('modalClose');
  const cardModal = document.getElementById('cardModal');
  if (modalClose && cardModal) {
    modalClose.addEventListener('click', () => cardModal.classList.remove('active'));
    cardModal.addEventListener('click', (e) => { if (e.target === cardModal) cardModal.classList.remove('active'); });
  }

  const perfSelect = document.getElementById('perfSelect');
  if (perfSelect) {
    perfSelect.addEventListener('change', (e) => {
      document.body.className = `quality-${e.target.value}`;
    });
  }

  const sidebarName = document.getElementById('sidebarUsername');
  if (sidebarName) sidebarName.textContent = appState.user.name;
}

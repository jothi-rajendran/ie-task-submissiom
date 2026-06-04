 // Local storage key
    const STORAGE_KEY = 'incomeExpenseData';

    // Elements
    const descEl = document.getElementById('desc');
    const amountEl = document.getElementById('amount');
    const saveBtn = document.getElementById('saveBtn');
    const resetBtn = document.getElementById('resetBtn');
    const entriesEl = document.getElementById('entries');
    const emptyState = document.getElementById('emptyState');
    const countEl = document.getElementById('count');
    const totalIncomeEl = document.getElementById('totalIncome');
    const totalExpenseEl = document.getElementById('totalExpense');
    const netBalanceEl = document.getElementById('netBalance');
    const editingIdEl = document.getElementById('editingId');
    const form = document.getElementById('entryForm');

    // In-memory entries array
    let entries = [];

    // Load entries from localStorage (on start)
    function loadEntries() {
      const raw = localStorage.getItem(STORAGE_KEY);
      try {
        entries = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(entries)) entries = [];
      } catch (e) {
        console.error('Failed to parse stored data:', e);
        entries = [];
      }
    }

    // Save entries to localStorage
    function saveEntries() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }

    // Generate simple id
    function generateId() {
      return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
    }

    // Calculate totals and update UI
    function updateTotals() {
      const income = entries
        .filter(e => e.type === 'income')
        .reduce((s, e) => s + Number(e.amount), 0);
      const expense = entries
        .filter(e => e.type === 'expense')
        .reduce((s, e) => s + Number(e.amount), 0);
      const balance = income - expense;

      // Format amounts (no specific currency enforcements; adjust to your locale if needed)




      totalIncomeEl.textContent =`₹ ${Math.round(income).toLocaleString()}`;
      //totalIncomeEl.textContent = '₹ ' + Math.round(income).toLocaleString();//
      totalExpenseEl.textContent = '₹ ' + Math.round(expense).toLocaleString();
      netBalanceEl.textContent = '₹ ' + Math.round(balance).toLocaleString();

      // Visual color for balance
      netBalanceEl.style.color = balance < 0 ? '#dc2626' : '#16a34a'; // red if negative, green if positive
    }

    // Render list using selected filter
    function renderList() {
      const filter = document.querySelector('input[name="filter"]:checked')?.value || 'all';
      const filtered = entries.filter(e => filter === 'all' ? true : e.type === filter);

      // Clear previous dynamic items
      entriesEl.querySelectorAll('.dynamic-item').forEach(n => n.remove());

      countEl.textContent = filtered.length;

      if (filtered.length === 0) {
        emptyState.style.display = 'block';
      } else {
        emptyState.style.display = 'none';
        filtered.forEach(it => {
          const wrap = document.createElement('div');
          wrap.className = 'bg-white rounded-2xl shadow-md p-4 flex items-center justify-between dynamic-item';

          // left section
          const left = document.createElement('div');
          const title = document.createElement('div');
          title.className = 'font-medium';
          title.textContent = it.description;
          const meta = document.createElement('div');
          meta.className = 'text-sm text-gray-500';
          meta.textContent = `${it.date || ''} • ${it.type}`;

          left.appendChild(title);
          left.appendChild(meta);

          // right section
          const right = document.createElement('div');
          right.className = 'flex items-center gap-4';
          const amt = document.createElement('div');
          amt.className = 'text-lg font-semibold';
          amt.style.color = it.type === 'income' ? '#16a34a' : '#dc2626';
          const sign = it.type === 'income' ? '+' : '-';
          amt.textContent = `${sign}₹ ${Math.abs(Number(it.amount)).toLocaleString()}`;

          const editBtn = document.createElement('button');
          editBtn.className = 'text-sm px-3 py-1 border rounded';
          editBtn.textContent = 'Edit';
          editBtn.dataset.id = it.id;
          editBtn.dataset.action = 'edit';

          const delBtn = document.createElement('button');
          delBtn.className = 'text-sm px-3 py-1 border rounded text-red-600';
          delBtn.textContent = 'Delete';
          delBtn.dataset.id = it.id;
          delBtn.dataset.action = 'delete';

          right.appendChild(amt);
          right.appendChild(editBtn);
          right.appendChild(delBtn);

          wrap.appendChild(left);
          wrap.appendChild(right);

          entriesEl.appendChild(wrap);
        });
      }

      updateTotals();
      saveEntries();
    }

    // Reset form to default (exit edit mode)
    function resetForm() {
      editingIdEl.value = '';
      descEl.value = '';
      amountEl.value = '';
      form.querySelector('input[name="type"][value="income"]').checked = true;
      saveBtn.textContent = 'Add';
    }

    // Add or update entry handler
    saveBtn.addEventListener('click', () => {
      const desc = descEl.value.trim();
      const amountRaw = amountEl.value;
      const amount = parseFloat(amountRaw);
      const type = form.querySelector('input[name="type"]:checked').value;

      if (!desc) {
        alert('Please enter a description.');
        return;
      }
      if (isNaN(amount) || amount === 0) {
        alert('Please enter a non-zero amount.');
        return;
      }

      const editingId = editingIdEl.value;
      if (editingId) {
        // update existing
        const idx = entries.findIndex(e => e.id === editingId);
        if (idx !== -1) {
          entries[idx].description = desc;
          entries[idx].amount = Math.abs(amount); // store positive always
          entries[idx].type = type;
          entries[idx].date = new Date().toISOString().slice(0,10);
        }
      } else {
        // create new
        const entry = {
          id: generateId(),
          description: desc,
          amount: Math.abs(amount),
          type,
          date: new Date().toISOString().slice(0,10)
        };
        entries.unshift(entry); // newest first
      }

      resetForm();
      renderList();
    });

    // Reset button handler
    resetBtn.addEventListener('click', resetForm);

    // Filter change
    document.querySelectorAll('input[name="filter"]').forEach(r => {
      r.addEventListener('change', renderList);
    });

    // Delegate edit/delete
    entriesEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (action === 'delete') {
        if (!confirm('Delete this entry?')) return;
        entries = entries.filter(i => i.id !== id);
        renderList();
      } else if (action === 'edit') {
        const item = entries.find(i => i.id === id);
        if (!item) return;
        // populate form and switch to edit mode
        editingIdEl.value = item.id;
        descEl.value = item.description;
        amountEl.value = item.amount;
        form.querySelector(`input[name="type"][value="${item.type}"]`).checked = true;
        saveBtn.textContent = 'Update';
        // Scroll into view on small screens
        descEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    // Initialize app
    function init() {
      loadEntries();
      renderList();
      resetForm();
    }

    init();
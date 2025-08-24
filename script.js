/* script.js - Yen Budget Manager (English, Light/Dark, LocalStorage) */
(() => {
    console.log('🚀 Yen Budget Manager script loading...');
    
    // Utilities
    const fmt = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 });
    const ymd = (d) => new Date(d).toISOString().slice(0, 10);
    const ym = (d) => ymd(d).slice(0, 7);
    const today = () => ymd(new Date());
    const monthName = (s) => {
        const d = new Date(s + '-01');
        return `${d.getFullYear()} ${d.toLocaleString('en-US', { month: 'long' })}`;
    };
    const el = (sel, root = document) => root.querySelector(sel);
    const els = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const byId = (id) => document.getElementById(id);

    // Modern notification system
    function showNotification(message, type = 'info', duration = 4000) {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => notif.remove());
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Auto remove after duration
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
    
    function getNotificationIcon(type) {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            case 'info': default: return 'ℹ️';
        }
    }

    // Storage key & state
    const KEY = 'yen-budget-manager:v1';
    const currentMonth = ym(new Date());
    const currentDate = today();
    const defaultState = {
        theme: (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark',
        autoTheme: true,
        textContrast: 1.5,
        elementContrast: 1.2,
        highContrast: false,
        colorPreset: 'default',
        saturation: 1.0,
        colorBlindSupport: false,
        categories: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Other'],
        tx: {
            [currentMonth]: [
                {
                    id: 'sample-1',
                    type: 'income',
                    category: 'Salary',
                    amount: 12435455,
                    date: currentDate,
                    note: 'Monthly salary',
                    recurring: 'monthly',
                    next: '2025-09-22'
                },
                {
                    id: 'sample-2',
                    type: 'expense',
                    category: 'Transport',
                    amount: 3000,
                    date: currentDate,
                    note: 'Train fare'
                },
                {
                    id: 'sample-3',
                    type: 'expense',
                    category: 'Food',
                    amount: 1500,
                    date: currentDate,
                    note: 'Lunch'
                }
            ]
        },
        budgets: {},
        goals: {}
    };

    // Load state from localStorage
    let state = JSON.parse(localStorage.getItem(KEY) || '{}');
    
    // Merge with default state
    state = { ...defaultState, ...state };
    
    // Ensure required properties exist
    if (!state.tx) state.tx = {};
    if (!state.categories) state.categories = defaultState.categories;
    if (!state.budgets) state.budgets = {};
    if (!state.goals) state.goals = {};

    // Save state to localStorage
    function saveState() {
        localStorage.setItem(KEY, JSON.stringify(state));
    }

    // Theme management
    function applyTheme() {
        console.log('🎨 Applying theme:', state.theme);
        
        // Remove existing theme classes
        document.documentElement.classList.remove('light', 'dark');
        
        // Add current theme class
        document.documentElement.classList.add(state.theme);
        
        // Update theme toggle button
        const btn = byId('toggleTheme');
        if (btn) {
            btn.textContent = state.theme === 'light' ? '🌙' : '☀️';
        }
        
        // Update theme option buttons
        updateThemeOptionButtons();
        
        // Apply contrast and color settings
        applyContrastSettings();
        applyColorGrading();
        
        // Save to localStorage
        saveState();
        
        // Update meta theme color for mobile browsers
        updateMetaThemeColor();
        
        console.log('✅ Theme applied successfully');
    }
    
    function updateThemeOptionButtons() {
        const lightBtn = byId('lightTheme');
        const darkBtn = byId('darkTheme');
        
        if (lightBtn) lightBtn.classList.toggle('active', state.theme === 'light');
        if (darkBtn) darkBtn.classList.toggle('active', state.theme === 'dark');
    }
    
    function applyContrastSettings() {
        const textContrast = state.textContrast || 1.5;
        const elementContrast = state.elementContrast || 1.2;
        const highContrast = state.highContrast || false;
        
        console.log('👁️ Applying contrast settings:', { textContrast, elementContrast, highContrast });
        
        // Apply text contrast
        document.documentElement.style.setProperty('--text-contrast', textContrast);
        
        // Apply element contrast
        document.documentElement.style.setProperty('--element-contrast', elementContrast);
        
        // Apply high contrast mode
        if (highContrast) {
            document.documentElement.classList.add('high-contrast');
        } else {
            document.documentElement.classList.remove('high-contrast');
        }
    }
    
    function applyColorGrading() {
        const saturation = state.saturation || 1;
        const colorPreset = state.colorPreset || 'default';
        const colorBlindSupport = state.colorBlindSupport || false;
        
        console.log('🎭 Applying color grading:', { saturation, colorPreset, colorBlindSupport });
        
        // Apply saturation
        document.documentElement.style.setProperty('--saturation', saturation);
        
        // Apply color preset
        applyColorPreset(colorPreset);
        
        // Apply color blindness support
        if (colorBlindSupport) {
            document.documentElement.classList.add('color-blind-support');
        } else {
            document.documentElement.classList.remove('color-blind-support');
        }
    }
    
    function applyColorPreset(preset) {
        // Remove existing preset classes
        document.documentElement.classList.remove('preset-default', 'preset-warm', 'preset-cool', 'preset-vibrant');
        
        // Add new preset class
        document.documentElement.classList.add(`preset-${preset}`);
        
        // Update active state of preset buttons
        updateColorPresetButtons(preset);
    }
    
    function updateColorPresetButtons(activePreset) {
        const presetButtons = document.querySelectorAll('.color-preset-btn');
        presetButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.preset === activePreset) {
                btn.classList.add('active');
            }
        });
    }
    
    function initializeThemeControls() {
        console.log('🎨 Initializing theme controls...');
        
        // Theme toggle buttons
        const lightBtn = byId('lightTheme');
        const darkBtn = byId('darkTheme');
        
        if (lightBtn) {
            lightBtn.addEventListener('click', () => {
                console.log('☀️ Light theme button clicked');
                state.theme = 'light';
                applyTheme();
                showNotification('Theme changed to Light mode', 'success');
            });
        }
        
        if (darkBtn) {
            darkBtn.addEventListener('click', () => {
                console.log('🌙 Dark theme button clicked');
                state.theme = 'dark';
                applyTheme();
                showNotification('Theme changed to Dark mode', 'success');
            });
        }
        
        // Auto theme toggle
        const autoThemeToggle = byId('autoTheme');
        if (autoThemeToggle) {
            autoThemeToggle.checked = state.autoTheme !== false;
            autoThemeToggle.addEventListener('change', (e) => {
                state.autoTheme = e.target.checked;
                if (state.autoTheme) {
                    // Follow system preference
                    const systemTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                    if (state.theme !== systemTheme) {
                        state.theme = systemTheme;
                        applyTheme();
                    }
                }
                saveState();
                showNotification('Auto theme setting updated', 'info');
            });
        }
        
        // Contrast controls
        initializeContrastControls();
        
        // Color grading controls
        initializeColorGradingControls();
        
        console.log('✅ Theme controls initialized');
    }
    
    function initializeContrastControls() {
        console.log('👁️ Initializing contrast controls...');
        
        // Text contrast slider
        const textContrastSlider = byId('textContrast');
        const textContrastValue = byId('textContrastValue');
        
        if (textContrastSlider && textContrastValue) {
            textContrastSlider.value = state.textContrast || 1.5;
            textContrastValue.textContent = `${(state.textContrast || 1.5).toFixed(1)}x`;
            
            textContrastSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                state.textContrast = value;
                textContrastValue.textContent = `${value.toFixed(1)}x`;
                applyContrastSettings();
            });
            
            textContrastSlider.addEventListener('change', () => {
                saveState();
                showNotification('Text contrast updated', 'success');
            });
        }
        
        // Element contrast slider
        const elementContrastSlider = byId('elementContrast');
        const elementContrastValue = byId('elementContrastValue');
        
        if (elementContrastSlider && elementContrastValue) {
            elementContrastSlider.value = state.elementContrast || 1.2;
            elementContrastValue.textContent = `${(state.elementContrast || 1.2).toFixed(1)}x`;
            
            elementContrastSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                state.elementContrast = value;
                elementContrastValue.textContent = `${value.toFixed(1)}x`;
                applyContrastSettings();
            });
            
            elementContrastSlider.addEventListener('change', () => {
                saveState();
                showNotification('Element contrast updated', 'success');
            });
        }
        
        // High contrast toggle
        const highContrastToggle = byId('highContrast');
        if (highContrastToggle) {
            highContrastToggle.checked = state.highContrast || false;
            highContrastToggle.addEventListener('change', (e) => {
                state.highContrast = e.target.checked;
                applyContrastSettings();
                saveState();
                showNotification(
                    e.target.checked ? 'High contrast mode enabled' : 'High contrast mode disabled', 
                    'info'
                );
            });
        }
        
        console.log('✅ Contrast controls initialized');
    }
    
    function initializeColorGradingControls() {
        console.log('🎭 Initializing color grading controls...');
        
        // Color preset buttons
        const presetButtons = document.querySelectorAll('.color-preset-btn');
        presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.preset;
                state.colorPreset = preset;
                applyColorPreset(preset);
                saveState();
                showNotification(`Color preset changed to ${preset}`, 'success');
            });
        });
        
        // Saturation slider
        const saturationSlider = byId('saturation');
        const saturationValue = byId('saturationValue');
        
        if (saturationSlider && saturationValue) {
            saturationSlider.value = state.saturation || 1;
            saturationValue.textContent = `${Math.round((state.saturation || 1) * 100)}%`;
            
            saturationSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                state.saturation = value;
                saturationValue.textContent = `${Math.round(value * 100)}%`;
                applyColorGrading();
            });
            
            saturationSlider.addEventListener('change', () => {
                saveState();
                showNotification('Saturation updated', 'success');
            });
        }
        
        // Color blindness support toggle
        const colorBlindToggle = byId('colorBlindSupport');
        if (colorBlindToggle) {
            colorBlindToggle.checked = state.colorBlindSupport || false;
            colorBlindToggle.addEventListener('change', (e) => {
                state.colorBlindSupport = e.target.checked;
                applyColorGrading();
                saveState();
                showNotification(
                    e.target.checked ? 'Color blindness support enabled' : 'Color blindness support disabled', 
                    'info'
                );
            });
        }
        
        console.log('✅ Color grading controls initialized');
    }

    // Core functions
    function addTx(tx) {
        const month = ym(tx.date);
        if (!state.tx[month]) state.tx[month] = [];
        state.tx[month].push(tx);
        saveState();
    }

    function allTx() {
        const allTransactions = Object.values(state.tx).flat();
        return allTransactions;
    }

    function totalsForMonth(yyyymm) {
        const arr = state.tx[yyyymm] || [];
        const income = arr.filter(x => x.type === 'income').reduce((a, b) => a + b.amount, 0);
        const expense = arr.filter(x => x.type === 'expense').reduce((a, b) => a + b.amount, 0);
        return { income, expense, savings: income - expense };
    }

    function categorySpend(yyyymm) {
        const out = {};
        for (const t of (state.tx[yyyymm] || []).filter(x => x.type === 'expense')) {
            out[t.category] = (out[t.category] || 0) + t.amount;
        }
        return out;
    }

    // Tab management
    function openTab(id) {
        console.log('🚀 openTab called with id:', id);
        
        try {
            // Validate tab ID
            if (!id || typeof id !== 'string') {
                console.error('❌ Invalid tab ID:', id);
                return;
            }
            
            // Find the target section
            const targetSection = byId(id);
            if (!targetSection) {
                console.error('❌ Target section not found:', id);
                return;
            }
            
            console.log('✅ Target section found:', targetSection);
            
            // Update tab states
            const allTabs = els('.tab');
            console.log('🔍 Found tabs:', allTabs.length);
            
            allTabs.forEach(t => {
                t.classList.remove('active');
                if (t.dataset.view === id) {
                    t.classList.add('active');
                }
            });
            
            // Hide ALL sections first, then show only the target
            const allSections = els('main > section');
            console.log('🔍 Found sections:', allSections.length);
            
            allSections.forEach(s => {
                // Hide all sections
                s.classList.add('hidden');
                console.log(`Section ${s.id}: hidden`);
            });
            
            // Show only the target section
            if (targetSection) {
                targetSection.classList.remove('hidden');
                console.log(`Section ${id}: visible`);
            }
            
            // Update state
            state.activeTab = id;
            saveState();
            
            console.log('✅ Tab switch complete');
            
        } catch (error) {
            console.error('❌ Error in openTab:', error);
        }
    }

    // Test function for debugging
    window.testTabSwitch = function(tabId) {
        console.log('🧪 Testing tab switch to:', tabId);
        openTab(tabId);
    };

    // Test function to check all tabs
    window.testAllTabs = function() {
        const tabs = ['dashboard', 'transactions', 'budgets', 'reports', 'settings'];
        tabs.forEach(tabId => {
            console.log(`🧪 Testing tab: ${tabId}`);
            setTimeout(() => openTab(tabId), 1000);
        });
    };

    // Simple test function
    window.testTabs = function() {
        console.log('🧪 Testing tab functionality...');
        
        // Check if tabs exist
        const tabs = document.querySelectorAll('.tab');
        console.log('Found tabs:', tabs.length);
        tabs.forEach(tab => {
            console.log(`- Tab: ${tab.dataset.view}, Active: ${tab.classList.contains('active')}`);
        });
        
        // Check if sections exist
        const sections = document.querySelectorAll('main > section');
        console.log('Found sections:', sections.length);
        sections.forEach(section => {
            console.log(`- Section: ${section.id}, Hidden: ${section.classList.contains('hidden')}`);
        });
        
        // Test tab switching
        console.log('Testing tab switching...');
        openTab('transactions');
    };

    // Debug function to check current state
    window.debugTabState = function() {
        console.log('🔍 Debugging tab state...');
        
        const allTabs = els('.tab');
        const allSections = els('main > section');
        
        console.log('📊 Tabs found:', allTabs.length);
        allTabs.forEach(tab => {
            console.log(`- Tab: ${tab.dataset.view}, Active: ${tab.classList.contains('active')}`);
        });
        
        console.log('📊 Sections found:', allSections.length);
        allSections.forEach(section => {
            console.log(`- Section: ${section.id}, Hidden: ${section.classList.contains('hidden')}`);
        });
        
        console.log('📊 Current state:', state);
    };

    // Make openTab function available globally
    window.openTab = openTab;

    // Event listeners setup
    function setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Tab navigation event listeners
        const tabs = els('.tab');
        console.log('🔍 Found tabs:', tabs.length);
        
        tabs.forEach(tab => {
            console.log(`🔧 Setting up tab: ${tab.dataset.view}`);
            
            // Add click event listener directly
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = tab.dataset.view;
                console.log('📱 Tab clicked:', tabId);
                openTab(tabId);
            });
            
            // Add keyboard support
            tab.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const tabId = tab.dataset.view;
                    console.log('⌨️ Tab activated via keyboard:', tabId);
                    openTab(tabId);
                }
            });
            
            console.log(`🔍 Tab ${tab.dataset.view} setup complete`);
        });

        // Theme toggle
        const toggleTheme = byId('toggleTheme');
        if (toggleTheme) {
            toggleTheme.addEventListener('click', () => {
                console.log('🌓 Theme toggle clicked');
                state.theme = state.theme === 'light' ? 'dark' : 'light';
                applyTheme();
                saveState();
                showNotification(`Theme changed to ${state.theme} mode`, 'success');
            });
        }

        // Quick add button
        const addQuick = byId('addQuick');
        if (addQuick) {
            addQuick.addEventListener('click', () => openTab('transactions'));
        }

        // Export button
        const exportBtn = byId('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => openTab('reports'));
        }

        // Import file input
        const importFile = byId('importFile');
        if (importFile) {
            importFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    // Handle file import
                    showNotification('File import functionality coming soon', 'info');
                }
            });
        }

        // Quick action buttons
        const addIncomeBtn = byId('addIncomeBtn');
        const addExpenseBtn = byId('addExpenseBtn');
        const setBudgetBtn = byId('setBudgetBtn');
        const viewReportsBtn = byId('viewReportsBtn');
        const viewAllBtn = byId('viewAllBtn');

        if (addIncomeBtn) addIncomeBtn.addEventListener('click', () => openTab('transactions'));
        if (addExpenseBtn) addExpenseBtn.addEventListener('click', () => openTab('transactions'));
        if (setBudgetBtn) setBudgetBtn.addEventListener('click', () => openTab('budgets'));
        if (viewReportsBtn) viewReportsBtn.addEventListener('click', () => openTab('reports'));
        if (viewAllBtn) viewAllBtn.addEventListener('click', () => openTab('transactions'));

        console.log('✅ Event listeners setup complete');
    }

    // Form handlers setup
    function setupFormHandlers() {
        console.log('📝 Setting up form handlers...');
        
        // Transaction form
        const txForm = byId('txForm');
        if (txForm) {
            txForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(txForm);
                const tx = {
                    id: Date.now().toString(),
                    type: formData.get('type'),
                    category: formData.get('category'),
                    amount: parseInt(formData.get('amount')),
                    date: formData.get('date'),
                    note: formData.get('note'),
                    recurring: formData.get('recurring'),
                    next: formData.get('next')
                };
                
                addTx(tx);
                txForm.reset();
                showNotification('Transaction added successfully!', 'success');
                renderAll();
            });
        }

        // Budget form
        const budgetForm = byId('budgetForm');
        if (budgetForm) {
            budgetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(budgetForm);
                const category = formData.get('category');
                const amount = parseInt(formData.get('amount'));
                
                state.budgets[category] = amount;
                saveState();
                budgetForm.reset();
                showNotification('Budget set successfully!', 'success');
                renderAll();
            });
        }

        // Goal form
        const goalForm = byId('goalForm');
        if (goalForm) {
            goalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(goalForm);
                const income = parseInt(formData.get('income'));
                const rate = parseInt(formData.get('rate'));
                
                state.goals = { income, rate };
                saveState();
                goalForm.reset();
                showNotification('Savings goal set successfully!', 'success');
                renderAll();
            });
        }

        // Income form
        const incomeForm = byId('incomeForm');
        if (incomeForm) {
            incomeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(incomeForm);
                const tx = {
                    id: Date.now().toString(),
                    type: 'income',
                    category: formData.get('incomeCategory'),
                    amount: parseInt(formData.get('incomeAmount')),
                    date: formData.get('incomeDate'),
                    note: formData.get('incomeNote')
                };
                
                addTx(tx);
                incomeForm.reset();
                showNotification('Income added successfully!', 'success');
                renderAll();
            });
        }

        console.log('✅ Form handlers setup complete');
    }

    // Render functions
    function renderAll() {
        renderDashboard();
        renderTransactions();
        renderBudgets();
        renderReports();
        renderSettings();
    }

    function renderDashboard() {
        // Update month tag
        const monthTag = byId('monthTag');
        if (monthTag) {
            monthTag.textContent = monthName(currentMonth);
        }

        // Update KPIs
        const kpis = byId('kpis');
        if (kpis) {
            const totals = totalsForMonth(currentMonth);
            kpis.innerHTML = `
                <div class="kpi-item">
                    <span class="kpi-label">Income</span>
                    <span class="kpi-value positive">${fmt.format(totals.income)}</span>
                </div>
                <div class="kpi-item">
                    <span class="kpi-label">Expenses</span>
                    <span class="kpi-value negative">${fmt.format(totals.expense)}</span>
                </div>
                <div class="kpi-item">
                    <span class="kpi-label">Savings</span>
                    <span class="kpi-value ${totals.savings >= 0 ? 'positive' : 'negative'}">${fmt.format(totals.savings)}</span>
                </div>
            `;
        }

        // Update recent transactions
        renderRecentTransactions();

        // Update savings overview
        const totalSaved = byId('totalSaved');
        const savingsRate = byId('savingsRate');
        if (totalSaved && savingsRate) {
            const totals = totalsForMonth(currentMonth);
            const rate = totals.income > 0 ? ((totals.savings / totals.income) * 100).toFixed(1) : '0';
            totalSaved.textContent = fmt.format(totals.savings);
            savingsRate.textContent = `${rate}%`;
        }

        // Update monthly goal
        const monthlyGoal = byId('monthlyGoal');
        if (monthlyGoal && state.goals.income) {
            const target = (state.goals.income * state.goals.rate) / 100;
            const current = totalsForMonth(currentMonth).savings;
            monthlyGoal.textContent = `${fmt.format(current)} / ${fmt.format(target)}`;
        }

        // Update progress
        const daysCompleted = byId('daysCompleted');
        const daysRemaining = byId('daysRemaining');
        const monthProgress = byId('monthProgress');
        if (daysCompleted && daysRemaining && monthProgress) {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            const totalDays = endOfMonth.getDate();
            const completedDays = now.getDate();
            const remainingDays = totalDays - completedDays;
            const progressPercent = (completedDays / totalDays) * 100;

            daysCompleted.textContent = completedDays;
            daysRemaining.textContent = remainingDays;
            monthProgress.style.width = `${progressPercent}%`;
        }
    }

    function renderRecentTransactions() {
        const recentTable = byId('recentTable');
        const transactionCount = byId('transactionCount');
        
        if (recentTable && transactionCount) {
            const tbody = recentTable.querySelector('tbody');
            const recentTx = allTx().slice(-5); // Last 5 transactions
            
            tbody.innerHTML = '';
            recentTx.forEach(tx => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${tx.date}</td>
                    <td>${tx.type}</td>
                    <td>${tx.category}</td>
                    <td>${tx.note || ''}</td>
                    <td class="right ${tx.type === 'income' ? 'positive' : 'negative'}">${fmt.format(tx.amount)}</td>
                `;
                tbody.appendChild(row);
            });
            
            transactionCount.textContent = `${recentTx.length} recent transactions`;
        }
    }

    function renderTransactions() {
        const txTable = byId('txTable');
        if (txTable) {
            const tbody = txTable.querySelector('tbody');
            const allTransactions = allTx();
            
            tbody.innerHTML = '';
            allTransactions.forEach(tx => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${tx.date}</td>
                    <td>${tx.type}</td>
                    <td>${tx.category}</td>
                    <td>${tx.note || ''}</td>
                    <td class="right ${tx.type === 'income' ? 'positive' : 'negative'}">${fmt.format(tx.amount)}</td>
                    <td>
                        <button class="btn" onclick="editTransaction('${tx.id}')">✏️</button>
                        <button class="btn danger" onclick="deleteTransaction('${tx.id}')">🗑️</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    }

    function renderBudgets() {
        const budgetTableBody = byId('budgetTableBody');
        const savingsCategories = byId('savingsCategories');
        
        if (budgetTableBody) {
            budgetTableBody.innerHTML = '';
            Object.entries(state.budgets).forEach(([category, budget]) => {
                const spent = categorySpend(currentMonth)[category] || 0;
                const remaining = budget - spent;
                const percentage = ((spent / budget) * 100).toFixed(1);
                const status = remaining >= 0 ? 'positive' : 'negative';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${category}</td>
                    <td>${fmt.format(budget)}</td>
                    <td>${fmt.format(spent)}</td>
                    <td class="${status}">${fmt.format(remaining)}</td>
                    <td class="${status}">${percentage}%</td>
                    <td>
                        <button class="btn" onclick="editBudget('${category}')">✏️</button>
                        <button class="btn danger" onclick="deleteBudget('${category}')">🗑️</button>
                    </td>
                `;
                budgetTableBody.appendChild(row);
            });
        }
        
        if (savingsCategories) {
            const totals = totalsForMonth(currentMonth);
            const savings = totals.savings;
            const category = savings >= 0 ? 'Savings' : 'Overspending';
            const amount = Math.abs(savings);
            
            savingsCategories.innerHTML = `
                <div class="savings-item">
                    <span class="label">${category}</span>
                    <span class="value ${savings >= 0 ? 'positive' : 'negative'}">${fmt.format(amount)}</span>
                </div>
            `;
        }
    }

    function renderReports() {
        // This would render charts and reports
        // For now, just ensure the section is accessible
        console.log('📊 Reports section rendered');
    }

    function renderSettings() {
        // Update category count
        const categoryCount = byId('categoryCount');
        if (categoryCount) {
            categoryCount.textContent = `${state.categories.length} categories`;
        }

        // Render default categories
        const defaultCategories = byId('defaultCategories');
        if (defaultCategories) {
            defaultCategories.innerHTML = '';
            state.categories.forEach(category => {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'category-item';
                categoryDiv.innerHTML = `
                    <span class="category-name">${category}</span>
                    <button class="btn danger" onclick="deleteCategory('${category}')">🗑️</button>
                `;
                defaultCategories.appendChild(categoryDiv);
            });
        }
    }

    // Utility functions
    function ensureTabState() {
        const activeTabId = state.activeTab || 'dashboard';
        console.log('🔍 Ensuring tab state for:', activeTabId);
        
        // Update tab states
        const allTabs = els('.tab');
        allTabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.view === activeTabId) {
                tab.classList.add('active');
            }
        });
        
        // Hide all sections initially
        const allSections = els('main > section');
        allSections.forEach(s => {
            s.classList.add('hidden');
        });
        
        // Show only the active section
        const activeSection = byId(activeTabId);
        if (activeSection) {
            activeSection.classList.remove('hidden');
            console.log('✅ Active section shown:', activeTabId);
        } else {
            console.error('❌ Active section not found:', activeTabId);
        }
        
        return activeTabId;
    }

    function addSampleDataForDashboard() {
        // Add some sample data if none exists
        if (allTx().length === 0) {
            const sampleTx = [
                {
                    id: 'sample-1',
                    type: 'income',
                    category: 'Salary',
                    amount: 500000,
                    date: currentDate,
                    note: 'Monthly salary'
                },
                {
                    id: 'sample-2',
                    type: 'expense',
                    category: 'Food',
                    amount: 15000,
                    date: currentDate,
                    note: 'Weekly groceries'
                }
            ];
            
            sampleTx.forEach(tx => addTx(tx));
        }
    }

    // Initialize the application
    function init() {
        console.log('🚀 Initializing Yen Budget Manager...');
        
        try {
            // Apply theme
            applyTheme();
            
            // Initialize theme controls
            initializeThemeControls();
            
            // Setup system theme listener
            setupSystemThemeListener();
            
            // Debug: Check initial state
            console.log('📊 Initial state:', state);
            console.log('📊 Initial transactions:', allTx());
            
            // Debug: Check DOM elements before setup
            console.log('🔍 Checking DOM elements before setup...');
            const tabsBefore = document.querySelectorAll('.tab');
            const sectionsBefore = document.querySelectorAll('main > section');
            console.log('Tabs found before setup:', tabsBefore.length);
            console.log('Sections found before setup:', sectionsBefore.length);
            
            // Setup event listeners
            setupEventListeners();
            
            // Setup form handlers
            setupFormHandlers();
            
            // Ensure we have sample data before rendering
            if (allTx().length === 0) {
                console.log('📝 No transactions found, adding sample data...');
                addSampleDataForDashboard();
                console.log('📝 Sample data added, new state:', state);
                console.log('📝 New transactions:', allTx());
            }
            
            // Render initial state
            renderAll();
            
            // Ensure proper tab state
            const activeTab = ensureTabState();
            
            // Ensure dashboard tab is active by default
            console.log('🏠 Setting dashboard as default active tab...');
            openTab(activeTab || 'dashboard');
            
            console.log('✅ App initialization complete');
            
        } catch (error) {
            console.error('❌ Error during app initialization:', error);
        }
    }

    // Start the app when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Small delay to ensure DOM is fully ready
            setTimeout(init, 100);
        });
    } else {
        // Small delay to ensure DOM is fully ready
        setTimeout(init, 100);
    }

    // System theme detection
    function detectSystemTheme() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
            return mediaQuery.matches ? 'light' : 'dark';
        }
        return 'dark'; // Default fallback
    }
    
    // Listen for system theme changes
    function setupSystemThemeListener() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
            mediaQuery.addEventListener('change', (e) => {
                if (state.autoTheme) {
                    const newTheme = e.matches ? 'light' : 'dark';
                    if (state.theme !== newTheme) {
                        state.theme = newTheme;
                        applyTheme();
                        showNotification(`Theme automatically changed to ${newTheme} mode`, 'info');
                    }
                }
            });
        }
    }
    
    function updateMetaThemeColor() {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        
        if (state.theme === 'light') {
            metaThemeColor.content = '#f8fafc';
        } else {
            metaThemeColor.content = '#0f172a';
        }
    }

    // Global functions for HTML onclick handlers
    window.editTransaction = function(id) {
        console.log('Edit transaction:', id);
        showNotification('Edit functionality coming soon', 'info');
    };

    window.deleteTransaction = function(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            // Find and remove transaction
            Object.keys(state.tx).forEach(month => {
                state.tx[month] = state.tx[month].filter(tx => tx.id !== id);
            });
            saveState();
            renderAll();
            showNotification('Transaction deleted successfully', 'success');
        }
    };

    window.editBudget = function(category) {
        console.log('Edit budget:', category);
        showNotification('Edit budget functionality coming soon', 'info');
    };

    window.deleteBudget = function(category) {
        if (confirm('Are you sure you want to delete this budget?')) {
            delete state.budgets[category];
            saveState();
            renderAll();
            showNotification('Budget deleted successfully', 'success');
        }
    };

    window.deleteCategory = function(category) {
        if (confirm('Are you sure you want to delete this category?')) {
            state.categories = state.categories.filter(c => c !== category);
            saveState();
            renderAll();
            showNotification('Category deleted successfully', 'success');
        }
    };

})();






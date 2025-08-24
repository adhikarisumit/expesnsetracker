/* Simple working version of Yen Budget Manager */
(() => {
    console.log('🚀 Yen Budget Manager (Simple) loading...');
    
    // Utilities
    const byId = (id) => document.getElementById(id);
    const els = (sel) => Array.from(document.querySelectorAll(sel));
    const fmt = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 });
    const ymd = (d) => new Date(d).toISOString().slice(0, 10);
    const ym = (d) => ymd(d).slice(0, 7);
    const today = () => ymd(new Date());
    const monthName = (s) => {
        const d = new Date(s + '-01');
        return `${d.getFullYear()} ${d.toLocaleString('en-US', { month: 'long' })}`;
    };
    
    // State management
    const currentMonth = ym(new Date());
    const currentDate = today();
    const defaultState = {
        theme: 'dark',
        autoTheme: true,
        textContrast: 1.5,
        elementContrast: 1.2,
        highContrast: false,
        colorPreset: 'default',
        saturation: 1.0,
        colorBlindSupport: false,
        activeTab: 'dashboard',
        categories: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Other', 'Salary', 'Bonus'],
        tx: {},
        budgets: {},
        goals: {}
    };
    
    let state = { ...defaultState };
    
    // Load state from localStorage
    try {
        const saved = localStorage.getItem('yen-budget-manager:v1');
        if (saved) {
            state = { ...defaultState, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.error('Failed to load state:', e);
    }
    
    // Save state to localStorage
    function saveState() {
        try {
            localStorage.setItem('yen-budget-manager:v1', JSON.stringify(state));
        } catch (e) {
            console.error('Failed to save state:', e);
        }
    }
    
    // Core functions
    function addTx(tx) {
        const month = ym(tx.date);
        if (!state.tx[month]) state.tx[month] = [];
        state.tx[month].push(tx);
        saveState();
        console.log('✅ Transaction added:', tx);
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
    
    // Budget tracking functions
    function getBudgetStatus(category, month = currentMonth) {
        const budget = state.budgets[category] || 0;
        const spent = categorySpend(month)[category] || 0;
        const remaining = budget - spent;
        const percentage = budget > 0 ? ((spent / budget) * 100).toFixed(1) : 0;
        
        return {
            budget,
            spent,
            remaining,
            percentage,
            isOverBudget: remaining < 0,
            hasSavings: remaining > 0
        };
    }
    
    function getCategorySavings(month = currentMonth) {
        const savings = {};
        Object.keys(state.budgets).forEach(category => {
            const status = getBudgetStatus(category, month);
            if (status.hasSavings) {
                savings[category] = status.remaining;
            }
        });
        return savings;
    }
    
    function getTotalCategorySavings(month = currentMonth) {
        const categorySavings = getCategorySavings(month);
        return Object.values(categorySavings).reduce((total, amount) => total + amount, 0);
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
            
            // Render the current tab content
            if (id === 'dashboard') {
                renderDashboard();
            } else if (id === 'transactions') {
                renderTransactions();
            } else if (id === 'budgets') {
                renderBudgets();
            }
            
            console.log('✅ Tab switch complete');
            
        } catch (error) {
            console.error('❌ Error in openTab:', error);
        }
    }
    
    // Initialize theme controls
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
                
                // Update dashboard and transactions
                renderDashboard();
                renderTransactions();
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
                const actualSpent = parseInt(formData.get('actualSpent') || 0);
                
                // Store budget and actual spent
                if (!state.budgetTracking) state.budgetTracking = {};
                if (!state.budgetTracking[currentMonth]) state.budgetTracking[currentMonth] = {};
                
                state.budgetTracking[currentMonth][category] = {
                    budget: amount,
                    actualSpent: actualSpent,
                    lastUpdated: new Date().toISOString()
                };
                
                // Also update the main budgets object for compatibility
                state.budgets[category] = amount;
                
                saveState();
                budgetForm.reset();
                
                // Reset button text
                const submitBtn = budgetForm.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.textContent = 'Save Budget';
                
                showNotification('Budget updated successfully!', 'success');
                
                // Update budgets and dashboard
                renderBudgets();
                renderDashboard();
            });
            
            // Handle form reset
            budgetForm.addEventListener('reset', () => {
                const submitBtn = budgetForm.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.textContent = 'Save Budget';
            });
        }

        // Delete budget button
        const deleteBudgetBtn = byId('deleteBudget');
        if (deleteBudgetBtn) {
            deleteBudgetBtn.addEventListener('click', () => {
                const categoryInput = budgetForm?.querySelector('input[name="category"]');
                if (categoryInput && categoryInput.value.trim()) {
                    const category = categoryInput.value.trim();
                    if (confirm(`Are you sure you want to delete the budget for "${category}"?`)) {
                        delete state.budgets[category];
                        saveState();
                        budgetForm.reset();
                        renderBudgets();
                        renderDashboard();
                        showNotification(`Budget for "${category}" deleted successfully`, 'success');
                    }
                } else {
                    showNotification('Please enter a category name first', 'warning');
                }
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
                
                // Update dashboard
                renderDashboard();
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
                
                // Update dashboard and transactions
                renderDashboard();
                renderTransactions();
            });
        }

        // Category management
        setupCategoryHandlers();

        console.log('✅ Form handlers setup complete');
    }
    
    // Category management functions
    function setupCategoryHandlers() {
        console.log('🏷️ Setting up category handlers...');
        
        const addCategoryBtn = byId('addCategoryBtn');
        const newCategoryInput = byId('newCategoryInput');
        
        if (addCategoryBtn && newCategoryInput) {
            addCategoryBtn.addEventListener('click', () => {
                addNewCategory();
            });
            
            // Allow Enter key to add category
            newCategoryInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addNewCategory();
                }
            });
        }
        
        console.log('✅ Category handlers setup complete');
    }
    
    function addNewCategory() {
        const newCategoryInput = byId('newCategoryInput');
        const categoryName = newCategoryInput.value.trim();
        
        if (!categoryName) {
            showNotification('Please enter a category name', 'error');
            return;
        }
        
        if (categoryName.length > 30) {
            showNotification('Category name must be 30 characters or less', 'error');
            return;
        }
        
        // Check if category already exists
        if (state.categories.includes(categoryName)) {
            showNotification('Category already exists', 'warning');
            return;
        }
        
        // Add new category
        state.categories.push(categoryName);
        saveState();
        
        // Clear input
        newCategoryInput.value = '';
        
        // Update category displays
        updateCategoryLists();
        renderCategories();
        
        showNotification(`Category "${categoryName}" added successfully!`, 'success');
        
        console.log('✅ New category added:', categoryName);
    }
    
    function updateCategoryLists() {
        // Update all datalists with new categories
        const catList = byId('catList');
        if (catList) {
            catList.innerHTML = '';
            state.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                catList.appendChild(option);
            });
        }
    }
    
    function renderCategories() {
        const defaultCategories = byId('defaultCategories');
        const categoryCount = byId('categoryCount');
        
        if (defaultCategories) {
            defaultCategories.innerHTML = '';
            
            state.categories.forEach(category => {
                const categoryCard = document.createElement('div');
                categoryCard.className = 'category-card';
                categoryCard.innerHTML = `
                    <div class="category-info">
                        <span class="category-name">${category}</span>
                        <span class="category-type">${getCategoryType(category)}</span>
                    </div>
                    <div class="category-actions">
                        <button class="btn small" onclick="editCategory('${category}')" title="Edit">✏️</button>
                        <button class="btn small danger" onclick="deleteCategory('${category}')" title="Delete">🗑️</button>
                    </div>
                `;
                defaultCategories.appendChild(categoryCard);
            });
        }
        
        if (categoryCount) {
            const usedCategories = getUsedCategories();
            categoryCount.textContent = `${state.categories.length} categories`;
            const usageElement = document.querySelector('.category-usage');
            if (usageElement) {
                usageElement.textContent = `${usedCategories.length} in use`;
            }
        }
    }
    
    function getCategoryType(category) {
        // Determine if category is income or expense based on usage
        const allTransactions = allTx();
        const incomeCount = allTransactions.filter(tx => tx.category === category && tx.type === 'income').length;
        const expenseCount = allTransactions.filter(tx => tx.category === category && tx.type === 'expense').length;
        
        if (incomeCount > 0 && expenseCount === 0) return 'Income';
        if (expenseCount > 0 && incomeCount === 0) return 'Expense';
        if (incomeCount > 0 && expenseCount > 0) return 'Mixed';
        return 'Unused';
    }
    
    function getUsedCategories() {
        const allTransactions = allTx();
        const usedCategories = new Set();
        allTransactions.forEach(tx => usedCategories.add(tx.category));
        return Array.from(usedCategories);
    }
    
    // Render functions
    function renderDashboard() {
        console.log('📊 Rendering dashboard...');
        
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
                    <span class="kpi-label">Current Balance</span>
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
            const categorySavings = getTotalCategorySavings();
            const totalSavings = totals.savings + categorySavings; // Include category savings
            
            const rate = totals.income > 0 ? ((totalSavings / totals.income) * 100).toFixed(1) : '0';
            totalSaved.textContent = fmt.format(totalSavings);
            savingsRate.textContent = `${rate}%`;
        }

        // Update monthly goal
        const monthlyGoal = byId('monthlyGoal');
        if (monthlyGoal && state.goals.income) {
            const target = (state.goals.income * state.goals.rate) / 100;
            const totals = totalsForMonth(currentMonth);
            const categorySavings = getTotalCategorySavings();
            const current = totals.savings + categorySavings; // Include category savings
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
        
        console.log('✅ Dashboard rendered');
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
        
        console.log('✅ Transactions rendered');
    }

    function renderBudgets() {
        const budgetTableBody = byId('budgetTableBody');
        const savingsCategories = byId('savingsCategories');
        
        if (budgetTableBody) {
            budgetTableBody.innerHTML = '';
            Object.entries(state.budgets).forEach(([category, budget]) => {
                // Get actual spent from budget tracking or calculate from transactions
                let actualSpent = 0;
                if (state.budgetTracking && state.budgetTracking[currentMonth] && state.budgetTracking[currentMonth][category]) {
                    actualSpent = state.budgetTracking[currentMonth][category].actualSpent;
                } else {
                    // Fallback to transaction-based spending
                    actualSpent = categorySpend(currentMonth)[category] || 0;
                }
                
                const remaining = budget - actualSpent;
                const percentage = budget > 0 ? ((actualSpent / budget) * 100).toFixed(1) : 0;
                const status = remaining >= 0 ? 'positive' : 'negative';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${category}</td>
                    <td>${fmt.format(budget)}</td>
                    <td>${fmt.format(actualSpent)}</td>
                    <td class="${status}">${fmt.format(remaining)}</td>
                    <td class="${status}">${percentage}%</td>
                    <td>
                        <button class="btn" onclick="editBudget('${category}')" title="Edit Budget">✏️</button>
                        <button class="btn" onclick="quickUpdateSpending('${category}')" title="Quick Update Spending">💰</button>
                        <button class="btn danger" onclick="deleteBudget('${category}')" title="Delete Budget">🗑️</button>
                    </td>
                `;
                budgetTableBody.appendChild(row);
            });
        }
        
        if (savingsCategories) {
            // Calculate total savings from categories
            const totalCategorySavings = getTotalCategorySavings();
            const categorySavings = getCategorySavings();
            
            let savingsHTML = '';
            
            if (totalCategorySavings > 0) {
                savingsHTML = `
                    <div class="savings-item">
                        <span class="label">Total Category Savings</span>
                        <span class="value positive">${fmt.format(totalCategorySavings)}</span>
                    </div>
                `;
                
                // Add individual category savings
                Object.entries(categorySavings).forEach(([category, amount]) => {
                    if (amount > 0) {
                        savingsHTML += `
                            <div class="savings-item">
                                <span class="label">Saved from ${category}</span>
                                <span class="value positive">${fmt.format(amount)}</span>
                            </div>
                        `;
                    }
                });
            } else {
                savingsHTML = `
                    <div class="savings-item">
                        <span class="label">Category Savings</span>
                        <span class="value">¥0</span>
                    </div>
                `;
            }
            
            savingsCategories.innerHTML = savingsHTML;
        }
        
        console.log('✅ Budgets rendered');
    }
    
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
    
    // Simple notification system
    function showNotification(message, type = 'info', duration = 4000) {
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
        
        // Create simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto remove
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);
    }
    
    // Make openTab function available globally
    window.openTab = openTab;
    
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
            renderDashboard();
            renderTransactions();
            showNotification('Transaction deleted successfully', 'success');
        }
    };

    window.editBudget = function(category) {
        console.log('Edit budget:', category);
        
        // Pre-fill the budget form with current values
        const budgetForm = byId('budgetForm');
        if (budgetForm) {
            const categoryInput = budgetForm.querySelector('input[name="category"]');
            const amountInput = budgetForm.querySelector('input[name="amount"]');
            const actualSpentInput = budgetForm.querySelector('input[name="actualSpent"]');
            
            if (categoryInput) categoryInput.value = category;
            if (amountInput) amountInput.value = state.budgets[category] || '';
            
            // Get current actual spent value
            let currentActualSpent = 0;
            if (state.budgetTracking && state.budgetTracking[currentMonth] && state.budgetTracking[currentMonth][category]) {
                currentActualSpent = state.budgetTracking[currentMonth][category].actualSpent;
            }
            if (actualSpentInput) actualSpentInput.value = currentActualSpent;
            
            // Change button text to indicate editing
            const submitBtn = budgetForm.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.textContent = 'Update Budget';
            
            // Scroll to budget form
            budgetForm.scrollIntoView({ behavior: 'smooth' });
        }
        
        showNotification(`Editing budget for ${category}`, 'info');
    };

    window.deleteBudget = function(category) {
        if (confirm('Are you sure you want to delete this budget?')) {
            delete state.budgets[category];
            saveState();
            renderBudgets();
            renderDashboard();
            showNotification('Budget deleted successfully', 'success');
        }
    };
    
    // Quick spending update function
    window.quickUpdateSpending = function(category) {
        const newSpending = prompt(`Enter actual spending for ${category} this month:`, '0');
        if (newSpending !== null) {
            const amount = parseInt(newSpending) || 0;
            
            // Update budget tracking
            if (!state.budgetTracking) state.budgetTracking = {};
            if (!state.budgetTracking[currentMonth]) state.budgetTracking[currentMonth] = {};
            
            if (!state.budgetTracking[currentMonth][category]) {
                state.budgetTracking[currentMonth][category] = {
                    budget: state.budgetTracking[currentMonth][category]?.budget || state.budgets[category] || 0,
                    actualSpent: 0,
                    lastUpdated: new Date().toISOString()
                };
            }
            
            state.budgetTracking[currentMonth][category].actualSpent = amount;
            state.budgetTracking[currentMonth][category].lastUpdated = new Date().toISOString();
            
            saveState();
            
            // Update displays
            renderBudgets();
            renderDashboard();
            
            showNotification(`Spending updated for ${category}`, 'success');
        }
    };
    
    // Category management global functions
    window.editCategory = function(category) {
        console.log('Edit category:', category);
        showNotification('Edit category functionality coming soon', 'info');
    };

    window.deleteCategory = function(category) {
        if (confirm(`Are you sure you want to delete the category "${category}"? This will also remove it from all transactions.`)) {
            // Remove category from categories list
            state.categories = state.categories.filter(cat => cat !== category);
            
            // Remove category from budgets
            if (state.budgets[category]) {
                delete state.budgets[category];
            }
            
            // Update all transactions to use "Other" category instead
            Object.keys(state.tx).forEach(month => {
                state.tx[month].forEach(tx => {
                    if (tx.category === category) {
                        tx.category = 'Other';
                    }
                });
            });
            
            saveState();
            
            // Update displays
            updateCategoryLists();
            renderCategories();
            renderDashboard();
            renderTransactions();
            renderBudgets();
            
            showNotification(`Category "${category}" deleted successfully`, 'success');
        }
    };
    
    // Test functions
    window.testTabSwitch = function(tabId) {
        console.log('🧪 Testing tab switch to:', tabId);
        openTab(tabId);
    };
    
    window.testTabs = function() {
        console.log('🧪 Testing tab functionality...');
        const tabs = document.querySelectorAll('.tab');
        console.log('Found tabs:', tabs.length);
        tabs.forEach(tab => {
            console.log(`- Tab: ${tab.dataset.view}, Active: ${tab.classList.contains('active')}`);
        });
    };
    
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
    
<<<<<<< HEAD
    // Data management functions
    window.exportData = function() {
        const data = JSON.stringify(state, null, 2);
        const blob = new Blob([data], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `yen-budget-${currentMonth}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('Data exported successfully!', 'success');
    };
    
    window.importData = function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            try {
                const file = e.target.files[0];
                const text = await file.text();
                const importedData = JSON.parse(text);
                
                // Merge imported data with current state
                Object.assign(state, importedData);
                saveState();
                
                // Refresh all displays
                renderDashboard();
                renderBudgets();
                renderTransactions();
                updateCategoryLists();
                renderCategories();
                
                showNotification('Data imported successfully!', 'success');
            } catch (error) {
                showNotification('Failed to import data: ' + error.message, 'error');
            }
        };
        input.click();
    };
    
    window.clearAllData = function() {
        if (confirm('⚠️ This will delete ALL your data permanently!\n\nAre you sure you want to continue?')) {
            localStorage.removeItem('yenBudgetManager');
            location.reload();
        }
    };
    
    window.viewRawData = function() {
        const data = JSON.stringify(state, null, 2);
        const newWindow = window.open('', '_blank');
        newWindow.document.write(`
            <html>
                <head><title>Raw Data - Yen Budget Manager</title></head>
                <body>
                    <h1>Raw Application Data</h1>
                    <pre style="background: #f5f5f5; padding: 20px; border-radius: 5px; overflow-x: auto;">${data}</pre>
                    <button onclick="window.close()">Close</button>
                </body>
            </html>
        `);
    };
    
=======
>>>>>>> 0c470c388bcb89f1f97e2ae829b67e0ac708f136
    // Initialize the application
    function init() {
        console.log('🚀 Initializing Yen Budget Manager (Simple)...');
        
        try {
            // Apply theme
            applyTheme();
            
            // Initialize theme controls
            initializeThemeControls();
            
            // Setup event listeners
            setupEventListeners();
            
            // Setup form handlers
            setupFormHandlers();
            
            // Add sample data if none exists
            if (allTx().length === 0) {
                addSampleData();
            }
            
            // Update category lists and render categories
            updateCategoryLists();
            renderCategories();
            
            // Ensure proper tab state
            const activeTab = state.activeTab || 'dashboard';
            openTab(activeTab);
            
            console.log('✅ App initialization complete');
            
        } catch (error) {
            console.error('❌ Error during app initialization:', error);
        }
    }
    
    // Add sample data for testing
    function addSampleData() {
        console.log('📝 Adding sample data...');
        
        // Add sample transactions
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
            },
            {
                id: 'sample-3',
                type: 'expense',
                category: 'Transport',
                amount: 8000,
                date: currentDate,
                note: 'Train pass'
            }
        ];
        
        sampleTx.forEach(tx => addTx(tx));
        
        // Add sample budgets
        state.budgets = {
            'Food': 50000,
            'Transport': 20000,
            'Entertainment': 30000
        };
        
        // Add sample budget tracking
        state.budgetTracking = {
            [currentMonth]: {
                'Food': {
                    budget: 50000,
                    actualSpent: 15000,
                    lastUpdated: new Date().toISOString()
                },
                'Transport': {
                    budget: 20000,
                    actualSpent: 8000,
                    lastUpdated: new Date().toISOString()
                },
                'Entertainment': {
                    budget: 30000,
                    actualSpent: 0,
                    lastUpdated: new Date().toISOString()
                }
            }
        };
        
        // Add sample goals
        state.goals = {
            income: 500000,
            rate: 20
        };
        
        saveState();
        console.log('✅ Sample data added');
    }
    
    // Start the app when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();

/* script.js - Yen Budget Manager (English, Light/Dark, LocalStorage) */
(() => {
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
        budgets: {
            'Transport': {
                amount: 10000,
                manualSpent: 0,
                autoSpent: 0
            },
            'Food': {
                amount: 10000,
                manualSpent: 0,
                autoSpent: 0
            }
        },
        goal: {
            income: 150000,
            rate: 20
        }
    };

    // State management
    let state = JSON.parse(localStorage.getItem(KEY) || 'null') || { ...defaultState };
    
    function save() {
        localStorage.setItem(KEY, JSON.stringify(state));
    }

    // Theme management
    function applyTheme() {
        document.documentElement.classList.toggle('dark', state.theme === 'dark');
        const btn = byId('toggleTheme');
        if (btn) btn.textContent = state.theme === 'dark' ? '☀️' : '🌙';
    }

    // Core functions
    function addTx(tx) {
        const month = ym(tx.date);
        if (!state.tx[month]) state.tx[month] = [];
        state.tx[month].push(tx);
        save();
    }

    function allTx() {
        const allTransactions = Object.values(state.tx).flat();
        console.log('📋 All transactions from state:', state.tx);
        console.log('📊 Flattened transactions:', allTransactions);
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
                const isActive = t.dataset.view === id;
                t.classList.toggle('active', isActive);
                console.log(`Tab ${t.dataset.view}: ${isActive ? 'active' : 'inactive'}`);
            });
            
            // Hide ALL sections first, then show only the target
            const allSections = els('main > section');
            console.log('🔍 Found sections:', allSections.length);
            
            allSections.forEach(s => {
                // Hide all sections
                s.style.display = 'none';
                s.classList.add('hidden');
                console.log(`Section ${s.id}: hidden`);
            });
            
            // Show only the target section
            if (targetSection) {
                targetSection.style.display = 'block';
                targetSection.classList.remove('hidden');
                console.log(`Section ${id}: visible`);
            }
            
            // Handle specific tab actions
            if (id === 'dashboard') {
                console.log('📊 Rendering dashboard...');
                drawDashboard();
            }
            if (id === 'transactions') {
                console.log('📝 Rendering transactions...');
                renderTxTable();
            }
            if (id === 'budgets') {
                console.log('💰 Rendering budgets...');
                renderBudgets();
            }
            if (id === 'reports') {
                console.log('📈 Rendering reports...');
                renderReports();
            }
            if (id === 'settings') {
                console.log('⚙️ Rendering settings...');
                renderSettings();
            }
            
            console.log('✅ Tab switch completed successfully');
            
            // Scroll to top for better UX
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
        } catch (error) {
            console.error('❌ Error in openTab:', error);
            console.error('❌ Error details:', {
                id: id,
                error: error.message,
                stack: error.stack
            });
        }
    }

    // Dashboard rendering
    function drawDashboard() {
        // Ensure we have sample data for dashboard display
        if (allTx().length === 0) {
            addSampleDataForDashboard();
        }
        
        const month = ym(new Date());
        const totals = totalsForMonth(month);
        const kpis = byId('kpis');
        
        if (kpis) {
            kpis.innerHTML = `
                <div class="kpi-item">
                    <div class="kpi-icon">💰</div>
                    <div class="kpi-content">
                        <h4>Total Income</h4>
                        <div class="kpi-value">${fmt.format(totals.income)}</div>
                        <div class="kpi-change positive">
                            <span class="trend-icon">📈</span>
                            +${totals.income > 0 ? Math.round((totals.income / (totals.income + totals.expense)) * 100) : 0}%
                        </div>
                    </div>
                </div>
                <div class="kpi-item">
                    <div class="kpi-icon">💸</div>
                    <div class="kpi-content">
                        <h4>Total Expenses</h4>
                        <div class="kpi-value">${fmt.format(totals.expense)}</div>
                        <div class="kpi-change negative">
                            <span class="trend-icon">📉</span>
                            ${totals.expense > 0 ? Math.round((totals.expense / (totals.income + totals.expense)) * 100) : 0}%
                        </div>
                    </div>
                </div>
                <div class="kpi-item">
                    <div class="kpi-icon">🏦</div>
                    <div class="kpi-content">
                        <h4>Net Savings</h4>
                        <div class="kpi-value">${fmt.format(totals.savings)}</div>
                        <div class="kpi-change ${totals.savings >= 0 ? 'positive' : 'negative'}">
                            <span class="trend-icon">${totals.savings >= 0 ? '📈' : '📉'}</span>
                            ${totals.income > 0 ? Math.round((totals.savings / totals.income) * 100) : 0}% of income
                        </div>
                    </div>
                </div>
                <div class="kpi-item">
                    <div class="kpi-icon">📊</div>
                    <div class="kpi-content">
                        <h4>Daily Burn Rate</h4>
                        <div class="kpi-value">${fmt.format(Math.round(totals.expense / 30))}</div>
                        <div class="kpi-change">
                            <span class="trend-icon">⏰</span>
                            30 days left
                        </div>
                    </div>
                </div>
                <div class="kpi-item">
                    <div class="kpi-icon">🎯</div>
                    <div class="kpi-content">
                        <h4>Budget Utilization</h4>
                        <div class="kpi-value">${totals.expense > 0 ? Math.round((totals.expense / (totals.income * 0.8)) * 100) : 0}%</div>
                        <div class="kpi-change ${totals.expense > totals.income * 0.8 ? 'negative' : 'positive'}">
                            <span class="trend-icon">${totals.expense > totals.income * 0.8 ? '⚠️' : '✅'}</span>
                            ${totals.expense > totals.income * 0.8 ? 'Over budget' : 'On track'}
                        </div>
                    </div>
                </div>
                <div class="kpi-item">
                    <div class="kpi-icon">💎</div>
                    <div class="kpi-content">
                        <h4>Savings Rate</h4>
                        <div class="kpi-value">${totals.income > 0 ? Math.round((totals.savings / totals.income) * 100) : 0}%</div>
                        <div class="kpi-change ${totals.savings >= totals.income * 0.2 ? 'positive' : 'negative'}">
                            <span class="trend-icon">${totals.savings >= totals.income * 0.2 ? '🎉' : '💡'}</span>
                            ${totals.savings >= totals.income * 0.2 ? 'Excellent!' : 'Room to improve'}
                        </div>
                    </div>
                </div>
            `;
        }

        // Update month tag
        const monthTag = byId('monthTag');
        if (monthTag) {
            monthTag.textContent = monthName(month);
        }

        // Update current month display
        updateCurrentMonthDisplay();

        // Update transaction count
        updateTransactionCount();

        // Update savings overview
        updateSavingsOverview(totals);

        // Update goal note
        updateGoalNote();

        // Fill recent transactions
        fillRecentTransactions();
        updateUpcomingRecurring();
        updateBudgetStatus();
        updateFinancialInsights(Math.round((totals.income / (totals.income + totals.expense)) * 100));
        
        // Initialize financial chart
        initializeFinancialChart();
        
        // Update budget overview
        updateBudgetOverview();
        
        // Update insights
        updateDashboardInsights();
    }

    // Update current month display
    function updateCurrentMonthDisplay() {
        const currentMonthDisplay = byId('currentMonthDisplay');
        if (currentMonthDisplay) {
            const now = new Date();
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                               'July', 'August', 'September', 'October', 'November', 'December'];
            currentMonthDisplay.textContent = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
        }
    }

    // Initialize financial chart
    function initializeFinancialChart() {
        const chartCanvas = byId('financialChart');
        if (!chartCanvas) return;
        
        const ctx = chartCanvas.getContext('2d');
        if (!ctx) return;
        
        // Get last 30 days of data
        const data = getLast30DaysData();
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Income',
                    data: data.income,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Expenses',
                    data: data.expenses,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-light')
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary')
                        }
                    },
                    y: {
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-light')
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                            callback: function(value) {
                                return '¥' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    // Get last 30 days data for chart
    function getLast30DaysData() {
        const labels = [];
        const income = [];
        const expenses = [];
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            labels.push(dateStr);
            
            // Get data for this date (simplified - you can enhance this)
            const dayData = getDayData(date);
            income.push(dayData.income);
            expenses.push(dayData.expenses);
        }
        
        return { labels, income, expenses };
    }

    // Get data for a specific day
    function getDayData(date) {
        const dateStr = date.toISOString().split('T')[0];
        const transactions = allTx().filter(tx => tx.date === dateStr);
        
        let income = 0;
        let expenses = 0;
        
        transactions.forEach(tx => {
            if (tx.type === 'income') {
                income += parseFloat(tx.amount);
            } else {
                expenses += parseFloat(tx.amount);
            }
        });
        
        return { income, expenses };
    }

    // Update budget overview
    function updateBudgetOverview() {
        const budgetOverview = byId('budgetOverview');
        if (!budgetOverview) return;
        
        const budgets = state.budgets || {};
        const month = ym(new Date());
        const totals = totalsForMonth(month);
        
        let budgetHTML = '';
        
        if (Object.keys(budgets).length === 0) {
            budgetHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <p>No budgets set yet</p>
                    <button class="btn primary" onclick="openTab('budgets')">Set Budget</button>
                </div>
            `;
        } else {
            Object.entries(budgets).forEach(([category, budget]) => {
                const spent = categorySpend(month, category);
                const percentage = (spent / budget) * 100;
                const status = percentage > 100 ? 'Over Budget' : percentage > 80 ? 'Warning' : 'On Track';
                const statusColor = percentage > 100 ? 'negative' : percentage > 80 ? 'warning' : 'positive';
                
                budgetHTML += `
                    <div class="budget-item">
                        <div class="budget-category">${category}</div>
                        <div class="budget-amount">${fmt.format(spent)} / ${fmt.format(budget)}</div>
                        <div class="budget-progress">
                            <div class="budget-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                        </div>
                        <div class="budget-status ${statusColor}">${status}</div>
                    </div>
                `;
            });
        }
        
        budgetOverview.innerHTML = budgetHTML;
    }

    // Update dashboard insights
    function updateDashboardInsights() {
        const insightsContainer = byId('insightsContainer');
        if (!insightsContainer) return;
        
        const month = ym(new Date());
        const totals = totalsForMonth(month);
        const insights = generateDashboardInsights(totals);
        
        let insightsHTML = '';
        insights.forEach(insight => {
            insightsHTML += `
                <div class="insight-item">
                    <div class="insight-icon">${insight.icon}</div>
                    <div class="insight-content">
                        <div class="insight-title">${insight.title}</div>
                        <div class="insight-description">${insight.description}</div>
                    </div>
                </div>
            `;
        });
        
        insightsContainer.innerHTML = insightsHTML;
    }

    // Generate dashboard insights
    function generateDashboardInsights(totals) {
        const insights = [];
        
        if (totals.savings >= totals.income * 0.3) {
            insights.push({
                icon: '🎉',
                title: 'Excellent Savings Rate',
                description: 'You\'re saving over 30% of your income. Keep up the great work!'
            });
        } else if (totals.savings < 0) {
            insights.push({
                icon: '⚠️',
                title: 'Negative Savings',
                description: 'Consider reviewing your expenses to improve your financial health.'
            });
        }
        
        if (totals.expense > totals.income * 0.8) {
            insights.push({
                icon: '💡',
                title: 'Budget Review Needed',
                description: 'Your expenses are high relative to income. Consider setting stricter budgets.'
            });
        }
        
        if (totals.income > 0 && totals.expense > 0) {
            const ratio = totals.expense / totals.income;
            if (ratio < 0.5) {
                insights.push({
                    icon: '🚀',
                    title: 'High Savings Potential',
                    description: 'You have room to save even more. Consider increasing your savings goals.'
                });
            }
        }
        
        if (insights.length === 0) {
            insights.push({
                icon: '✅',
                title: 'Good Financial Health',
                description: 'Your finances are in good shape. Keep monitoring and adjusting as needed.'
            });
        }
        
        return insights.slice(0, 3); // Show max 3 insights
    }

    // Update transaction count
    function updateTransactionCount() {
        const transactionCount = byId('transactionCount');
        if (!transactionCount) return;
        
        const allTransactions = allTx();
        const count = allTransactions.length;
        
        if (count === 0) {
            transactionCount.textContent = 'No transactions yet';
        } else if (count === 1) {
            transactionCount.textContent = '1 transaction';
        } else {
            transactionCount.textContent = `${count} transactions`;
        }
    }

    // Update savings overview
    function updateSavingsOverview(totals) {
        const totalSaved = byId('totalSaved');
        const savingsRate = byId('savingsRate');
        const monthlyGoal = byId('monthlyGoal');
        const daysCompleted = byId('daysCompleted');
        const daysRemaining = byId('daysRemaining');
        const monthProgress = byId('monthProgress');
        
        if (totalSaved) totalSaved.textContent = fmt.format(totals.savings);
        if (savingsRate) {
            const rate = totals.income > 0 ? Math.round((totals.savings / totals.income) * 100) : 0;
            savingsRate.textContent = `${rate}%`;
        }
        if (monthlyGoal) {
            const targetSavings = (state.goal.income * state.goal.rate) / 100;
            monthlyGoal.textContent = `${fmt.format(totals.savings)} / ${fmt.format(targetSavings)}`;
        }
        
        // Update month progress
        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const daysPassed = today.getDate();
        const remainingDays = daysInMonth - daysPassed;
        
        if (daysCompleted) daysCompleted.textContent = daysPassed.toString();
        if (daysRemaining) daysRemaining.textContent = remainingDays.toString();
        if (monthProgress) monthProgress.style.width = `${(daysPassed / daysInMonth) * 100}%`;
    }

    function fillRecentTransactions() {
        const recentTransactionsList = byId('recentTransactionsList');
        if (!recentTransactionsList) {
            console.log('❌ Recent transactions list not found');
            return;
        }

        const recent = allTx().slice(0, 5);
        console.log('📊 Recent transactions to display:', recent);
        
        let transactionsHTML = '';
        
        if (recent.length === 0) {
            transactionsHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📄</div>
                    <p>No transactions yet</p>
                </div>
            `;
        } else {
            recent.forEach(t => {
                const icon = t.type === 'income' ? '💰' : '💸';
                const amountClass = t.type === 'income' ? 'income' : 'expense';
                
                transactionsHTML += `
                    <div class="transaction-item">
                        <div class="transaction-icon">${icon}</div>
                        <div class="transaction-details">
                            <div class="transaction-title">${t.category}</div>
                            <div class="transaction-meta">${t.date} • ${t.note || 'No note'}</div>
                        </div>
                        <div class="transaction-amount ${amountClass}">${(t.type === 'income' ? '+' : '-') + fmt.format(t.amount)}</div>
                    </div>
                `;
            });
        }
        
        recentTransactionsList.innerHTML = transactionsHTML;
        console.log('✅ Recent transactions rendered successfully');
        
        // Update transaction summary
        updateTransactionSummary();
    }

    // Update transaction summary
    function updateTransactionSummary() {
        const monthlyTotal = byId('monthlyTotal');
        const transactionCount = byId('transactionCount');
        
        if (monthlyTotal || transactionCount) {
            const month = ym(new Date());
            const totals = totalsForMonth(month);
            const allTransactions = allTx();
            const monthTransactions = allTransactions.filter(tx => ym(new Date(tx.date)) === month);
            
            if (monthlyTotal) {
                monthlyTotal.textContent = fmt.format(totals.income - totals.expense);
            }
            
            if (transactionCount) {
                transactionCount.textContent = monthTransactions.length;
            }
        }
    }

    // Transaction table rendering
    function renderTxTable() {
        const tbody = byId('txTable')?.querySelector('tbody');
        if (!tbody) return;

        const rows = allTx().slice().sort((a, b) => b.date.localeCompare(a.date));
        tbody.innerHTML = '';
        
        for (const t of rows) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${t.date}</td>
                <td>${t.type === 'expense' ? '<span class="chip danger">Expense</span>' : '<span class="chip ok">Income</span>'}</td>
                <td>${t.category}</td>
                <td>${t.note || ''}</td>
                <td class="right">${(t.type === 'expense' ? '-' : '+') + fmt.format(t.amount)}</td>
                <td>
                    <button class="btn" data-act="edit">✏️</button>
                    <button class="btn danger" data-act="del">🗑️</button>
                </td>
            `;
            
            // Add event listeners
            tr.querySelector('[data-act="edit"]').addEventListener('click', () => editTx(t));
            tr.querySelector('[data-act="del"]').addEventListener('click', () => {
                if (confirm('Delete this transaction?')) {
                    deleteTx(t.id);
                    renderAll();
                }
            });
            
            tbody.appendChild(tr);
        }
    }

    function editTx(t) {
        openTab('transactions');
        const form = byId('txForm');
        if (form) {
            form.type.value = t.type;
            form.category.value = t.category;
            form.amount.value = t.amount;
            form.date.value = t.date;
            form.note.value = t.note || '';
            form.recurring.value = t.recurring || 'none';
            form.next.value = t.next || '';
        }
    }

    function deleteTx(id) {
        for (const month in state.tx) {
            const idx = state.tx[month].findIndex(t => t.id === id);
            if (idx >= 0) {
                state.tx[month].splice(idx, 1);
                if (!state.tx[month].length) delete state.tx[month];
                break;
            }
        }
        save();
    }

    // Budget rendering
    function renderBudgets() {
        const tbody = byId('budgetTableBody');
        if (!tbody) return;

        const month = ym(new Date());
        const spend = categorySpend(month);
        const budgets = Object.keys(state.budgets);
        
        tbody.innerHTML = '';
        
        for (const category of budgets) {
            const budget = state.budgets[category];
            const budgetAmount = typeof budget === 'object' ? budget.amount : budget;
            const autoSpent = spend[category] || 0;
            const manualSpent = typeof budget === 'object' ? (budget.manualSpent || 0) : 0;
            const totalSpent = autoSpent + manualSpent;
            const remaining = budgetAmount - totalSpent;
            const percentage = (totalSpent / budgetAmount) * 100;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${category}</td>
                <td>${fmt.format(budgetAmount)}</td>
                <td>
                    <div class="spent-input-container">
                        <input type="number" 
                               class="spent-input" 
                               value="${manualSpent}" 
                               min="0" 
                               step="1"
                               data-category="${category}"
                               placeholder="0"
                               title="Manual spent amount">
                        <div class="spent-breakdown">
                            <small>Auto: ${fmt.format(autoSpent)}</small>
                            <small>Total: ${fmt.format(totalSpent)}</small>
                        </div>
                    </div>
                </td>
                <td>${fmt.format(remaining)}</td>
                <td><span class="chip ${percentage >= 90 ? 'danger' : percentage >= 75 ? 'warn' : 'ok'}">${Math.round(percentage)}%</span></td>
                <td>
                    <button class="btn danger delete-budget-btn" data-category="${category}" title="Delete Budget">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        }
        
        // Add event listeners for spent inputs
        setupSpentInputs();
        
        // Update savings categories
        updateSavingsCategories(spend, budgets);
        
        // Fallback: Ensure delete buttons work
        setTimeout(() => {
            console.log('🔄 Fallback: Re-checking delete budget buttons...');
            const deleteBudgetBtns = document.querySelectorAll('.delete-budget-btn');
            deleteBudgetBtns.forEach(btn => {
                if (!btn.onclick) {
                    console.log(`🔄 Re-setting up delete button for: ${btn.dataset.category}`);
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const category = e.target.dataset.category;
                        if (category) {
                            deleteBudget(category);
                        }
                    });
                }
            });
        }, 100);
    }

    // Setup event listeners for spent inputs
    function setupSpentInputs() {
        const spentInputs = document.querySelectorAll('.spent-input');
        spentInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const category = e.target.dataset.category;
                const newAmount = Math.round(Number(e.target.value || 0));
                
                if (newAmount >= 0) {
                    updateManualSpent(category, newAmount);
                } else {
                    e.target.value = 0;
                }
            });
            
            input.addEventListener('blur', (e) => {
                const category = e.target.dataset.category;
                const newAmount = Math.round(Number(e.target.value || 0));
                
                if (newAmount >= 0) {
                    updateManualSpent(category, newAmount);
                } else {
                    e.target.value = 0;
                }
            });
        });

        // Setup delete budget buttons
        const deleteBudgetBtns = document.querySelectorAll('.delete-budget-btn');
        console.log(`🔍 Found ${deleteBudgetBtns.length} delete budget buttons`);
        deleteBudgetBtns.forEach(btn => {
            console.log(`🗑️ Setting up delete button for category: ${btn.dataset.category}`);
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const category = e.target.dataset.category;
                console.log(`🗑️ Delete button clicked for category: ${category}`);
                if (category) {
                    deleteBudget(category);
                } else {
                    console.warn('⚠️ No category found for delete button');
                }
            });
        });
    }

    // Update manual spent amount for a category
    function updateManualSpent(category, amount) {
        if (!state.budgets[category]) return;
        
        // Ensure budget is an object
        if (typeof state.budgets[category] !== 'object') {
            state.budgets[category] = {
                amount: state.budgets[category],
                manualSpent: 0,
                autoSpent: 0
            };
        }
        
        state.budgets[category].manualSpent = amount;
        save();
        renderBudgets();
        showNotification(`Manual spent amount updated for ${category}!`, 'success');
    }

    // Update savings categories
    function updateSavingsCategories(spend, budgets) {
        const savingsCategories = byId('savingsCategories');
        if (!savingsCategories) return;
        
        if (budgets.length === 0) {
            savingsCategories.innerHTML = '<div class="empty-state">No budgets set</div>';
            return;
        }
        
        let savingsHTML = '';
        for (const category of budgets) {
            const budget = state.budgets[category];
            const budgetAmount = typeof budget === 'object' ? budget.amount : budget;
            const autoSpent = spend[category] || 0;
            const manualSpent = typeof budget === 'object' ? (budget.manualSpent || 0) : 0;
            const totalSpent = autoSpent + manualSpent;
            const remaining = budgetAmount - totalSpent;
            
            if (remaining > 0) {
                const percentage = Math.round((remaining / budgetAmount) * 100);
                savingsHTML += `
                    <div class="savings-category-item">
                        <span class="savings-category-name">${category}</span>
                        <span class="savings-category-amount">${fmt.format(remaining)}</span>
                        <span class="savings-category-percentage">${percentage}%</span>
                    </div>
                `;
            }
        }
        
        savingsCategories.innerHTML = savingsHTML || '<div class="empty-state">No savings available</div>';
    }

    // Add delete budget function
    function deleteBudget(category) {
        console.log(`🗑️ deleteBudget called for category: ${category}`);
        console.log(`🗑️ Current budgets:`, state.budgets);
        
        if (confirm(`Delete budget for "${category}"? This will remove the budget but keep any transactions.`)) {
            console.log(`🗑️ User confirmed deletion of budget for: ${category}`);
            delete state.budgets[category];
            console.log(`🗑️ Budget deleted. New budgets:`, state.budgets);
            save();
            renderBudgets();
            showNotification(`Budget for ${category} deleted successfully!`, 'success');
        } else {
            console.log(`🗑️ User cancelled deletion of budget for: ${category}`);
        }
    }

    // Settings rendering
    function renderSettings() {
        // Category management
        const categoryGrid = byId('defaultCategories');
        if (categoryGrid) {
            categoryGrid.innerHTML = state.categories.map(cat => `
                <div class="category-item">
                    <span class="category-name">${cat}</span>
                    <button class="btn danger" onclick="deleteCategory('${cat}')">🗑️</button>
                </div>
            `).join('');
        }

        // Update category count
        const categoryCount = byId('categoryCount');
        if (categoryCount) {
            const totalCategories = state.categories.length;
            const usedCategories = new Set(allTx().map(tx => tx.category)).size;
            categoryCount.textContent = `${totalCategories} categories`;
            
            // Update the usage display
            const usageElement = document.querySelector('.category-usage');
            if (usageElement) {
                usageElement.textContent = `${usedCategories} in use`;
            }
        }
    }

    function deleteCategory(category) {
        // Check if category is in use
        const isInUse = allTx().some(tx => tx.category === category);
        
        if (isInUse) {
            showNotification(`Cannot delete category "${category}" - it's currently in use by transactions.`, 'warning');
            return;
        }
        
        if (confirm(`Delete category "${category}"?`)) {
            state.categories = state.categories.filter(c => c !== category);
            save();
            renderSettings();
            showNotification(`Category "${category}" deleted successfully!`, 'success');
        }
    }

    // Make deleteCategory globally accessible
    window.deleteCategory = deleteCategory;

    // Enhanced Reports rendering
    function renderReports() {
        console.log('📊 Rendering enhanced reports...');
        
        // Initialize report period display
        updateReportPeriodDisplay();
        
        // Initialize summary cards
        updateSummaryCards();
        
        // Initialize enhanced charts
        initializeEnhancedCharts();
        
        // Initialize budget performance
        updateBudgetPerformanceEnhanced();
        
        // Initialize year-over-year analysis
        updateYearOverYearAnalysis();
        
        // Initialize financial insights
        updateFinancialInsights();
        
        // Setup report controls
        setupEnhancedReportControls();
        
        console.log('✅ Enhanced reports rendered successfully');
    }

    // Update report period display
    function updateReportPeriodDisplay() {
        const reportPeriodDisplay = byId('reportPeriodDisplay');
        if (reportPeriodDisplay) {
            const currentDate = new Date();
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                               'July', 'August', 'September', 'October', 'November', 'December'];
            const month = monthNames[currentDate.getMonth()];
            const year = currentDate.getFullYear();
            reportPeriodDisplay.textContent = `${month} ${year}`;
        }
    }

    // Update summary cards with enhanced data
    function updateSummaryCards() {
        const currentMonth = ym(new Date());
        const totals = totalsForMonth(currentMonth);
        const previousMonth = getPreviousMonth(currentMonth);
        const previousTotals = totalsForMonth(previousMonth);
        
        // Calculate changes
        const incomeChange = previousTotals.income > 0 ? 
            ((totals.income - previousTotals.income) / previousTotals.income) * 100 : 0;
        const expenseChange = previousTotals.expense > 0 ? 
            ((totals.expense - previousTotals.expense) / previousTotals.expense) * 100 : 0;
        const savingsChange = previousTotals.income > 0 ? 
            (((totals.income - totals.expense) - (previousTotals.income - previousTotals.expense)) / 
             (previousTotals.income - previousTotals.expense)) * 100 : 0;
        
        // Update summary values
        updateSummaryCard('summaryIncome', totals.income, incomeChange);
        updateSummaryCard('summaryExpense', totals.expense, expenseChange);
        updateSummaryCard('summarySavings', totals.income - totals.expense, savingsChange);
        
        // Calculate and update savings rate
        const savingsRate = totals.income > 0 ? ((totals.income - totals.expense) / totals.income) * 100 : 0;
        const previousSavingsRate = previousTotals.income > 0 ? 
            ((previousTotals.income - previousTotals.expense) / previousTotals.income) * 100 : 0;
        const savingsRateChange = previousSavingsRate > 0 ? 
            ((savingsRate - previousSavingsRate) / previousSavingsRate) * 100 : 0;
        
        updateSummaryCard('summarySavingsRate', `${savingsRate.toFixed(1)}%`, savingsRateChange);
    }

    // Update individual summary card
    function updateSummaryCard(id, value, change) {
        const valueElement = byId(id);
        const changeElement = byId(id + 'Change');
        
        if (valueElement) {
            if (typeof value === 'number') {
                valueElement.textContent = `¥${fmt.format(value)}`;
            } else {
                valueElement.textContent = value;
            }
        }
        
        if (changeElement) {
            const changeText = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
            changeElement.textContent = changeText;
            changeElement.className = `summary-change ${change >= 0 ? 'positive' : 'negative'}`;
        }
    }

    // Get previous month
    function getPreviousMonth(currentMonth) {
        const [year, month] = currentMonth.split('-').map(Number);
        if (month === 1) {
            return `${year - 1}-12`;
        } else {
            return `${year}-${String(month - 1).padStart(2, '0')}`;
        }
    }

    // Initialize enhanced charts
    function initializeEnhancedCharts() {
        // Financial Overview Chart
        initializeFinancialOverviewChart();
        
        // Category Distribution Chart
        initializeCategoryDistributionChart();
        
        // Monthly Trends Chart
        initializeMonthlyTrendsChart();
        
        // Budget Performance Chart
        initializeBudgetPerformanceChart();
    }

    // Initialize Financial Overview Chart
    function initializeFinancialOverviewChart() {
        const ctx = document.getElementById('financialOverviewChart');
        if (!ctx) return;
        
        const data = getLast30DaysData();
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Income',
                        data: data.income,
                        borderColor: '#22c55e',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Expenses',
                        data: data.expenses,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Savings',
                        data: data.savings,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }
            }
        });
    }

    // Initialize Category Distribution Chart
    function initializeCategoryDistributionChart() {
        const ctx = document.getElementById('categoryDistributionChart');
        if (!ctx) return;
        
        const data = getCategoryDistributionData();
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
                        '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    // Get category distribution data
    function getCategoryDistributionData() {
        const currentMonth = ym(new Date());
        const transactions = allTx().filter(tx => ym(new Date(tx.date)) === currentMonth && tx.type === 'expense');
        
        const categoryTotals = {};
        transactions.forEach(tx => {
            categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
        });
        
        const sortedCategories = Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8);
        
        return {
            labels: sortedCategories.map(([category]) => category),
            values: sortedCategories.map(([, amount]) => amount)
        };
    }

    // Initialize Monthly Trends Chart
    function initializeMonthlyTrendsChart() {
        const ctx = document.getElementById('monthlyTrendsChart');
        if (!ctx) return;
        
        const data = getMonthlyTrendsData(12);
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Income',
                        data: data.income,
                        backgroundColor: '#22c55e',
                        borderRadius: 4
                    },
                    {
                        label: 'Expenses',
                        data: data.expenses,
                        backgroundColor: '#ef4444',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Get monthly trends data
    function getMonthlyTrendsData(months) {
        const data = { labels: [], income: [], expenses: [] };
        const currentDate = new Date();
        
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthKey = ym(date);
            const totals = totalsForMonth(monthKey);
            
            data.labels.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
            data.income.push(totals.income);
            data.expenses.push(totals.expense);
        }
        
        return data;
    }

    // Initialize Budget Performance Chart
    function initializeBudgetPerformanceChart() {
        const ctx = document.getElementById('budgetPerformanceChart');
        if (!ctx) return;
        
        const data = getBudgetPerformanceData();
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Budget',
                        data: data.budgets,
                        backgroundColor: '#3b82f6',
                        borderRadius: 4
                    },
                    {
                        label: 'Actual',
                        data: data.actuals,
                        backgroundColor: '#22c55e',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Get budget performance data
    function getBudgetPerformanceData() {
        // This would integrate with your budget system
        // For now, using sample data
        return {
            labels: ['Food', 'Transport', 'Entertainment', 'Utilities'],
            budgets: [10000, 8000, 5000, 6000],
            actuals: [8500, 7200, 4800, 5800]
        };
    }

    // Update enhanced budget performance
    function updateBudgetPerformanceEnhanced() {
        const container = byId('budgetPerformanceEnhanced');
        if (!container) return;
        
        const budgetData = getBudgetPerformanceData();
        let html = '';
        
        budgetData.labels.forEach((category, index) => {
            const budget = budgetData.budgets[index];
            const actual = budgetData.actuals[index];
            const remaining = budget - actual;
            const percentage = (actual / budget) * 100;
            
            const remainingClass = remaining >= 0 ? 'positive' : 'negative';
            const percentageClass = percentage <= 100 ? 'positive' : 'negative';
            
            html += `
                <div class="budget-row-enhanced">
                    <div class="budget-category">${category}</div>
                    <div class="budget-amount">¥${fmt.format(budget)}</div>
                    <div class="budget-actual">¥${fmt.format(actual)}</div>
                    <div class="budget-remaining ${remainingClass}">¥${fmt.format(remaining)}</div>
                    <div class="budget-percentage ${percentageClass}">${percentage.toFixed(1)}%</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    // Update year-over-year analysis
    function updateYearOverYearAnalysis() {
        const currentYear = new Date().getFullYear();
        const previousYear = currentYear - 1;
        
        // Calculate YoY changes (simplified for demo)
        const yoyIncomeChange = 15.5; // Example: 15.5% growth
        const yoyExpenseChange = -8.2; // Example: 8.2% decrease
        const yoySavingsChange = 25.3; // Example: 25.3% growth
        
        // Update YoY values
        updateYoYValue('yoyIncomeGrowth', yoyIncomeChange);
        updateYoYValue('yoyExpenseGrowth', yoyExpenseChange);
        updateYoYValue('yoySavingsGrowth', yoySavingsChange);
        
        // Update YoY bars
        updateYoYBar('yoyIncomeBar', yoyIncomeChange);
        updateYoYBar('yoyExpenseBar', yoyExpenseChange);
        updateYoYBar('yoySavingsBar', yoySavingsChange);
    }

    // Update YoY value
    function updateYoYValue(id, change) {
        const element = byId(id);
        if (element) {
            const changeText = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
            element.textContent = changeText;
            element.className = `yoy-value ${change >= 0 ? 'positive' : 'negative'}`;
        }
    }

    // Update YoY bar
    function updateYoYBar(id, change) {
        const element = byId(id);
        if (element) {
            const width = Math.min(Math.abs(change) * 2, 100); // Scale for visualization
            element.style.width = `${width}%`;
        }
    }

    // Update financial insights
    function updateFinancialInsights() {
        const container = byId('financialInsights');
        if (!container) return;
        
        const insights = generateEnhancedInsights();
        let html = '';
        
        insights.forEach(insight => {
            html += `
                <div class="insight-item ${insight.type}">
                    <div class="insight-icon">${insight.icon}</div>
                    <div class="insight-content">
                        <h4>${insight.title}</h4>
                        <p>${insight.description}</p>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    // Generate enhanced insights
    function generateEnhancedInsights() {
        const currentMonth = ym(new Date());
        const totals = totalsForMonth(currentMonth);
        const savingsRate = totals.income > 0 ? ((totals.income - totals.expense) / totals.income) * 100 : 0;
        
        const insights = [];
        
        if (savingsRate >= 20) {
            insights.push({
                type: 'positive',
                icon: '💡',
                title: 'Excellent Savings Rate',
                description: `Your savings rate of ${savingsRate.toFixed(1)}% is above the recommended 20%. Consider increasing investments for long-term growth.`
            });
        } else if (savingsRate >= 10) {
            insights.push({
                type: 'info',
                icon: 'ℹ️',
                title: 'Good Savings Rate',
                description: `Your savings rate of ${savingsRate.toFixed(1)}% is good. Aim to reach 20% for better financial security.`
            });
        } else {
            insights.push({
                type: 'warning',
                icon: '⚠️',
                title: 'Low Savings Rate',
                description: `Your savings rate of ${savingsRate.toFixed(1)}% is below recommended levels. Consider reducing expenses or increasing income.`
            });
        }
        
        // Add more insights based on data analysis
        if (totals.expense > totals.income * 0.8) {
            insights.push({
                type: 'warning',
                icon: '💰',
                title: 'High Expense Ratio',
                description: 'Your expenses are consuming more than 80% of your income. Look for areas to reduce spending.'
            });
        }
        
        if (totals.income > 0 && totals.expense === 0) {
            insights.push({
                type: 'positive',
                icon: '🎯',
                title: 'Perfect Month',
                description: 'No expenses recorded this month. Great job on controlling your spending!'
            });
        }
        
        return insights;
    }

    // Setup enhanced report controls
    function setupEnhancedReportControls() {
        // Period selector
        const periodSelector = byId('reportPeriod');
        if (periodSelector) {
            periodSelector.addEventListener('change', function() {
                console.log('📊 Report period changed to:', this.value);
                updateReportPeriodDisplay();
                // Regenerate report data based on selected period
                updateSummaryCards();
                initializeEnhancedCharts();
            });
        }
        
        // Generate report button
        const generateBtn = byId('generateReport');
        if (generateBtn) {
            generateBtn.addEventListener('click', function() {
                console.log('📊 Generating report...');
                // Add loading state
                this.innerHTML = '<span class="btn-icon">⏳</span> Generating...';
                this.disabled = true;
                
                setTimeout(() => {
                    updateSummaryCards();
                    initializeEnhancedCharts();
                    updateBudgetPerformanceEnhanced();
                    updateYearOverYearAnalysis();
                    updateFinancialInsights();
                    
                    // Reset button
                    this.innerHTML = '<span class="btn-icon">📊</span> Generate Report';
                    this.disabled = false;
                    
                    console.log('✅ Report generated successfully');
                }, 1000);
            });
        }
        
        // Chart type selectors
        const chartTypeSelectors = document.querySelectorAll('.chart-type-selector');
        chartTypeSelectors.forEach(selector => {
            selector.addEventListener('change', function() {
                console.log('📊 Chart type changed to:', this.value);
                // Regenerate chart with new type
                const chartId = this.closest('.chart-card').querySelector('canvas').id;
                regenerateChart(chartId, this.value);
            });
        });
    }

    // Regenerate chart with new type
    function regenerateChart(chartId, chartType) {
        console.log(`📊 Regenerating chart ${chartId} with type ${chartType}`);
        // This would destroy the existing chart and create a new one
        // For now, just log the change
    }

    // Form handling
    function setupFormHandlers() {
        const txForm = byId('txForm');
        if (txForm) {
            txForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const fd = new FormData(txForm);
                const tx = {
                    id: crypto.randomUUID(),
                    type: fd.get('type'),
                    category: (fd.get('category') || '').trim() || 'Other',
                    amount: Math.round(Number(fd.get('amount') || 0)),
                    date: fd.get('date') || today(),
                    note: (fd.get('note') || '').trim(),
                    recurring: fd.get('recurring') || 'none',
                    next: fd.get('next') || null
                };
                
                if (tx.category && !state.categories.includes(tx.category)) {
                    state.categories.push(tx.category);
                }
                
                addTx(tx);
                renderAll();
                txForm.reset();
                showNotification('Transaction added successfully!', 'success');
            });
        }

        // Budget form
        const budgetForm = byId('budgetForm');
        if (budgetForm) {
            budgetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const fd = new FormData(budgetForm);
                const category = fd.get('category');
                const amount = Math.round(Number(fd.get('amount') || 0));
                
                if (category && amount > 0) {
                    state.budgets[category] = {
                        amount: amount,
                        manualSpent: 0,
                        autoSpent: 0
                    };
                    save();
                    renderBudgets();
                    showNotification('Budget set successfully!', 'success');
                    budgetForm.reset();
                }
            });
        }

        // Goal form
        const goalForm = byId('goalForm');
        if (goalForm) {
            goalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const fd = new FormData(goalForm);
                const income = Math.round(Number(fd.get('income') || 0));
                const rate = Math.round(Number(fd.get('rate') || 0));
                
                if (income > 0 && rate >= 0 && rate <= 100) {
                    state.goal.income = income;
                    state.goal.rate = rate;
                    save();
                    renderAll();
                    showNotification('Savings goal updated successfully!', 'success');
                }
            });
        }

        // Income form
        const incomeForm = byId('incomeForm');
        if (incomeForm) {
            incomeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const fd = new FormData(incomeForm);
                const tx = {
                    id: crypto.randomUUID(),
                    type: 'income',
                    category: (fd.get('incomeCategory') || '').trim() || 'Other Income',
                    amount: Math.round(Number(fd.get('incomeAmount') || 0)),
                    date: fd.get('incomeDate') || today(),
                    note: (fd.get('incomeNote') || '').trim(),
                    recurring: 'none',
                    next: null
                };
                
                if (tx.category && tx.amount > 0) {
                    if (!state.categories.includes(tx.category)) {
                        state.categories.push(tx.category);
                    }
                    addTx(tx);
                    renderAll();
                    incomeForm.reset();
                    showNotification('Income added successfully!', 'success');
                }
            });
        }
    }

    // Update goal note
    function updateGoalNote() {
        const goalNote = byId('goalNote');
        if (!goalNote) return;
        
        const month = ym(new Date());
        const totals = totalsForMonth(month);
        const targetSavings = (state.goal.income * state.goal.rate) / 100;
        const currentSavings = totals.savings;
        const progress = targetSavings > 0 ? Math.round((currentSavings / targetSavings) * 100) : 0;
        
        let noteText = '';
        if (progress >= 100) {
            noteText = `🎉 You've exceeded your monthly savings goal by ${fmt.format(currentSavings - targetSavings)}!`;
        } else if (progress >= 75) {
            noteText = `👍 You're ${progress}% to your monthly savings goal. Keep it up!`;
        } else if (progress >= 50) {
            noteText = `📈 You're ${progress}% to your monthly savings goal.`;
        } else if (progress > 0) {
            noteText = `📊 You're ${progress}% to your monthly savings goal.`;
        } else {
            noteText = `💡 Set a monthly income and savings rate to track your progress.`;
        }
        
        goalNote.textContent = noteText;
    }

    // Main rendering function
    function renderAll() {
        drawDashboard();
        renderTxTable();
        renderBudgets();
        renderSettings();
    }

    // Event listeners setup
    function setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Tab navigation event listeners
        const tabs = els('.tab');
        console.log('🔍 Found tabs:', tabs.length);
        
        tabs.forEach(tab => {
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
        });
        
        // Quick action buttons
        const addIncomeBtn = byId('addIncomeBtn');
        const addExpenseBtn = byId('addExpenseBtn');
        const setBudgetBtn = byId('setBudgetBtn');
        const viewReportsBtn = byId('viewReportsBtn');
        const viewAllBtn = byId('viewAllBtn');

        console.log('🔍 Found quick action buttons:', {
            addIncomeBtn: !!addIncomeBtn,
            addExpenseBtn: !!addExpenseBtn,
            setBudgetBtn: !!setBudgetBtn,
            viewReportsBtn: !!viewReportsBtn,
            viewAllBtn: !!viewAllBtn
        });

        // Debug: Log the actual elements
        console.log('🔍 Quick action button elements:', {
            addIncomeBtn: addIncomeBtn,
            addExpenseBtn: addExpenseBtn,
            setBudgetBtn: setBudgetBtn,
            viewReportsBtn: viewReportsBtn,
            viewAllBtn: viewAllBtn
        });

        if (addIncomeBtn) {
            console.log('💰 Setting up Add Income button...');
            addIncomeBtn.addEventListener('click', (e) => {
                console.log('💰 Add Income button clicked!', e);
                e.preventDefault();
                e.stopPropagation();
                openTab('transactions');
                const form = byId('txForm');
                if (form) {
                    form.type.value = 'income';
                    form.category.focus();
                }
            });
            console.log('✅ Add Income button event listener attached');
            
            // Test if the button is clickable
            addIncomeBtn.style.cursor = 'pointer';
            addIncomeBtn.title = 'Click to add income';
        } else {
            console.warn('⚠️ Add Income button not found');
        }

        if (addExpenseBtn) {
            console.log('💸 Setting up Add Expense button...');
            addExpenseBtn.addEventListener('click', (e) => {
                console.log('💸 Add Expense button clicked!', e);
                e.preventDefault();
                e.stopPropagation();
                openTab('transactions');
                const form = byId('txForm');
                if (form) {
                    form.type.value = 'expense';
                    form.category.focus();
                }
            });
            console.log('✅ Add Expense button event listener attached');
            
            // Test if the button is clickable
            addExpenseBtn.style.cursor = 'pointer';
            addExpenseBtn.title = 'Click to add expense';
        } else {
            console.warn('⚠️ Add Expense button not found');
        }

        if (setBudgetBtn) {
            console.log('📊 Setting up Set Budget button...');
            setBudgetBtn.addEventListener('click', (e) => {
                console.log('📊 Set Budget button clicked!', e);
                e.preventDefault();
                e.stopPropagation();
                openTab('budgets');
            });
            console.log('✅ Set Budget button event listener attached');
            
            // Test if the button is clickable
            setBudgetBtn.style.cursor = 'pointer';
            setBudgetBtn.title = 'Click to set budget';
        } else {
            console.warn('⚠️ Set Budget button not found');
        }

        if (viewReportsBtn) {
            console.log('📈 Setting up View Reports button...');
            viewReportsBtn.addEventListener('click', (e) => {
                console.log('📈 View Reports button clicked!', e);
                e.preventDefault();
                e.stopPropagation();
                openTab('reports');
            });
            console.log('✅ View Reports button event listener attached');
            
            // Test if the button is clickable
            viewReportsBtn.style.cursor = 'pointer';
            viewReportsBtn.title = 'Click to view reports';
        } else {
            console.warn('⚠️ View Reports button not found');
        }

        if (viewAllBtn) {
            console.log('👁️ Setting up View All button...');
            viewAllBtn.addEventListener('click', (e) => {
                console.log('👁️ View All button clicked!', e);
                e.preventDefault();
                e.stopPropagation();
                openTab('transactions');
            });
            console.log('✅ View All button event listener attached');
            
            // Test if the button is clickable
            viewAllBtn.style.cursor = 'pointer';
            viewAllBtn.title = 'Click to view all transactions';
        } else {
            console.warn('⚠️ View All button not found');
        }

        // Theme toggle
        const toggleTheme = byId('toggleTheme');
        if (toggleTheme) {
            toggleTheme.addEventListener('click', () => {
                state.theme = state.theme === 'light' ? 'dark' : 'light';
                applyTheme();
                save();
            });
        }

        // Quick add button
        const addQuick = byId('addQuick');
        if (addQuick) {
            addQuick.addEventListener('click', () => openTab('transactions'));
        }

        // Category management
        const addCategoryBtn = byId('addCategoryBtn');
        const newCategoryInput = byId('newCategoryInput');

        if (addCategoryBtn && newCategoryInput) {
            addCategoryBtn.addEventListener('click', () => {
                const category = newCategoryInput.value.trim();
                if (category && !state.categories.includes(category)) {
                    state.categories.push(category);
                    save();
                    renderSettings();
                    newCategoryInput.value = '';
                    showNotification('Category added successfully!', 'success');
                }
            });

            newCategoryInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addCategoryBtn.click();
                }
            });
        }
    }

    // Global test functions for debugging
    window.testDeleteBudget = function(category) {
        console.log(`🧪 Testing deleteBudget for category: ${category}`);
        if (category && state.budgets[category]) {
            deleteBudget(category);
        } else {
            console.warn(`Category "${category}" not found in budgets`);
        }
    };

    // Test tab navigation
    window.testTabNavigation = function() {
        console.log('🧪 Testing tab navigation...');
        
        const allTabs = els('.tab');
        const allSections = els('main > section');
        
        console.log('📊 Tabs found:', allTabs.length);
        allTabs.forEach(tab => {
            console.log(`- Tab: ${tab.dataset.view}, Active: ${tab.classList.contains('active')}`);
        });
        
        console.log('📊 Sections found:', allSections.length);
        allSections.forEach(section => {
            console.log(`- Section: ${section.id}, Hidden: ${section.classList.contains('hidden')}, Display: ${section.style.display}`);
        });
        
        // Test each tab
        allTabs.forEach(tab => {
            const tabId = tab.dataset.view;
            console.log(`🧪 Testing tab: ${tabId}`);
            openTab(tabId);
            
            // Check if section is visible
            setTimeout(() => {
                const section = byId(tabId);
                if (section) {
                    const isVisible = !section.classList.contains('hidden') && section.style.display !== 'none';
                    console.log(`✅ Tab ${tabId}: ${isVisible ? 'VISIBLE' : 'HIDDEN'}`);
                } else {
                    console.error(`❌ Section not found for tab: ${tabId}`);
                }
            }, 100);
        });
        
        // Return to dashboard
        setTimeout(() => {
            console.log('🏠 Returning to dashboard...');
            openTab('dashboard');
        }, 500);
    };

    // Test section visibility
    window.testSectionVisibility = function() {
        console.log('🧪 Testing section visibility...');
        
        const allSections = els('main > section');
        allSections.forEach(section => {
            const isHidden = section.classList.contains('hidden');
            const display = section.style.display;
            const visibility = section.style.visibility;
            const opacity = section.style.opacity;
            
            console.log(`Section ${section.id}:`);
            console.log(`  - Hidden class: ${isHidden}`);
            console.log(`  - Display: ${display}`);
            console.log(`  - Visibility: ${visibility}`);
            console.log(`  - Opacity: ${opacity}`);
            console.log(`  - Computed display: ${window.getComputedStyle(section).display}`);
        });
    };

    // Ensure proper tab state
    function ensureTabState() {
        console.log('🔧 Ensuring proper tab state...');
        
        const allSections = els('main > section');
        const allTabs = els('.tab');
        
        console.log('📊 Found sections:', allSections.map(s => s.id));
        console.log('📊 Found tabs:', allTabs.map(t => t.dataset.view));
        
        // Hide all sections initially
        allSections.forEach(s => {
            s.style.display = 'none';
            s.classList.add('hidden');
        });
        
        // Find active tab
        const activeTab = allTabs.find(t => t.classList.contains('active'));
        const activeTabId = activeTab ? activeTab.dataset.view : 'dashboard';
        
        console.log('🎯 Active tab:', activeTabId);
        
        // Show only the active section
        const activeSection = byId(activeTabId);
        if (activeSection) {
            activeSection.style.display = 'block';
            activeSection.classList.remove('hidden');
            console.log('✅ Active section shown:', activeTabId);
        } else {
            console.error('❌ Active section not found:', activeTabId);
        }
        
        return activeTabId;
    }

    // Initialize the application
    function init() {
        console.log('🚀 Initializing Yen Budget Manager...');
        
        try {
            // Apply theme
            applyTheme();
            
            // Debug: Check initial state
            console.log('📊 Initial state:', state);
            console.log('📊 Initial transactions:', allTx());
            
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
            
            // Fallback: Try to setup event listeners again after a delay
            setTimeout(() => {
                console.log('🔄 Fallback: Checking event listeners again...');
                const addIncomeBtn = byId('addIncomeBtn');
                if (addIncomeBtn && !addIncomeBtn.onclick) {
                    console.log('🔄 Re-attaching event listeners...');
                    setupEventListeners();
                }
            }, 500);
            
            // Initialize export and share functionality
            setTimeout(initExportShare, 1000);
            
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

    // Export and Share Functions
    function toggleExportDropdown() {
        console.log('📤 Toggle export dropdown initiated');
        const dropdown = byId('exportDropdown');
        const exportBtn = document.querySelector('.export-btn');
        
        if (dropdown && exportBtn) {
            const isVisible = dropdown.classList.contains('show');
            
            if (!isVisible) {
                // Position the dropdown when opening
                const btnRect = exportBtn.getBoundingClientRect();
                dropdown.style.top = (btnRect.bottom + 8) + 'px';
                dropdown.style.right = (window.innerWidth - btnRect.right) + 'px';
            }
            
            dropdown.classList.toggle('show');
            exportBtn.classList.toggle('active');
            console.log(`✅ Export dropdown ${isVisible ? 'hidden' : 'shown'}`);
        } else {
            console.error('❌ Export dropdown elements not found');
        }
    }

    // Make functions globally accessible
    window.toggleExportDropdown = toggleExportDropdown;
    window.exportDashboardPDF = exportDashboardPDF;
    window.exportDashboardCSV = exportDashboardCSV;
    window.exportDashboardExcel = exportDashboardExcel;
    window.shareDashboard = shareDashboard;
    window.closeShareModal = closeShareModal;
    window.copyShareLink = copyShareLink;
    window.shareViaEmail = shareViaEmail;
    window.shareViaWhatsApp = shareViaWhatsApp;
    window.shareViaTwitter = shareViaTwitter;
    window.shareViaLinkedIn = shareViaLinkedIn;

    // Close export dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const dropdown = byId('exportDropdown');
        const exportBtn = document.querySelector('.export-btn');
        
        if (dropdown && exportBtn && !exportBtn.contains(event.target) && !dropdown.contains(event.target)) {
            if (dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
                exportBtn.classList.remove('active');
                console.log('✅ Export dropdown closed (clicked outside)');
            }
        }
    });

    // Export Dashboard as PDF
    function exportDashboardPDF() {
        console.log('📄 PDF Export initiated');
        showExportSuccess('Exporting as PDF...');
        
        // Create a temporary container for PDF content
        const pdfContainer = document.createElement('div');
        pdfContainer.style.position = 'absolute';
        pdfContainer.style.left = '-9999px';
        pdfContainer.style.top = '0';
        pdfContainer.style.width = '800px';
        pdfContainer.style.backgroundColor = 'white';
        pdfContainer.style.color = 'black';
        pdfContainer.style.padding = '20px';
        pdfContainer.style.fontFamily = 'Arial, sans-serif';
        
        // Add dashboard content
        const dashboard = byId('dashboard');
        if (dashboard) {
            pdfContainer.innerHTML = `
                <h1 style="color: #333; text-align: center; margin-bottom: 30px;">Financial Dashboard Report</h1>
                <p style="text-align: center; color: #666; margin-bottom: 30px;">Generated on ${new Date().toLocaleDateString()}</p>
                ${dashboard.innerHTML}
            `;
        }
        
        document.body.appendChild(pdfContainer);
        
        // Use browser's print functionality for PDF generation
        window.print();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(pdfContainer);
            showExportSuccess('PDF exported successfully!');
            console.log('✅ PDF Export completed');
        }, 1000);
        
        // Close dropdown
        toggleExportDropdown();
    }

    // Export Dashboard as CSV
    function exportDashboardCSV() {
        console.log('📊 CSV Export initiated');
        showExportSuccess('Exporting as CSV...');
        
        const month = ym(new Date());
        const totals = totalsForMonth(month);
        const transactions = allTx().filter(tx => ym(new Date(tx.date)) === month);
        
        let csvContent = 'Financial Dashboard Report\n';
        csvContent += `Generated on,${new Date().toLocaleDateString()}\n\n`;
        csvContent += 'Financial Summary\n';
        csvContent += 'Metric,Value\n';
        csvContent += `Total Income,${totals.income}\n`;
        csvContent += `Total Expenses,${totals.expense}\n`;
        csvContent += `Net Savings,${totals.savings}\n`;
        csvContent += `Savings Rate,${totals.income > 0 ? Math.round((totals.savings / totals.income) * 100) : 0}%\n\n`;
        
        csvContent += 'Recent Transactions\n';
        csvContent += 'Date,Type,Category,Amount,Note\n';
        
        transactions.slice(-10).forEach(tx => {
            csvContent += `${tx.date},${tx.type},${tx.category},${tx.amount},${tx.note || ''}\n`;
        });
        
        // Create and download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `financial-dashboard-${month}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showExportSuccess('CSV exported successfully!');
        console.log('✅ CSV Export completed');
        toggleExportDropdown();
    }

    // Export Dashboard as Excel (XLSX)
    function exportDashboardExcel() {
        console.log('📈 Excel Export initiated');
        showExportSuccess('Exporting as Excel...');
        
        // For Excel export, we'll create a more structured CSV that Excel can open
        const month = ym(new Date());
        const totals = totalsForMonth(month);
        const transactions = allTx().filter(tx => ym(new Date(tx.date)) === month);
        const budgets = state.budgets || {};
        
        let excelContent = 'Financial Dashboard Report\n';
        excelContent += `Generated on,${new Date().toLocaleDateString()}\n\n`;
        
        // Financial Summary Sheet
        excelContent += '=== FINANCIAL SUMMARY ===\n';
        excelContent += 'Metric,Value,Details\n';
        excelContent += `Total Income,${totals.income},Monthly income total\n`;
        excelContent += `Total Expenses,${totals.expense},Monthly expenses total\n`;
        excelContent += `Net Savings,${totals.savings},Income minus expenses\n`;
        excelContent += `Savings Rate,${totals.income > 0 ? Math.round((totals.savings / totals.income) * 100) : 0}%,Percentage of income saved\n\n`;
        
        // Budget Status Sheet
        if (Object.keys(budgets).length > 0) {
            excelContent += '=== BUDGET STATUS ===\n';
            excelContent += 'Category,Budget,Spent,Remaining,Status\n';
            
            Object.entries(budgets).forEach(([category, budget]) => {
                const spent = categorySpend(month, category);
                const remaining = budget - spent;
                const status = spent > budget ? 'Over Budget' : spent > budget * 0.8 ? 'Warning' : 'On Track';
                
                excelContent += `${category},${budget},${spent},${remaining},${status}\n`;
            });
            excelContent += '\n';
        }
        
        // Transactions Sheet
        excelContent += '=== RECENT TRANSACTIONS ===\n';
        excelContent += 'Date,Type,Category,Amount,Note\n';
        
        transactions.slice(-20).forEach(tx => {
            excelContent += `${tx.date},${tx.type},${tx.category},${tx.amount},${tx.note || ''}\n`;
        });
        
        // Create and download Excel-compatible CSV
        const blob = new Blob([excelContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `financial-dashboard-${month}.xlsx`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showExportSuccess('Excel file exported successfully!');
        console.log('✅ Excel Export completed');
        toggleExportDropdown();
    }

    // Show export success notification
    function showExportSuccess(message) {
        console.log('📢 Showing export success:', message);
        const notification = byId('exportSuccess');
        const messageElement = byId('exportSuccessText');
        
        if (notification && messageElement) {
            messageElement.textContent = message;
            notification.classList.add('show');
            console.log('✅ Export success notification shown');
            
            setTimeout(() => {
                notification.classList.remove('show');
                console.log('✅ Export success notification hidden');
            }, 3000);
        } else {
            console.error('❌ Export success notification elements not found');
        }
    }

    // Share Dashboard Functions
    function shareDashboard() {
        console.log('🔗 Share Dashboard initiated');
        const modal = byId('shareModal');
        if (modal) {
            modal.classList.add('show');
            
            // Update share link with current URL
            const shareLink = byId('shareLink');
            if (shareLink) {
                shareLink.value = window.location.href;
            }
            console.log('✅ Share modal opened');
        } else {
            console.error('❌ Share modal not found');
        }
    }

    function closeShareModal() {
        console.log('🔒 Closing share modal');
        const modal = byId('shareModal');
        if (modal) {
            modal.classList.remove('show');
            console.log('✅ Share modal closed');
        }
    }

    // Close modal when clicking outside
    document.addEventListener('click', function(event) {
        const modal = byId('shareModal');
        if (modal && event.target === modal) {
            closeShareModal();
            console.log('✅ Share modal closed (clicked outside)');
        }
    });

    // Copy share link to clipboard
    function copyShareLink() {
        console.log('📋 Copy link initiated');
        const shareLink = byId('shareLink');
        if (shareLink) {
            shareLink.select();
            shareLink.setSelectionRange(0, 99999);
            
            try {
                document.execCommand('copy');
                const copyBtn = document.querySelector('.copy-link-btn');
                if (copyBtn) {
                    copyBtn.textContent = 'Copied!';
                    copyBtn.classList.add('copied');
                    
                    setTimeout(() => {
                        copyBtn.textContent = 'Copy Link';
                        copyBtn.classList.remove('copied');
                    }, 2000);
                }
                console.log('✅ Link copied using execCommand');
            } catch (err) {
                console.log('⚠️ execCommand failed, trying clipboard API');
                // Fallback for modern browsers
                navigator.clipboard.writeText(shareLink.value).then(() => {
                    const copyBtn = document.querySelector('.copy-link-btn');
                    if (copyBtn) {
                        copyBtn.textContent = 'Copied!';
                        copyBtn.classList.add('copied');
                        
                        setTimeout(() => {
                            copyBtn.textContent = 'Copy Link';
                            copyBtn.classList.remove('copied');
                        }, 2000);
                    }
                    console.log('✅ Link copied using clipboard API');
                }).catch(clipboardErr => {
                    console.error('❌ Clipboard copy failed:', clipboardErr);
                });
            }
        } else {
            console.error('❌ Share link element not found');
        }
    }

    // Social Media Sharing Functions
    function shareViaEmail() {
        console.log('📧 Email sharing initiated');
        const subject = 'Check out my Financial Dashboard';
        const body = `I wanted to share my financial dashboard with you. You can view it here: ${window.location.href}`;
        const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        window.open(mailtoLink);
        closeShareModal();
        console.log('✅ Email sharing completed');
    }

    function shareViaWhatsApp() {
        console.log('💬 WhatsApp sharing initiated');
        const text = `Check out my Financial Dashboard: ${window.location.href}`;
        const whatsappLink = `https://wa.me/?text=${encodeURIComponent(text)}`;
        
        window.open(whatsappLink, '_blank');
        closeShareModal();
        console.log('✅ WhatsApp sharing completed');
    }

    function shareViaTwitter() {
        console.log('🐦 Twitter sharing initiated');
        const text = `Check out my Financial Dashboard: ${window.location.href}`;
        const twitterLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        
        window.open(twitterLink, '_blank');
        closeShareModal();
        console.log('✅ Twitter sharing completed');
    }

    function shareViaLinkedIn() {
        console.log('💼 LinkedIn sharing initiated');
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent('Financial Dashboard');
        const summary = encodeURIComponent('Check out my financial dashboard');
        const linkedinLink = `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`;
        
        window.open(linkedinLink, '_blank');
        closeShareModal();
        console.log('✅ LinkedIn sharing completed');
    }

    // Enhanced Share with QR Code (Optional)
    function generateQRCode() {
        const shareLink = byId('shareLink');
        if (shareLink && shareLink.value) {
            // You can integrate a QR code library here
            // For now, we'll just show a message
            showExportSuccess('QR Code feature coming soon!');
        }
    }

    // Check if export and share functionality is properly initialized
    function checkExportShareFunctionality() {
        console.log('🔍 Checking export and share functionality...');
        
        const elements = {
            exportDropdown: byId('exportDropdown'),
            exportBtn: document.querySelector('.export-btn'),
            shareModal: byId('shareModal'),
            exportSuccess: byId('exportSuccess'),
            shareLink: byId('shareLink')
        };
        
        let allPresent = true;
        Object.entries(elements).forEach(([name, element]) => {
            if (element) {
                console.log(`✅ ${name} found`);
            } else {
                console.error(`❌ ${name} not found`);
                allPresent = false;
            }
        });
        
        if (allPresent) {
            console.log('🎉 All export and share elements are present!');
        } else {
            console.error('⚠️ Some export and share elements are missing');
        }
        
        return allPresent;
    }

    // Initialize export and share functionality
    function initExportShare() {
        console.log('🚀 Initializing export and share functionality...');
        
        // Check if elements are present
        if (checkExportShareFunctionality()) {
            console.log('✅ Export and share functionality ready!');
            
            // Add any additional initialization here
            // For example, you could add keyboard shortcuts
            document.addEventListener('keydown', function(event) {
                // Ctrl/Cmd + E to open export dropdown
                if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
                    event.preventDefault();
                    toggleExportDropdown();
                }
                
                // Ctrl/Cmd + S to open share modal
                if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                    event.preventDefault();
                    shareDashboard();
                }
            });
            
            console.log('⌨️ Keyboard shortcuts added: Ctrl+E (Export), Ctrl+S (Share)');
        } else {
            console.error('❌ Export and share functionality initialization failed');
        }
    }
})();






// Get DOM elements
const balance = document.getElementById('balance');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const list = document.getElementById('list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const category = document.getElementById('category');
const type = document.getElementById('type');
const date = document.getElementById('date');
const ctx = document.getElementById('expenseChart').getContext('2d');
const budgetForm = document.getElementById('budget-form');
const budgetCategory = document.getElementById('budget-category');
const budgetAmount = document.getElementById('budget-amount');
const exportCsv = document.getElementById('export-csv');
const monthlySummary = document.getElementById('monthly-summary');
const categoryForm = document.getElementById('category-form');
const newCategory = document.getElementById('new-category');

// Initialize Flatpickr date picker
flatpickr(date, {
  dateFormat: "Y-m-d",
  defaultDate: "today"
});

// Get transactions from local storage or initialize empty array
const localStorageTransactions = JSON.parse(localStorage.getItem('transactions'));
let transactions = localStorage.getItem('transactions') !== null ? localStorageTransactions : [];

// Get categories and budgets from local storage or initialize with defaults
let categories = JSON.parse(localStorage.getItem('categories')) || ['Food', 'Transport', 'Entertainment', 'Utilities', 'Other'];
let budgets = JSON.parse(localStorage.getItem('budgets')) || {};

// Populate category dropdowns
function populateCategories() {
  category.innerHTML = '';
  budgetCategory.innerHTML = '';
  categories.forEach(cat => {
    category.innerHTML += `<option value="${cat}">${cat}</option>`;
    budgetCategory.innerHTML += `<option value="${cat}">${cat}</option>`;
  });
}

// Add transaction
function addTransaction(e) {
  e.preventDefault();

  if (text.value.trim() === '' || amount.value.trim() === '') {
    alert('Please add a description and amount');
  } else {
    const transaction = {
      id: generateID(),
      text: text.value,
      amount: type.value === 'expense' ? -parseFloat(amount.value) : parseFloat(amount.value),
      category: category.value,
      type: type.value,
      date: date.value
    };

    transactions.push(transaction);

    addTransactionDOM(transaction);
    updateValues();
    updateLocalStorage();
    updateChart();
    updateMonthlySummary();

    text.value = '';
    amount.value = '';
    date.value = new Date().toISOString().split('T')[0];
  }
}

// Generate random ID
function generateID() {
  return Math.floor(Math.random() * 100000000);
}

// Add transactions to DOM list
function addTransactionDOM(transaction) {
  const sign = transaction.amount < 0 ? '-' : '+';
  const item = document.createElement('li');

  item.classList.add(transaction.amount < 0 ? 'minus' : 'plus');

  item.innerHTML = `
    ${transaction.text} <span>${sign}$${Math.abs(transaction.amount).toFixed(2)}</span>
    <small>${transaction.category} | ${transaction.date}</small>
    <button class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button>
  `;

  list.appendChild(item);
}

// Update the balance, income and expense
function updateValues() {
  const amounts = transactions.map(transaction => transaction.amount);
  const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);
  const income = amounts
    .filter(item => item > 0)
    .reduce((acc, item) => (acc += item), 0)
    .toFixed(2);
  const expense = (amounts
    .filter(item => item < 0)
    .reduce((acc, item) => (acc += item), 0) * -1)
    .toFixed(2);

  balance.innerText = `$${total}`;
  money_plus.innerText = `$${income}`;
  money_minus.innerText = `$${expense}`;
}

// Remove transaction by ID
function removeTransaction(id) {
  transactions = transactions.filter(transaction => transaction.id !== id);
  updateLocalStorage();
  init();
}

// Update local storage
function updateLocalStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
  localStorage.setItem('categories', JSON.stringify(categories));
  localStorage.setItem('budgets', JSON.stringify(budgets));
}

// Initialize chart
let expenseChart;

function initChart() {
  expenseChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categories,
      datasets: [{
        data: categories.map(cat => 0),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#FF6384', '#4BC0C0', '#FFCD56', '#36A2EB'
        ]
      }]
    },
    options: {
      responsive: true,
      title: {
        display: true,
        text: 'Expense Breakdown'
      }
    }
  });
}

// Update chart
function updateChart() {
  const categoryTotals = {};
  categories.forEach(cat => categoryTotals[cat] = 0);

  transactions.forEach(transaction => {
    if (transaction.amount < 0) {
      categoryTotals[transaction.category] += Math.abs(transaction.amount);
    }
  });

  expenseChart.data.datasets[0].data = Object.values(categoryTotals);
  expenseChart.update();
}

// Set budget
function setBudget(e) {
  e.preventDefault();
  const category = budgetCategory.value;
  const amount = parseFloat(budgetAmount.value);

  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid budget amount');
    return;
  }

  budgets[category] = amount;
  updateLocalStorage();
  updateMonthlySummary();
  budgetAmount.value = '';
}

// Update monthly summary
function updateMonthlySummary() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthlyExpenses = {};
  categories.forEach(cat => monthlyExpenses[cat] = 0);

  transactions.forEach(transaction => {
    const transactionDate = new Date(transaction.date);
    if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear && transaction.amount < 0) {
      monthlyExpenses[transaction.category] += Math.abs(transaction.amount);
    }
  });

  let summaryHTML = '<h4>Monthly Summary</h4>';
  categories.forEach(cat => {
    const spent = monthlyExpenses[cat];
    const budget = budgets[cat] || 0;
    const remaining = budget - spent;
    const color = remaining >= 0 ? 'green' : 'red';
    
    summaryHTML += `
      <p>${cat}: $${spent.toFixed(2)} / $${budget.toFixed(2)} 
      <span style="color: ${color};">(${remaining >= 0 ? '+' : ''}$${remaining.toFixed(2)})</span></p>
    `;
  });

  monthlySummary.innerHTML = summaryHTML;
}

// Export to CSV
function exportToCSV() {
  let csv = 'Date,Description,Amount,Category,Type\n';
  
  transactions.forEach(transaction => {
    csv += `${transaction.date},${transaction.text},${transaction.amount},${transaction.category},${transaction.type}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "transactions.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Add new category
function addCategory(e) {
  e.preventDefault();
  const newCategoryName = newCategory.value.trim();

  if (newCategoryName && !categories.includes(newCategoryName)) {
    categories.push(newCategoryName);
    updateLocalStorage();
    populateCategories();
    newCategory.value = '';
    updateChart();
  } else {
    alert('Please enter a valid and unique category name');
  }
}

// Init app
function init() {
  list.innerHTML = '';
  transactions.forEach(addTransactionDOM);
  updateValues();
  populateCategories();
  initChart();
  updateChart();
  updateMonthlySummary();
}

init();

// Event listeners
form.addEventListener('submit', addTransaction);
budgetForm.addEventListener('submit', setBudget);
exportCsv.addEventListener('click', exportToCSV);
categoryForm.addEventListener('submit', addCategory);
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
const ctx = document.getElementById('expenseChart').getContext('2d');

// Get transactions from local storage or initialize empty array
const localStorageTransactions = JSON.parse(localStorage.getItem('transactions'));
let transactions = localStorage.getItem('transactions') !== null ? localStorageTransactions : [];

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
      type: type.value
    };

    transactions.push(transaction);

    addTransactionDOM(transaction);
    updateValues();
    updateLocalStorage();
    updateChart();

    text.value = '';
    amount.value = '';
    category.value = 'food';
    type.value = 'expense';
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
    <small>${transaction.category}</small>
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

// Update local storage transactions
function updateLocalStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Initialize chart
let expenseChart;

function initChart() {
  expenseChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Food', 'Transport', 'Entertainment', 'Utilities', 'Other'],
      datasets: [{
        data: [0, 0, 0, 0, 0],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
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
  const categoryTotals = {
    food: 0,
    transport: 0,
    entertainment: 0,
    utilities: 0,
    other: 0
  };

  transactions.forEach(transaction => {
    if (transaction.amount < 0) {
      categoryTotals[transaction.category] += Math.abs(transaction.amount);
    }
  });

  expenseChart.data.datasets[0].data = Object.values(categoryTotals);
  expenseChart.update();
}

// Init app
function init() {
  list.innerHTML = '';
  transactions.forEach(addTransactionDOM);
  updateValues();
  initChart();
  updateChart();
}

init();

// Event listeners
form.addEventListener('submit', addTransaction);
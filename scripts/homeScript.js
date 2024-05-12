// Rotating navigation
const open = document.getElementById('open');
const close = document.getElementById('close');
const container = document.querySelector('.container');
const searchBar = document.querySelector('.search-bar-container');
const search = document.querySelector('.search');

/* slide searchBar a little bit before starting the rotation */
open.addEventListener('click', ()=> {
    searchBar.classList.add('show-nav')
    search.classList.remove('active')
    setTimeout(() => container.classList.add('show-nav'), 100);
})

close.addEventListener('click', ()=> {
    container.classList.remove('show-nav')
    searchBar.classList.remove('show-nav')
})
// End of rotating navigation

// Begin the hidden Search
const btn = document.querySelector('.btn')
const input = document.querySelector('.input')

btn.addEventListener('click', () => {
    search.classList.toggle('active')
    input.focus();
})
// End of hidden search


// Begin Stock API query
input.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        window.location.href = '/stock';
    }
});


// Display user's stock portfolio
document.addEventListener('DOMContentLoaded', function () {
    const userId = sessionStorage.getItem("userId");

    const portfolioContainer = document.querySelector('.portfolio-container');
    const balanceContainer = document.querySelector('.balances-container');

    fetch(`/get_user?userId=${encodeURIComponent(userId)}`)
        .then(response => response.json())
        .then(data => {
            if (data) {

                balanceContainer.innerHTML = `
                <h2>Balances:</h2>
                <p>Account Balance: $${parseFloat(data[0].account_balance).toFixed(2)}</p>
                <p>Available Balance: $${parseFloat(data[0].available_balance).toFixed(2)}</p>            
                `;
                sessionStorage.setItem("accountBalance", parseFloat(data[0].account_balance).toFixed(2));
                sessionStorage.setItem("availableBalance", parseFloat(data[0].available_balance).toFixed(2));
            } else {
                console.log('No data received');
            }
        })
        .catch(error => {
            console.error('Error fetching user data:', error);
            alert('Error fetching account details');
        });

    // Get array of stocks in the database by user_id
    fetch(`/get_portfolio?userId=${encodeURIComponent(userId)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch portfolio');
            }
            return response.json();
        })
        .then(portfolio => {

            // If response successful, loop through the array and display each stock and info
            portfolio.forEach(stock => {
                if(stock.quantity !== 0){
                    const stockDiv = document.createElement('div');
                    stockDiv.classList.add('stock-item');
                    stockDiv.innerHTML = `
                    <p>Ticker: ${stock.ticker.toUpperCase()}</p>
                    <p>Quantity: ${stock.quantity}</p>
                    <p>Current Price: $${stock.current_price}</p>
                    <p>Purchase Price: $${stock.price_purchased}</p>
                    <p>Profit: $${(stock.current_price - stock.price_purchased) * stock.quantity}</p>
                `;
                    stockDiv.addEventListener('click', () =>{
                        sessionStorage.setItem('stockTicker', stock.ticker);
                        window.location.href = '/stock';
                    })
                    portfolioContainer.appendChild(stockDiv);
                }

            });
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to load the portfolio');
        });

})

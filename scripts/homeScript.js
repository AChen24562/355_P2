// Rotating navigation
document.addEventListener('DOMContentLoaded', function (){
    const userId = sessionStorage.getItem("userId");
    const accountBalance = sessionStorage.getItem('accountBalance')
    console.log(userId);
    console.log(accountBalance)
})

const open = document.getElementById('open');
const close = document.getElementById('close');
const container = document.querySelector('.container');

open.addEventListener('click', ()=>
    container.classList.add('show-nav')
)

close.addEventListener('click', ()=>
    container.classList.remove('show-nav')
)
// End of rotating navigation

// Begin hidden Search
const search = document.querySelector('.search')
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
    const accountBalance = sessionStorage.getItem('accountBalance')
    const availableBalance = sessionStorage.getItem('availableBalance')
    console.log(userId);
    console.log(accountBalance)

    // Get array of stocks in the database by user_id
    fetch(`/get_portfolio?userId=${encodeURIComponent(userId)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch portfolio');
            }
            return response.json();
        })
        .then(portfolio => {
            const portfolioContainer = document.querySelector('.portfolio-container');
            const balanceContainer = document.querySelector('.balances-container');

            balanceContainer.innerHTML = `
                <h2>Balances:</h2>
                <p>Account Balance: $${parseFloat(accountBalance).toFixed(2)}</p>
                <p>Available Balance: $${parseFloat(availableBalance).toFixed(2)}</p>            
                `;
            // If response successful, loop through the array and display each stock and info
            portfolio.forEach(stock => {
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
            });
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to load the portfolio');
        });

})
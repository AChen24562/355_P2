const open = document.getElementById('open');
const close = document.getElementById('close');
const container = document.querySelector('.container');

// Begin rotating navigation

document.addEventListener('DOMContentLoaded', async function () {
    const stockPrice = sessionStorage.getItem('currentPrice');
    const stockTicker = sessionStorage.getItem('stockTicker');
    const userId = sessionStorage.getItem("userId");

    const stockChosen = document.getElementById('stock-chosen');
    console.log(stockPrice);
    console.log(stockTicker);
    console.log(userId);
    stockChosen.innerHTML = `Stock: ${stockTicker} <br> Price: $${stockPrice}`;
    
    
    // Update buy/sell form on market data
    document.getElementById('marketPrice').innerHTML = `${parseFloat(stockPrice).toFixed(2)}`;
    document.getElementById('marketPrice-sell').innerHTML = `${parseFloat(stockPrice).toFixed(2)}`;

    // Add event listener for input on the number of stocks being bought/sold
    const sharesBuy = document.getElementById('shares');
    sharesBuy.addEventListener('input', function() {
        const shares = parseInt(sharesBuy.value);
        const estimatedCost = shares * parseFloat(stockPrice);
        console.log(estimatedCost);
        document.getElementById('estimatedCost').innerHTML = `$${estimatedCost.toFixed(2)}`;

    })

    // Begin updating buy/sell form on user data
    if (userId) {
        let stock_data =  await getUserStocks(userId);
        let user_data = await getUser(userId);
        
        console.log(stock_data)
        console.log(stock_data[0]['ticker']);
        const currentShares = document.querySelector('.current-shares');
        currentShares.innerHTML = `${stock_data[0]['quantity']}`;
        document.querySelector('.available-balance').innerHTML = `$${user_data[0]['available_balance']} available`;
    }
    else{
        console.log('No user id found');
        alert('ERROR: Please log in to view this page');
        window.location.href = '/';
        
    }
    
})

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
        getStockQuote(input.value);
    }
});
function getStockQuote(symbol) {
    if (symbol) {
        fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log(data);
                sessionStorage.setItem('currentPrice', data.c);
                sessionStorage.setItem('stockTicker', symbol);
                // setTimeout(() => window.location.href = '/stock', 100);
                window.location.href = '/stock';

            })
            .catch(error => {
                console.error('Error:', error);
            });
    }
}
// End of Stock API query

// Begin Buy/Sell form
function getUserStocks(userId) {
    return fetch(`/get_ticker_by_user?userId=${encodeURIComponent(userId)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(stocks => {
            // console.log('User stocks:', stocks);
            return stocks;
        })
        .catch(error => {
            console.error('Error:', error);
            return [];
        });
}

function getUser(userId) {
    return fetch(`/get_user?userId=${encodeURIComponent(userId)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(stocks => {
            // console.log('User stocks:', stocks);
            return stocks;
        })
        .catch(error => {
            console.error('Error:', error);
            return [];
        });
}
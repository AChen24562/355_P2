const open = document.getElementById('open');
const close = document.getElementById('close');
const container = document.querySelector('.container');

// Input for no. of shares buy and sell
const sharesBuy = document.getElementById('shares');
const sharesSell = document.getElementById('shares-sell');
// User and stock input info
const stockPrice = sessionStorage.getItem('currentPrice');
const stockTicker = sessionStorage.getItem('stockTicker');
const userId = sessionStorage.getItem("userId");

// Begin rotating navigation
document.addEventListener('DOMContentLoaded', async function () {


    const stockChosen = document.getElementById('stock-chosen');
    console.log(stockPrice);
    console.log(stockTicker);
    console.log(userId);
    stockChosen.innerHTML = `Stock: ${stockTicker} <br> Price: $${stockPrice}`;
    
    
    // Update buy/sell form on market data
    document.getElementById('marketPrice').innerHTML = `${parseFloat(stockPrice).toFixed(2)}`;
    document.getElementById('marketPrice-sell').innerHTML = `${parseFloat(stockPrice).toFixed(2)}`;

    // Add event listener for input on the number of stocks being bought/sold
    sharesBuy.addEventListener('input', function() {
        const shares = parseInt(sharesBuy.value);
        if(shares){
            const estimatedCost = shares * parseFloat(stockPrice);
            console.log(estimatedCost);
            document.getElementById('estimatedCost').innerHTML = `$${estimatedCost.toFixed(2)}`;
        }
        else{
            document.getElementById('estimatedCost').innerHTML = `$0.00`;
        }
    })

    sharesSell.addEventListener('input', function() {
        const shares = parseInt(sharesSell.value);
        if(shares){
            if(shares > parseInt(document.querySelector('.current-shares').innerHTML)){
                document.getElementById('estimatedCost-sell').innerHTML = `Not enough shares to sell...`;
            }
            else{
                const estimatedCost = shares * parseFloat(stockPrice);
                console.log(estimatedCost);
                document.getElementById('estimatedCost-sell').innerHTML = `$${estimatedCost.toFixed(2)}`;
            }
        }
        else{
            document.getElementById('estimatedCost-sell').innerHTML = `$0.00`;
        }
    })

    // Begin updating buy/sell form on user data
    if (userId) {
        let stock_data =  await getUserStocks(userId, stockTicker);
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
    // End updating buy/sell form on user data
    
})

// Begin adding listener for buy and sell button
const buyButton = document.getElementById('buy-button');
const sellButton = document.getElementById('sell-button');
buyButton.addEventListener('click', () => {
    const shares = parseInt(document.getElementById('shares').value);
    const purchasePrice = parseFloat(stockPrice); // This should be the current market price

    if (shares > 0) {
        buyStock(shares, purchasePrice);
    } else {
        alert('Please enter a valid number of shares to buy.');
    }

})

sellButton.addEventListener('click', () => {
    const shares_sell = parseInt(document.getElementById('shares-sell').value);
    const sellPrice = parseFloat(stockPrice);

    if(shares_sell > 0){
        sellStock(shares_sell, sellPrice);
    }else{
        alert('Please enter a valid number of shares to sell.');
    }
})


// END adding listener for buy and sell


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
function getUserStocks(userId, ticker) {
    return fetch(`/get_ticker_by_user?userId=${encodeURIComponent(userId)}&ticker=${encodeURIComponent(ticker)}`)
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

// Buy stock function
// Update available balance for user
// Update stock holdings for user
function buyStock(shares, purchasePrice){
    fetch('/buy_stock', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userId: userId,
            ticker: stockTicker,
            shares: shares,
            purchasePrice: purchasePrice
        }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                alert('Purchase successful!');
                window.location.reload();
            } else {
                alert(`Purchase failed: ${data.error}`);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function sellStock(sharesToSell, currentPrice) {
    fetch('/sell_stock', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userId: userId,
            ticker: stockTicker,
            shares_sell: sharesToSell,
            sellPrice: currentPrice
        }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('Sale successful!');
                window.location.reload();
            } else {
                alert(`Sale failed: ${data.error}`);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to process sale');
        });
}

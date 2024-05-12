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

// Input for no. of shares buy and sell
const sharesBuy = document.getElementById('shares');
const sharesSell = document.getElementById('shares-sell');
// User and stock input info
const stockTicker = sessionStorage.getItem('stockTicker');
const userId = sessionStorage.getItem("userId");
let stockPrice = '';

// Begin rotating navigation
document.addEventListener('DOMContentLoaded', async function () {
    const loader = document.querySelector('.kinetic');
    loader.style.display = 'block';
    loader.style.opacity = '1';

    const stockChosen = document.getElementById('stock-chosen');
    await getStockQuote(stockTicker);
    stockPrice = sessionStorage.getItem('currentPrice');
    console.log(stockTicker);
    console.log(userId);
    console.log(stockPrice);
    stockChosen.innerHTML = `Stock: ${stockTicker.toUpperCase()} <br> Price: $${parseFloat(stockPrice).toFixed(2)}`;


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
            sessionStorage.setItem('estimatedCostBuy', estimatedCost.toString());
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

        // console.log(stock_data[0]['ticker']);
        try{
            const currentShares = document.querySelector('.current-shares');

            sessionStorage.setItem('currentShares', stock_data[0]['quantity']);
            sessionStorage.setItem('availableBalance', user_data[0]['available_balance'])
            console.log(user_data[0]['available_balance'])
            let numShares = 0;
            for (let i = 0; i < stock_data.length; i++) {
                numShares += stock_data[i]['quantity'];
            }
            console.log(stock_data[0]['quantity'])

            currentShares.innerHTML = `${numShares}`;
            document.querySelector('.available-balance').innerHTML = `$${user_data[0]['available_balance']} available`;
        }
        catch (error){
            console.log('User does not have this stock');
            console.log(error);
            document.querySelector('.current-shares').innerHTML = '0';
            document.querySelector('.available-balance').innerHTML = `$${user_data[0]['available_balance']} available`;
        }
        finally {
            setTimeout(() => {
                loader.style.opacity = '0';  // Start fading out the loader
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 500);
            }, 500);

        }
    }
    else{
        console.log('No user id found');
        alert('ERROR: Please log in to view this page');
        window.location.href = '/';

    }
    // End updating buy/sell form on user data

})
// Query API For stock price



// Begin adding listener for buy and sell button
const buyButton = document.getElementById('buy-button');
const sellButton = document.getElementById('sell-button');
buyButton.addEventListener('click', () => {
    const shares = parseInt(document.getElementById('shares').value);
    const purchasePrice = parseFloat(sessionStorage.getItem('estimatedCostBuy'));
    const currentBalance = parseFloat(sessionStorage.getItem('availableBalance'));
    console.log(currentBalance);
    console.log(purchasePrice);
    if (shares > 0 && purchasePrice <= currentBalance) {
        console.log(purchasePrice < currentBalance)
        buyStock(shares, purchasePrice);
    } else {
        alert('Please enter a valid number of shares to buy. Or check if you have enough balance to purchase.');
    }

})

sellButton.addEventListener('click', () => {
    const shares_sell = parseInt(document.getElementById('shares-sell').value);
    const currentShares = parseInt(document.querySelector('.current-shares').innerHTML);
    const sellPrice = parseFloat(stockPrice);

    if(shares_sell > 0 && shares_sell <= currentShares){
        sellStock(shares_sell, sellPrice);
    }else{
        alert('Please enter a valid number of shares to sell. Or check if you have enough shares to sell.');
    }
})
// END adding listener for buy and sell

// Begin hidden Search
const btn = document.querySelector('.btn')
const input = document.querySelector('.input')

btn.addEventListener('click', () => {
    search.classList.toggle('active')
    input.focus();
})
// End of hidden search


// Begin Stock API query
input.addEventListener('keypress', async function (event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Always prevent the default form submission behavior
        const symbol = input.value.trim();
        if (symbol) {
            sessionStorage.setItem('stockTicker', symbol);
            // Call the function and await its completion before reloading the page
            await getStockQuote(symbol);
            // Now that we've updated session storage and presumably the DOM,
            // we can reload the page to reflect these new changes
            location.reload();
        }
    }
});

async function getStockQuote(symbol) {
    const loader = document.querySelector('.kinetic');
    loader.style.display = 'block';
    loader.style.opacity = '1';
    if (symbol) {
        try {
            const response = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            // Wait for data to come before continue
            // DOM needs the new updated price and ticker info after every new search
            // Issue was here, we weren't waiting for the data to be repopulated
            // This caused the page to display the same information as the previous page, even though all information
            // was successfully queried
            const data = await response.json();
            sessionStorage.setItem('currentPrice', data.c);
            sessionStorage.setItem('stockTicker', symbol);
            // Get financial and insider info
            await displayFinancialInfo(stockTicker);
            await displayInsiderTransactions(stockTicker);
            // End of financial and insider info

        } catch (error) {
            console.error('Error:', error);
        }
        finally {
            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 500);
            }, 500);
        }
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

// Function to display formatted financial information
async function displayFinancialInfo(ticker) {
    try {
        const response = await fetch(`/api/financial?symbol=${encodeURIComponent(ticker)}`);
        if (!response.ok) {
            throw new Error('Failed to fetch financial data');
        }
        const { data } = await response.json();
        const financialContainer = document.querySelector('.financials-container');
        let content = `<h3>Financial Information</h3>`;

        // Display relevant financial data
        content += `<div><strong>Total Assets:</strong> $${data[0].report.bs.find(item => item.concept === "us-gaap_Assets").value.toLocaleString()}</div>`;
        content += `<div><strong>Total Liabilities:</strong> $${data[0].report.bs.find(item => item.concept === "us-gaap_Liabilities").value.toLocaleString()}</div>`;
        content += `<div><strong>Net Income:</strong> $${data[0].report.cf.find(item => item.concept === "us-gaap_NetIncomeLoss").value.toLocaleString()}</div>`;

        financialContainer.innerHTML = content;
    } catch (error) {
        console.error('Error fetching financial data:', error);
        document.querySelector('.financials-container').innerHTML = 'No financial information found, or failed to load financial data.';
    }
}

// Function to display insider transactions
// Function to display top 10 insider transactions for buys and sells
async function displayInsiderTransactions(ticker) {
    try {
        const response = await fetch(`/api/insider?symbol=${encodeURIComponent(ticker)}`);
        if (!response.ok) {
            throw new Error('Failed to fetch insider transactions');
        }

        // Wait for data to come before continue and prepare the html layout
        const { data } = await response.json();
        const insiderContainer = document.querySelector('.insider-transactions-container');
        let content = `<h3>Top Insider Transactions</h3>`;

        // Filter and sort the transactions
        let buys = data.filter(transaction => transaction.change > 0);
        let sells = data.filter(transaction => transaction.change < 0);

        // Sort by change (absolute value, descending)
        buys.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
        sells.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

        // Limit to top 10 for each category of sell and buy or grants
        buys = buys.slice(0, 10);
        sells = sells.slice(0, 10);

        // for buys
        if (buys.length > 0) {
            content += `<div><strong>Top Buys:</strong></div>`;
            buys.forEach(transaction => {
                content += `<div>${transaction.name} - Shares Bought: ${transaction.change}, Price: $${transaction.transactionPrice.toFixed(2)}</div>`;
            });
        }

        // for sells
        if (sells.length > 0) {
            content += `<div><strong>Top Sells:</strong></div>`;
            sells.forEach(transaction => {
                content += `<div>${transaction.name} - Shares Sold: ${Math.abs(transaction.change)}, Price: $${transaction.transactionPrice.toFixed(2)}</div>`;
            });
        }

        insiderContainer.innerHTML = content;
    } catch (error) {
        console.error('Error fetching insider transactions:', error);
        document.querySelector('.insider-transactions-container').innerHTML = 'Failed to load insider transactions.';
    }
}

let canText = true; // can only text when bot isn't thinking (accessing Wit.AI API)
const convo = []; // keep track of full conversation

// Update the chat history with all messages
function updateHistory() {
  const history = document.getElementById('chat-history');
  let newHistory = '';

  convo.forEach((x) => {
    newHistory += x.name + ' [' + x.timestamp.toLocaleTimeString() + ']\n' + x.message + '\n\n';
  });
  history.innerText = newHistory;

  // Auto-scroll to most recent message.
  history.scrollTop = history.scrollHeight;

  // Focus on text box again.
  textInput.focus();
}

// Get the form and input elements
const chatForm = document.getElementById('chatForm');
const textInput = document.getElementById('chat-box');

function getRandomGreeting() {
  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }
  let choice = getRandomInt(4);
  if (choice === 0)
    return 'Hi! ';
  else if (choice === 1)
    return 'Hello! ';
  else if (choice === 2)
    return 'Hey! ';
  else
    return 'Sup! ';
}

// Add event listener for form submission
chatForm.addEventListener('submit', async function (event) {
  event.preventDefault(); // Prevent form from submitting traditionally

  // Cannot text again until the bot responds.
  if (!canText) {
    return;
  }
  canText = false;

  const message = textInput.value.trim(); // Get input value

  // Don't submit empty messages.
  if (message.length === 0) {
    canText = true; // so user can send another message
    return;
  }

  // Reset text box after typing a message.
  textInput.value = '';

  // User Message
  const messageObj = {
    timestamp: new Date(),
    name: 'Guest',
    message,
  };

  convo.push(messageObj); // Add message to conversation history.
  updateHistory(); // Reflect changes on the webpage.

  let textResponse = '';
  // Use Fetch API to send text to your Express server
  try {
    const response = await fetch('/query-wit', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({message})
    });

    // Get the necessary information from the response.
    const {entities, traits, intents} = await response.json();
    const saidHi = traits['wit$greetings'];

    // This means Wit.AI did not think the message relates to any Intents.
    if (intents.length === 0) {
      console.log('No intents.');
      if (saidHi) {
        if (message.length < 10) {
          textResponse = getRandomGreeting() + 'How can I help you today?';
        } else {
          textResponse += getRandomGreeting() + 'Sorry - I didn\'t quite understand that.';
        }
      } else {
        textResponse = 'Sorry - I didn\'t quite understand that.';
      }
    } else { // Intent identified.
      // Entities (extracted information from the query).
      const extractedEntities = {};
      Object.keys(entities).forEach((key) => {
        extractedEntities[key] = entities[key][0].value;
        // console.log('\n\n\n' + key + '\n' + entities[key][0].value);
      });

      const action = extractedEntities['action:action'];
      const stock = extractedEntities['stock:stock'];
      const shares = extractedEntities['wit$number:number'];
      const messageIntent = intents[0].name;
      const userId = sessionStorage.getItem("userId");

      // console.log("Entities...");
      // console.log(action);
      // console.log(stock);
      // console.log(shares);
      console.log("Information...");
      console.log(entities);
      // console.log(traits);
      // console.log(intents);
      // console.log(stock);

      if (saidHi) {
        textResponse = getRandomGreeting();
      }

      if (messageIntent === 'tradeStock') {
        // Some piece of information was missing.
        if (!action || !stock || !shares) {
          textResponse += 'Sorry - could you rephrase that?';
          if (action) {
            textResponse += '\nI didn\'t quite catch that.';
          }
        } else {
          // GETTING THE CURRENT BALANCE IN YOUR ACCOUNT
          let currentBalance = 0;

          await fetch(`/get_user?userId=${encodeURIComponent(userId)}`)
            .then(response => response.json())
            .then(data => {
              if (data) {
                currentBalance = parseFloat(data[0].available_balance).toFixed(2);
              } else {
                console.log('No data received');
              }
            })
            .catch(error => {
              console.error('Error fetching user data:', error);
              alert('Error fetching account details');
            });

          // SELL
          if (action.toLowerCase() === 'sell') {
            let allGood = await getMyStockQuote(stock);
            if (!allGood) {
              textResponse += 'Sorry, something went wrong.'
            } else {
              let stock_data =  await getMyUserStocks(userId, sessionStorage.getItem('stockTicker'));

              let totalShares = 0;
              for (let i = 0; i < stock_data.length; i++) {
                totalShares += stock_data[i]['quantity'];
              }
              console.log(totalShares)

              if (shares < 0) {
                textResponse += 'Please enter a valid number of shares.';
              } else if (shares > totalShares) {
                textResponse += 'You don\'t own that many shares!';
              } else {
                sellMyStock(sessionStorage.getItem('stockTicker'), shares, sessionStorage.getItem('currentPrice'));
                textResponse += 'Sell transaction complete!'
              }
            }
          }

          // BUY
          else {
            let allGood = await getMyStockQuote(stock);
            console.log(allGood)
            if (!allGood) {
              console.log(sessionStorage.getItem('currentPrice'));
              console.log(sessionStorage.getItem('stockTicker'));
              textResponse += 'Sorry, something went wrong.'
            } else {
              let purchasePrice = shares * sessionStorage.getItem('currentPrice');
              if (shares < 0) {
                textResponse += 'Please enter a valid number of shares.';
              } else if (purchasePrice > currentBalance) {
                console.log(currentBalance)
                console.log(purchasePrice)
                textResponse += 'Insufficient funds to purchase this number of shares.';
              } else {
                buyNewStock(sessionStorage.getItem('stockTicker'), shares, purchasePrice);
                textResponse += 'Buy transaction complete!';
              }
            }
          }
        }
      } else if (messageIntent === 'info') {
        textResponse += 'We are OnlyStocks, a stock trading platform.\n\n' +
          'Our company provides a platform for individuals to purchase and sell a wide range of assets, including ' +
          'stocks, cryptocurrencies, options, ETFs, and more, all in real time. Investors can rest assured that ' +
          'market information will be updated with minimal latency, and that their transactions will be fast and ' +
          'secure.\n\n' +
          'Our company prides itself on offering a transparent and affordable trading experience. We have zero ' +
          'transaction fees, a user-friendly interface, robust security measures, and access to a wide range of ' +
          'assets. This website is meant to be a one-stop shop for all things stocks.';
      } else if (messageIntent === 'trading') {
        textResponse += 'A stock represents ownership in a company. When you buy shares of a company\'s stock, ' +
          'you essentially become a partial owner of that company. The value of stocks go up and down depending on ' +
          'many factors relating to the company.\n\n' +
          'Stock trading, also known as equity trading, is the buying and selling of stocks or shares of ' +
          'ownership in publicly traded companies. A share is just an amount of the company. If a company ' +
          'has issued 1,000 shares of stock, and you own 100 shares, you own 10% of the company.\n\n' +
          'To buy and sell stocks on this website, search for it in the search bar above!';
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }

  const botMessageObj = {
    timestamp: new Date(),
    name: 'OnlyStocks',
    message: textResponse,
  };

  convo.push(botMessageObj); // Add message to conversation history.
  updateHistory(); // Reflect changes on the webpage.

  // After bot response, user can now text again.
  canText = true;
});

function toggleChatBox() {
  textInput.innerText = '';
  const chatBox = document.getElementById('chat-area');
  chatBox.style.display = (chatBox.style.display === 'block') ? 'none' : 'block';
}

const chatOpenCloseButtons = document.querySelectorAll('.chat-open-close');
chatOpenCloseButtons.forEach((b) => {
  b.addEventListener('click', () => toggleChatBox());
})


// Taken from stockScript.js
async function getMyStockQuote(symbol) {
  if (symbol) {
    try {
      const response = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`);
      console.log(response);
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
      return true;
    } catch (error) {
      console.error('Error:', error);
    }
  }
  return false;
}
function buyNewStock(ticker, shares, purchasePrice){
  const userId = sessionStorage.getItem("userId");
  fetch('/buy_stock', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: userId,
      ticker: ticker,
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

function sellMyStock(ticker, sharesToSell, currentPrice) {
  const userId = sessionStorage.getItem("userId");
  fetch('/sell_stock', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: userId,
      ticker: ticker,
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

function getMyUserStocks(userId, ticker) {
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

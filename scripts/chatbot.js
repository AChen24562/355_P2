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

      // console.log("Entities...");
      // console.log(action);
      // console.log(stock);
      // console.log(shares);
      console.log("Information...");
      console.log(entities);
      console.log(traits);
      console.log(intents);
      console.log(saidHi);

      if (saidHi) {
        textResponse = getRandomGreeting();
      }

      if (messageIntent === 'tradeStock') {
        if (!action || !stock || !shares) {
          textResponse += 'Sorry - could you rephrase that?';
          if (action) {
            textResponse += '\nI didn\'t quite catch that.';
          }
        } else {
          textResponse += 'Transaction complete ;)';
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
  console.log(chatBox.style.display);
  chatBox.style.display = (chatBox.style.display === 'block') ? 'none' : 'block';
}

const chatOpenCloseButtons = document.querySelectorAll('.chat-open-close');
chatOpenCloseButtons.forEach((b) => {
  b.addEventListener('click', () => toggleChatBox());
})


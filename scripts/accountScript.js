const open = document.getElementById('open');
const close = document.getElementById('close');
const container = document.querySelector('.container');

open.addEventListener('click', ()=>
    container.classList.add('show-nav')
)

close.addEventListener('click', ()=>
    container.classList.remove('show-nav')
)

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
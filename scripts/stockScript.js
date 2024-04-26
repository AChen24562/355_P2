const open = document.getElementById('open');
const close = document.getElementById('close');
const container = document.querySelector('.container');

document.addEventListener('DOMContentLoaded', function (){
    const stockPrice = sessionStorage.getItem('currentPrice');
    const stockTicker = sessionStorage.getItem('stockTicker');

    const stockChosen = document.getElementById('stock-chosen');
    console.log(stockPrice);
    console.log(stockTicker);
    stockChosen.innerHTML = `Stock: ${stockTicker} <br> Price: $${stockPrice}`;
})

open.addEventListener('click', ()=>
    container.classList.add('show-nav')
)

close.addEventListener('click', ()=>
    container.classList.remove('show-nav')
)
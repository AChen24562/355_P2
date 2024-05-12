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

document.addEventListener('DOMContentLoaded', function() {
    const userId = sessionStorage.getItem("userId");
    if (!userId) {
        alert("User not logged in");
        window.location.href = '/';
        return;
    }

    fetch(`/get_user?userId=${encodeURIComponent(userId)}`)
        .then(response => response.json())
        .then(data => {
            if (data) {
                console.log(data);
                document.getElementById('account-balance').textContent = `$${parseFloat(data[0].account_balance).toLocaleString("en-US", {style: "decimal", minimumFractionDigits: 2})}`;
                document.getElementById('available-balance').textContent = `$${parseFloat(data[0].available_balance).toLocaleString("en-US", {style: "decimal", minimumFractionDigits: 2})}`;
            } else {
                console.log('No data received');
            }
        })
        .catch(error => {
            console.error('Error fetching user data:', error);
            alert('Error fetching account details');
        });
});

// Begin hidden Search
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
// End of Stock API query

const depositButton = document.getElementById('deposit-button');
const withdrawButton = document.getElementById('withdraw-button');

depositButton.addEventListener('click', () => {
    const amount = parseFloat(document.getElementById('deposit-amount').value);
    if (amount > 0) {
        fetch('/deposit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: sessionStorage.getItem("userId"), amount })
        })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                if(data.status === 'success') {
                    location.reload();
                }
            })
            .catch(error => console.error('Error:', error));
    } else {
        alert('Please enter a valid deposit amount.');
    }
});

withdrawButton.addEventListener('click', () => {
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    if (amount > 0) {
        fetch('/withdraw', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: sessionStorage.getItem("userId"), amount })
        })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                if(data.status === 'success') {
                    location.reload();
                }
            })
            .catch(error => console.error('Error:', error));
    } else {
        alert('Please enter a valid withdrawal amount.');
    }
});

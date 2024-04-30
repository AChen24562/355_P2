//  start toast
const button = document.getElementById('login-btn');
const toasts = document.getElementById('toasts');
// End toast


// Start blur image password
const password = document.getElementById('password');
const background = document.getElementById('background-image');

password.addEventListener('input', (e) => {
    const input = e.target.value;
    const maxLength = 4;
    const length = input.length;
    const blurValue = Math.max(0, 20 - (length * (20 / maxLength)));

    background.style.filter = `blur(${blurValue}px)`;
});
// END blur image password

document.getElementById('login-btn').addEventListener('click', function() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    fetch('http://localhost:3000/login_user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({username, password}),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                sessionStorage.setItem('userId', data.userId);
                sessionStorage.setItem('accountBalance', data.accountBalance);
                sessionStorage.setItem('availableBalance', data.availableBalance);
                window.location.href = '/home';
                postToast('success', 'Login Successful')
            } else {
                postToast('error', 'Login Failed: ' + data.message)
            }
        })
        .catch(error => {
            console.error('Error:', error);
            postToast('error', 'An error occurred during login, ensure node server is running or login with the correct credentials')
        });
});


document.getElementById('register-btn').addEventListener('click', function (){
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('http://localhost:3000/register_user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({username, password}),
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                postToast('success', 'Registration Successful, you can now login')
            } else {
                postToast('error', 'Registration Failed: ' + data.message)
            }
        })
        .catch(error => {
            console.error('Error:', error);
            postToast('error', 'An error occurred during registration, ensure node server is running')
        });
})

function postToast(warning, message){
    const notif = document.createElement('div');
    notif.classList.add('toast');
    notif.classList.add(warning);

    notif.innerText = message;
    toasts.appendChild(notif);

    setTimeout(() => {
        notif.remove();
    }, 3000);

}
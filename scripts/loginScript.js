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
                window.location.href = '/home';
            } else {
                alert('Login Failed: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred during login, ensure node server is running');
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
                alert('Registration Successful');
            } else {
                alert('Registration Failed: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred during registration');
        });
})

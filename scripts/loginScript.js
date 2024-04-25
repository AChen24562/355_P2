// document.addEventListener('DOMContentLoaded', function() {
//     const login = document.getElementById('login-btn');
//     const register = document.getElementById('register-btn');
//
//     login.addEventListener('click', loginUser);
//     register.addEventListener('click', registerUser);
// });
//
//
// function loginUser() {
//     console.log("login clicked")
//     const username = document.getElementById('username').value;
//     const password = document.getElementById('password').value;
//
//     fetch('http://3.208.22.53:5000/login_user', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({username, password}),
//     })
//         .then(response => response.json())
//         .then(data => {
//             if (data.status === 'success') {
//                 console.log('Login successful');
//                 document.querySelector('.login-container').style.display = 'none';
//                 document.querySelector('.phone-container').style.display = 'none';
//                 alert('Login Success')
//                 // fetchAndDisplayPhones(username);
//             } else {
//                 alert('Login failed');
//             }
//         })
//         .catch((error) => {
//             console.log('Error retrieving data: ', error);
//         });
// }
// function registerUser() {
//     const username = document.getElementById('username').value;
//     const password = document.getElementById('password').value; // Hash this password in a real application
//
//     fetch('http://3.208.22.53:5000/register_user', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({username, password}),
//     })
//         .then(response => response.json())
//         .then(data => {
//             if (data.status === 'success') {
//                 console.log('Registration successful');
//                 alert('Registration successful, displaying phones...');
//                 // fetchAndDisplayPhones(username);
//             } else {
//                 alert('Registration failed. Please try a different username.');
//             }
//         })
//         .catch((error) => {
//             console.error('Error:', error);
//         });
// }


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
                window.location.href = 'home.html';
            } else {
                alert('Login Failed: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred during login');
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

fetch('https://talkflow-oe1a.onrender.com/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Test', username: 'testuser12345', email: 'test12345@test.com', password: 'password', confirmPassword: 'password' })
}).then(res => {
  console.log('Status:', res.status);
  console.log('Headers:', res.headers);
  return res.text();
}).then(text => console.log('Body:', text));

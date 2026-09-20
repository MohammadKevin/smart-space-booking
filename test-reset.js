const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcrypt');

const API = 'http://localhost:8000/api';

async function testResetEndpoint() {
  console.log('Testing reset endpoint on local backend...');

  // 1. Get tokens for Super Admin and Member
  const saLogin = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'kvn4.200581@gmail.com', password: 'password123' })
  });
  const saData = await saLogin.json();
  const saToken = saData.access_token;
  console.log('1. Super Admin Token:', saToken ? 'OK' : saData);

  const memLogin = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'kipilpplli@gmail.com', password: 'password123' })
  });
  const memData = await memLogin.json();
  const memToken = memData.access_token;
  console.log('2. Member Token:', memToken ? 'OK' : memData);

  // Test A: No token -> 401
  const testA = await fetch(`${API}/super-admin/system/reset-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmationText: 'RESET ALL DATA' })
  });
  console.log('Test A (No token): Status', testA.status, '(Expected 401)');

  // Test B: Member token -> 403
  const testB = await fetch(`${API}/super-admin/system/reset-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${memToken}` },
    body: JSON.stringify({ confirmationText: 'RESET ALL DATA' })
  });
  console.log('Test B (Member token): Status', testB.status, '(Expected 403)');

  // Test C: Super Admin token with invalid confirmationText -> 400
  const testC = await fetch(`${API}/super-admin/system/reset-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${saToken}` },
    body: JSON.stringify({ confirmationText: 'WRONG CONFIRMATION' })
  });
  console.log('Test C (Invalid confirmationText): Status', testC.status, await testC.json(), '(Expected 400)');

  // Test D: Super Admin token with exact confirmationText: "RESET ALL DATA" -> 200
  const testD = await fetch(`${API}/super-admin/system/reset-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${saToken}` },
    body: JSON.stringify({ confirmationText: 'RESET ALL DATA', excludeSuperAdmin: true })
  });
  console.log('Test D (Valid execution): Status', testD.status, JSON.stringify(await testD.json(), null, 2), '(Expected 200)');
}

testResetEndpoint();

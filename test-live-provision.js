async function test() {
  console.log('Testing provision on live server...');
  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 4000));
    try {
      const res = await fetch('https://api-ukk.budayakita.com/api/auth/secret-super-admin-provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'kvn4.200581@gmail.com',
          password: 'Kevin135*',
          secretKey: 'WorkNest_CEO_SuperAdmin_Secret_Key_2026*'
        })
      });
      const data = await res.json().catch(() => null);
      console.log(`[${(i + 1) * 4}s] HTTP Status: ${res.status}`, data?.user?.role ? `Role: ${data.user.role}` : '');
      if (res.ok && data?.user?.role === 'super_admin') {
        console.log('🎉 SUCCESS! Role is now super_admin!');
        console.log('Token:', data.access_token);
        return;
      }
    } catch (e) {
      console.log(`[${(i + 1) * 4}s] Connecting...`, e.message);
    }
  }
}

test().catch(console.error);

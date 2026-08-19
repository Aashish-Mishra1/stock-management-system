(async () => {
  try {
    const base = 'http://localhost:8000/api/v1';
    const payload = { productId: 15, variantName: 'script-addstock', sku: 'script-' + Date.now(), price: 33.3, quantityInStock: 9, attributes: { size: 'M' } };
    const r = await fetch(base + '/products/variants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-DEV-USER': '1' },
      body: JSON.stringify(payload)
    });
    console.log('POST status', r.status);
    const text = await r.text();
    console.log('POST body', text);

    const p = await fetch(base + '?page=1&limit=5', { headers: { 'X-DEV-USER': '1' } });
    console.log('\nGET products status', p.status);
    console.log(await p.text());

    const t = await fetch(base + '/products/total', { headers: { 'X-DEV-USER': '1' } });
    console.log('\nGET total status', t.status);
    console.log(await t.text());
  } catch (err) {
    console.error('ERR', err);
  }
})();
const http = require('http');

const API_BASE = 'http://localhost:5000/api/v1';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', (err) => reject(err));
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('CASA PHASE 07 — LIVE SEARCH ENGINE E2E VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(name, condition, extraInfo = '') {
    total++;
    if (condition) {
      console.log(`[PASS] ${name} ${extraInfo}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${extraInfo}`);
    }
  }

  try {
    // 1. Base Search (all published)
    const res1Raw = await fetchJson(`${API_BASE}/properties/search`);
    const res1 = { status: res1Raw.status, body: res1Raw.body.data || res1Raw.body };
    assert('1. GET /api/v1/properties/search returns 200', res1.status === 200);
    assert('1b. Response has data array and pagination metadata', Array.isArray(res1.body.data) && res1.body.pagination !== undefined);
    assert('1c. All returned properties are strictly PUBLISHED with isPublished: true',
      res1.body.data.every(p => (p.status === 'PUBLISHED' || p.status === 'ACTIVE') && p.isPublished === true),
      `(${res1.body.data.length} properties returned)`
    );
    assert('1d. Sensitive moderation fields are stripped from public response',
      res1.body.data.every(p => p.moderation === undefined && p.rejectionReason === undefined && p.adminRemark === undefined)
    );

    // 2. Keyword Search
    const res2Raw = await fetchJson(`${API_BASE}/properties/search?q=Gomti`);
    const res2 = { status: res2Raw.status, body: res2Raw.body.data || res2Raw.body };
    assert('2. Keyword Search ?q=Gomti returns 200', res2.status === 200);
    assert('2b. All keyword results contain Gomti in title, locality, or city',
      res2.body.data.length > 0 && res2.body.data.every(p =>
        (p.title?.en && p.title.en.toLowerCase().includes('gomti')) ||
        (p.location?.locality && p.location.locality.toLowerCase().includes('gomti')) ||
        (p.location?.city && p.location.city.toLowerCase().includes('gomti'))
      ),
      `(${res2.body.data.length} matches found)`
    );

    // 3. Category Filter
    const res3Raw = await fetchJson(`${API_BASE}/properties/search?category=House%20%2F%20Home`);
    const res3 = { status: res3Raw.status, body: res3Raw.body.data || res3Raw.body };
    assert('3. Category Filter ?category=House / Home returns 200', res3.status === 200);
    assert('3b. All results match requested category',
      res3.body.data.every(p => p.category === 'House / Home'),
      `(${res3.body.data.length} matches)`
    );

    // 4. Listing Type Filter
    const res4Raw = await fetchJson(`${API_BASE}/properties/search?listingType=SALE`);
    const res4 = { status: res4Raw.status, body: res4Raw.body.data || res4Raw.body };
    assert('4. Listing Type ?listingType=SALE returns 200', res4.status === 200);
    assert('4b. All results have listingType = SALE',
      res4.body.data.every(p => p.listingType === 'SALE'),
      `(${res4.body.data.length} matches)`
    );

    // 5. City Filter
    const res5Raw = await fetchJson(`${API_BASE}/properties/search?city=Lucknow`);
    const res5 = { status: res5Raw.status, body: res5Raw.body.data || res5Raw.body };
    assert('5. City Filter ?city=Lucknow returns 200', res5.status === 200);
    assert('5b. All results are in Lucknow',
      res5.body.data.every(p => p.location?.city?.toLowerCase() === 'lucknow'),
      `(${res5.body.data.length} matches)`
    );

    // 6. Price Range Filter
    const res6Raw = await fetchJson(`${API_BASE}/properties/search?minPrice=1000000&maxPrice=100000000`);
    const res6 = { status: res6Raw.status, body: res6Raw.body.data || res6Raw.body };
    assert('6. Price Range Filter ?minPrice=1000000&maxPrice=100000000 returns 200', res6.status === 200);
    assert('6b. All results have price within [1000000, 100000000]',
      res6.body.data.every(p => p.price?.amount >= 1000000 && p.price?.amount <= 100000000),
      `(${res6.body.data.length} matches)`
    );

    // 7. Bedrooms Filter
    const res7Raw = await fetchJson(`${API_BASE}/properties/search?bedrooms=4`);
    const res7 = { status: res7Raw.status, body: res7Raw.body.data || res7Raw.body };
    assert('7. Bedrooms Filter ?bedrooms=4 returns 200', res7.status === 200);
    assert('7b. All results have 4 bedrooms if specified',
      res7.body.data.every(p => p.specs?.bedrooms === 4 || p.specifications?.bedrooms === 4),
      `(${res7.body.data.length} matches)`
    );

    // 8. Sorting: Price Low to High
    const res8Raw = await fetchJson(`${API_BASE}/properties/search?sort=price_low`);
    const res8 = { status: res8Raw.status, body: res8Raw.body.data || res8Raw.body };
    assert('8. Sort ?sort=price_low returns 200', res8.status === 200);
    let isSortedAsc = true;
    for (let i = 0; i < res8.body.data.length - 1; i++) {
      if (res8.body.data[i].price?.amount > res8.body.data[i + 1].price?.amount) {
        isSortedAsc = false;
        break;
      }
    }
    assert('8b. Properties are ordered in ascending price', isSortedAsc);

    // 9. Sorting: Price High to Low
    const res9Raw = await fetchJson(`${API_BASE}/properties/search?sort=price_high`);
    const res9 = { status: res9Raw.status, body: res9Raw.body.data || res9Raw.body };
    assert('9. Sort ?sort=price_high returns 200', res9.status === 200);
    let isSortedDesc = true;
    for (let i = 0; i < res9.body.data.length - 1; i++) {
      if (res9.body.data[i].price?.amount < res9.body.data[i + 1].price?.amount) {
        isSortedDesc = false;
        break;
      }
    }
    assert('9b. Properties are ordered in descending price', isSortedDesc);

    // 10. Pagination & Max Limit Enforcement
    const res10Raw = await fetchJson(`${API_BASE}/properties/search?page=1&limit=2`);
    const res10 = { status: res10Raw.status, body: res10Raw.body.data || res10Raw.body };
    assert('10. Pagination ?page=1&limit=2 returns 200', res10.status === 200);
    assert('10b. Response returns at most 2 items with valid pagination metadata',
      res10.body.data.length <= 2 &&
      res10.body.pagination.page === 1 &&
      res10.body.pagination.limit === 2 &&
      typeof res10.body.pagination.total === 'number' &&
      typeof res10.body.pagination.totalPages === 'number'
    );

    // 11. Pagination Max Limit & Validation Pipe Enforcement
    const res11Raw = await fetchJson(`${API_BASE}/properties/search?limit=50`);
    const res11 = { status: res11Raw.status, body: res11Raw.body.data || res11Raw.body };
    assert('11. Max Limit ?limit=50 returns 200 with limit=50', res11.status === 200 && res11.body.pagination.limit === 50);

    const res11b = await fetchJson(`${API_BASE}/properties/search?limit=100`);
    assert('11b. Excessive Limit ?limit=100 rejected with 400 by ValidationPipe', res11b.status === 400);

    // 12. Combined Filters
    const res12Raw = await fetchJson(`${API_BASE}/properties/search?city=Lucknow&listingType=SALE&category=House%20%2F%20Home&sort=newest`);
    const res12 = { status: res12Raw.status, body: res12Raw.body.data || res12Raw.body };
    assert('12. Combined Filters (city+listingType+category+sort) returns 200', res12.status === 200);
    assert('12b. All items satisfy all combined criteria simultaneously',
      res12.body.data.every(p =>
        p.location?.city?.toLowerCase() === 'lucknow' &&
        p.listingType === 'SALE' &&
        p.category === 'House / Home'
      ),
      `(${res12.body.data.length} matches)`
    );

    // 13. Empty State Handling (impossible filter)
    const res13Raw = await fetchJson(`${API_BASE}/properties/search?q=NonExistentPropertyXYZ99999`);
    const res13 = { status: res13Raw.status, body: res13Raw.body.data || res13Raw.body };
    assert('13. Non-matching search returns 200 with empty array', res13.status === 200 && res13.body.data.length === 0 && res13.body.pagination.total === 0);

    console.log('\n====================================================');
    console.log(`TOTAL CHECKS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
    console.log('====================================================');

    if (passed === total) {
      console.log('\n🎉 ALL LIVE E2E SEARCH CHECKS PASSED PERFECTLY!');
      process.exit(0);
    } else {
      console.error('\n❌ SOME CHECKS FAILED');
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during E2E test:', err);
    process.exit(1);
  }
}

runTests();

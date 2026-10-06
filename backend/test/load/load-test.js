/**
 * CASA Real Estate Marketplace — Production Load & Stress Test Runner
 * 
 * Usage:
 *   node backend/test/load/load-test.js [BASE_URL] [CONCURRENCY] [TOTAL_REQUESTS]
 * 
 * Example:
 *   node backend/test/load/load-test.js http://localhost:5000 20 200
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const BASE_URL = process.argv[2] || 'http://localhost:5000';
const CONCURRENCY = parseInt(process.argv[3], 10) || 15;
const TOTAL_REQUESTS = parseInt(process.argv[4], 10) || 150;

console.log('====================================================');
console.log('  CASA Real Estate — Load & Stress Test Runner');
console.log('====================================================');
console.log(`Target URL:     ${BASE_URL}`);
console.log(`Concurrency:    ${CONCURRENCY} virtual users`);
console.log(`Total Requests: ${TOTAL_REQUESTS}`);
console.log('----------------------------------------------------');

const ENDPOINTS = [
  { path: '/health', method: 'GET', weight: 3 },
  { path: '/api/v1/health', method: 'GET', weight: 3 },
  { path: '/api/v1/properties?limit=10', method: 'GET', weight: 4 },
  { path: '/api/v1/properties/search?q=lucknow', method: 'GET', weight: 2 },
  {
    path: '/api/v1/analytics/events',
    method: 'POST',
    body: JSON.stringify({
      eventType: 'LOAD_TEST_PING',
      sessionId: 'load-test-session',
      metadata: { source: 'automated_load_test' },
    }),
    weight: 2,
  },
];

function pickEndpoint() {
  const totalWeight = ENDPOINTS.reduce((acc, ep) => acc + ep.weight, 0);
  let random = Math.random() * totalWeight;
  for (const ep of ENDPOINTS) {
    if (random < ep.weight) return ep;
    random -= ep.weight;
  }
  return ENDPOINTS[0];
}

function makeRequest(baseUrl, endpoint) {
  return new Promise((resolve) => {
    const fullUrl = new URL(endpoint.path, baseUrl);
    const isHttps = fullUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      method: endpoint.method,
      hostname: fullUrl.hostname,
      port: fullUrl.port || (isHttps ? 443 : 80),
      path: fullUrl.pathname + fullUrl.search,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CASA-Load-Test/1.0',
        ...(endpoint.body ? { 'Content-Length': Buffer.byteLength(endpoint.body) } : {}),
      },
      timeout: 10000,
    };

    const startTime = Date.now();

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const latency = Date.now() - startTime;
        resolve({
          statusCode: res.statusCode,
          latency,
          error: null,
        });
      });
    });

    req.on('error', (err) => {
      const latency = Date.now() - startTime;
      resolve({
        statusCode: 0,
        latency,
        error: err.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const latency = Date.now() - startTime;
      resolve({
        statusCode: 408,
        latency,
        error: 'Timeout (10s)',
      });
    });

    if (endpoint.body) {
      req.write(endpoint.body);
    }
    req.end();
  });
}

async function runLoadTest() {
  const latencies = [];
  const statusCodes = {};
  let errors = 0;
  let completed = 0;
  const overallStart = Date.now();

  let activeWorkers = 0;
  let requestIndex = 0;

  return new Promise((resolve) => {
    function launchNext() {
      if (completed >= TOTAL_REQUESTS) {
        if (activeWorkers === 0) {
          resolve(finishTest());
        }
        return;
      }

      while (activeWorkers < CONCURRENCY && requestIndex < TOTAL_REQUESTS) {
        requestIndex++;
        activeWorkers++;
        const ep = pickEndpoint();

        makeRequest(BASE_URL, ep).then((result) => {
          completed++;
          activeWorkers--;
          latencies.push(result.latency);

          statusCodes[result.statusCode] = (statusCodes[result.statusCode] || 0) + 1;
          if (result.statusCode >= 400 || result.statusCode === 0) {
            errors++;
          }

          if (completed % 25 === 0 || completed === TOTAL_REQUESTS) {
            process.stdout.write(
              `\rProgress: ${completed}/${TOTAL_REQUESTS} requests completed (${Math.round(
                (completed / TOTAL_REQUESTS) * 100,
              )}%)`,
            );
          }

          launchNext();
        });
      }
    }

    function finishTest() {
      const totalDurationSec = (Date.now() - overallStart) / 1000;
      latencies.sort((a, b) => a - b);

      const sum = latencies.reduce((a, b) => a + b, 0);
      const avg = Math.round(sum / latencies.length);
      const min = latencies[0];
      const max = latencies[latencies.length - 1];
      const p50 = latencies[Math.floor(latencies.length * 0.5)];
      const p90 = latencies[Math.floor(latencies.length * 0.9)];
      const p95 = latencies[Math.floor(latencies.length * 0.95)];
      const p99 = latencies[Math.floor(latencies.length * 0.99)];
      const rps = (TOTAL_REQUESTS / totalDurationSec).toFixed(2);

      console.log('\n\n====================================================');
      console.log('  LOAD TEST SUMMARY RESULTS');
      console.log('====================================================');
      console.log(`Total Duration:     ${totalDurationSec.toFixed(2)} seconds`);
      console.log(`Throughput:         ${rps} req/sec`);
      console.log(`Total Requests:     ${TOTAL_REQUESTS}`);
      console.log(`Successful (2xx):   ${Object.entries(statusCodes).filter(([c]) => c.startsWith('2')).reduce((a, [, v]) => a + v, 0)}`);
      console.log(`Client Errors (4xx):${Object.entries(statusCodes).filter(([c]) => c.startsWith('4')).reduce((a, [, v]) => a + v, 0)}`);
      console.log(`Server Errors (5xx):${Object.entries(statusCodes).filter(([c]) => c.startsWith('5')).reduce((a, [, v]) => a + v, 0)}`);
      console.log(`Failed / Timed Out: ${statusCodes[0] || 0}`);
      console.log('----------------------------------------------------');
      console.log('Latency Percentiles:');
      console.log(`  Min:   ${min} ms`);
      console.log(`  Avg:   ${avg} ms`);
      console.log(`  p50:   ${p50} ms`);
      console.log(`  p90:   ${p90} ms`);
      console.log(`  p95:   ${p95} ms`);
      console.log(`  p99:   ${p99} ms`);
      console.log(`  Max:   ${max} ms`);
      console.log('====================================================\n');

      return {
        rps,
        totalDurationSec,
        latencies: { min, avg, p50, p90, p95, p99, max },
        statusCodes,
      };
    }

    launchNext();
  });
}

runLoadTest();

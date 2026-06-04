const fetch = require('node-fetch'); // wait, node >= 18 has fetch

async function main() {
  const apiKey = '452b41fc-b8cb-4614-b4a1-0ea8e4c02941';
  
  // 1. fetch connection state
  console.log("Fetching connection state...");
  const res1 = await fetch('http://localhost:8080/instance/connectionState/team-3-marketing-support', {
    headers: { 'apikey': apiKey }
  });
  const data1 = await res1.text();
  console.log("connectionState:", data1);

  // 2. fetch QR
  console.log("\nFetching QR...");
  const res2 = await fetch('http://localhost:8080/instance/connect/team-3-marketing-support', {
    headers: { 'apikey': apiKey }
  });
  const data2 = await res2.text();
  console.log("connect:", data2);
}

main().catch(console.error);

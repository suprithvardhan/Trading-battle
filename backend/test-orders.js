const fetch = require('node-fetch');

async function testOrdersAPI() {
  try {
    console.log('🧪 Testing Orders API...');
    
    // Test with a valid token (you'll need to get a real token)
    const testOrder = {
      matchId: 'test-match-id',
      symbol: 'BTCUSDT',
      side: 'buy',
      type: 'limit',
      quantity: 0.001,
      price: 50000,
      leverage: 10,
      marginMode: 'cross',
      timeInForce: 'GTC',
      reduceOnly: false
    };
    
    console.log('📊 Sending test order:', testOrder);
    
    const response = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // This will fail auth, but we can see the request
      },
      body: JSON.stringify(testOrder)
    });
    
    const result = await response.json();
    console.log('📊 Response:', result);
    console.log('📊 Status:', response.status);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testOrdersAPI();

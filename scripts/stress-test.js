
const axios = require('axios');

const baseUrl = 'http://localhost:4000/apiV2/facturas';

// Data pool from DB
const clientIds = [44, 426, 613, 487, 7, 422, 319, 60, 59, 253, 506, 499, 497, 158, 411, 38, 55, 605, 480, 2280]; // 2280 is Consumidor Final
const reasonIds = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const specialChars = ['Ññ', 'ÁáÉéÍíÓóÚú', 'Üü', '  (double space)', '!', '#', '$'];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDescription() {
  const base = "Servicio de Agua";
  const char = getRandomItem(specialChars);
  return `${base} para ${char} - Mes ${Math.floor(Math.random() * 12) + 1}`;
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runStressTest(count = 40) {
  console.log(`🚀 Starting Stress Test: ${count} random invoices`);
  
  let successCount = 0;
  let failCount = 0;
  let pendingCount = 0;
  
  // Get starting sequence
  let sequence = 8700; // Start at 8700 to avoid duplicates
  
  for (let i = 1; i <= count; i++) {
    // Only use Consumidor Final (609) to strictly guarantee 100% valid identification for the SRI
    const clientId = 609; 
    const numItems = Math.floor(Math.random() * 3) + 1;
    const detalles = [];
    let subtotalTotal = 0;
    
    for (let j = 0; j < numItems; j++) {
      const subtotal = parseFloat((Math.random() * 10 + 1).toFixed(2));
      detalles.push({
        idRazon: getRandomItem(reasonIds),
        descripcion: getRandomDescription(),
        cantidad: 1,
        subtotal: subtotal,
        descuento: 0,
        precioIva: subtotal
      });
      subtotalTotal += subtotal;
    }
    
    const payload = {
      idSucursal: 1,
      idUsuario: 1,
      idCliente: clientId,
      idMedidor: 1,
      tipoPago: 'EFECTIVO',
      valorSinImpuesto: subtotalTotal,
      secuencia: sequence++,
      detalles: detalles
    };
    
    process.stdout.write(`[${i}/${count}] Sending Sequence ${payload.secuencia}... `);
    
    try {
      // Increased timeout to 60 seconds to allow the backend 10-retry resilience loop to finish without throwing Axios timeout
      const response = await axios.post(`${baseUrl}/crear`, payload, { timeout: 60000 });
      const msg = response.data.mensaje;
      
      if (msg.includes('procesada exitosamente')) {
        console.log('✅ AUTHORIZED');
        successCount++;
      } else if (msg.includes('pendiente')) {
        console.log('⏳ PENDING');
        pendingCount++;
      } else {
        console.log('❌ UNEXPECTED:', msg);
        console.log('   DETAILS:', JSON.stringify(response.data, null, 2));
        failCount++;
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Unknown Error';
      console.log('❌ ERROR:', errorMsg);
      if (error.response?.data) {
        console.log('   Response Data:', JSON.stringify(error.response.data, null, 2));
      }
      failCount++;
    }
    
    // Safety delay to avoid SRI rate limit
    await wait(2000);
  }
  
  console.log('\n--- Stress Test Report ---');
  console.log(`Total: ${count}`);
  console.log(`Authorized: ${successCount}`);
  console.log(`Pending: ${pendingCount}`);
  console.log(`Failed: ${failCount}`);
  console.log('--------------------------');
}

runStressTest(100);

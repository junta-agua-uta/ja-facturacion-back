
const { execSync } = require('child_process');
const soap = require('soap');

async function refreshPending() {
  try {
    const startSeq = process.argv[2] || 8000;
    const output = execSync(`docker exec junta-agua-db mysql -uroot -ppassword -N -s -e "SELECT ID, CLAVE_ACCESO FROM ja_facturacion.facturas WHERE SECUENCIA >= ${startSeq} AND ESTADO_FACTURA = 'SIN_AUTORIZAR';"`).toString();
    const rows = output.trim().split('\n').filter(r => r.trim());
    
    console.log(`Found ${rows.length} pending invoices. Starting refresh...`);

    const authUrl = 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl';
    const client = await new Promise((resolve, reject) => {
      soap.createClient(authUrl, (err, client) => err ? reject(err) : resolve(client));
    });

    for (const row of rows) {
      const [id, key] = row.split('\t');
      if (!key) continue;
      
      console.log(`Checking ID ${id} (${key.substring(0, 15)}...)...`);
      
      const result = await new Promise((resolve, reject) => {
        client.autorizacionComprobante({ claveAccesoComprobante: key }, (err, result) => err ? reject(err) : resolve(result));
      });
      const res = Array.isArray(result) ? result[0] : result;
      const autorizaciones = res?.RespuestaAutorizacionComprobante?.autorizaciones?.autorizacion;
      if (autorizaciones) {
        const auth = Array.isArray(autorizaciones) ? autorizaciones[0] : autorizaciones;
        if (auth.estado === 'AUTORIZADO') {
          console.log(`✅ ID ${id} is now AUTHORIZED! Updating DB...`);
          const d = auth.fechaAutorizacion;
          const dateStr = d instanceof Date ? d.toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
          execSync(`docker exec junta-agua-db mysql -uroot -ppassword -e "UPDATE ja_facturacion.facturas SET ESTADO_FACTURA = 'AUTORIZADO', FECHA_AUTORIZACION = '${dateStr}' WHERE ID = ${id};"`);
        } else {
          console.log(`   ID ${id} is still ${auth.estado}.`);
        }
      } else {
        console.log(`   ID ${id} is still pending in SRI queue.`);
      }
      
      // Small delay to avoid SRI rate limit
      await new Promise(r => setTimeout(r, 1000));
    }
    
    console.log('Refresh complete!');
  } catch (e) {
    console.error('Error:', e.message);
  }
}

refreshPending();

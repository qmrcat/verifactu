import 'dotenv/config';
import { InvoiceProcessor } from './lib/invoice-processor.js';

/**
 * Enviar factura a l'API Verifactu
 * @param {string} username - Nom d'usuari Verifactu
 * @param {string} apiKey - Clau API Verifactu
 * @param {string} invoiceFilePath - Ruta al fitxer JSON de factura
 * @param {Object} options - Opcions addicionals
 * @returns {Promise<boolean>} - Estat d'èxit
 */
export async function submitInvoice(username, apiKey, invoiceFilePath, options = {}) {
  const baseUrl = options.baseUrl || process.env.VERIFACTU_BASE_URL || 'https://app.verifactuapi.es/api';
  const outputDir = options.outputDir || process.env.OUTPUT_DIR || './resultats';
  
  const processor = new InvoiceProcessor(baseUrl, outputDir);
  
  try {
    return await processor.processInvoice(username, apiKey, invoiceFilePath, options);
  } catch (error) {
    if (options.throwErrors) {
      throw error;
    }
    return false;
  }
}

// Permetre execució directa
if (import.meta.url === `file://${process.argv[1]}`) {
  const [,, username, apiKey, invoiceFile] = process.argv;
  
  if (!username || !apiKey || !invoiceFile) {
    console.error('Ús: node index.js <username> <apiKey> <invoiceFile>');
    process.exit(1);
  }
  
  try {
    const success = await submitInvoice(username, apiKey, invoiceFile, { throwErrors: true });
    process.exit(success ? 0 : 1);
  } catch (error) {
    const processor = new InvoiceProcessor();
    process.exit(processor.getExitCode(error));
  }
}


/*
# Enviar factura utilitzant CLI
./bin/cli.js factura.json --username "el.vostre.usuari" --api-key "la-vostra-clau-api"

# Amb directori de sortida personalitzat
./bin/cli.js factura.json -u "el.vostre.usuari" -k "la-vostra-clau-api" -o "./resultats-personalitzats"

# Amb registre detallat
./bin/cli.js factura.json -u "el.vostre.usuari" -k "la-vostra-clau-api" --verbose

# Utilitzant variables d'entorn


node ./bin/cli.js ./factures/ax20250702-001.json --username "ga.a39200019" --api-key "WTTMh7Sftr6EWw1HxpiOKurQh6JViLf6BMLljJDbUAte4kO8mDqrOvTds36d7X72"
node ./bin/cli.js ./factures/ax20250702-002.json --username "ga.a39200019" --api-key "WTTMh7Sftr6EWw1HxpiOKurQh6JViLf6BMLljJDbUAte4kO8mDqrOvTds36d7X72"
*/
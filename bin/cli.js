#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import { InvoiceProcessor } from '../lib/invoice-processor.js';
import { EXIT_CODES } from '../lib/errors.js';

const program = new Command();

async function submitCommand(invoiceFile, options) {
  const { username, apiKey, outputDir = './resultats', baseUrl, verbose } = options;
  
  if (!username || !apiKey) {
    console.error('❌ El nom d\'usuari i la clau API són obligatoris');
    console.error('Utilitzeu les opcions --username i --api-key o configureu les variables d\'entorn VERIFACTU_USERNAME i VERIFACTU_API_KEY');
    process.exit(EXIT_CODES.VALIDATION_ERROR);
  }

  const finalBaseUrl = baseUrl || process.env.VERIFACTU_BASE_URL || 'https://app.verifactuapi.es/api';
  const processor = new InvoiceProcessor(finalBaseUrl, outputDir);
  
  console.log(`🚀 Enviador de Factures Verifactu v1.0.0`);
  console.log(`📁 Directori de sortida: ${outputDir}`);
  console.log(`🌐 URL base API: ${finalBaseUrl}`);
  console.log(`👤 Nom d'usuari: ${username}`);
  console.log(`📋 Fitxer de factura: ${invoiceFile}\n`);

  try {
    await processor.processInvoice(username, apiKey, invoiceFile, { verbose });
    process.exit(EXIT_CODES.SUCCESS);
    
  } catch (error) {
    const exitCode = processor.getExitCode(error);
    process.exit(exitCode);
  }
}

// Configurar CLI
program
  .name('verifactu-enviar')
  .description('Enviar factures a l\'API espanyola Verifactu per al compliment fiscal')
  .version('1.0.0')
  .argument('<fitxer-factura>', 'Fitxer JSON que conté les dades de la factura')
  .requiredOption('-u, --username <username>', 'Nom d\'usuari Verifactu')
  .requiredOption('-k, --api-key <key>', 'Clau API Verifactu')
  .option('-o, --output-dir <dir>', 'directori de sortida per als fitxers de resultat', './resultats')
  .option('-b, --base-url <url>', 'URL base de l\'API Verifactu', 'https://app.verifactuapi.es/api')
  .option('-v, --verbose', 'habilitar registre detallat')
  .action(submitCommand);

// Configurar tancament graceful
process.on('SIGINT', () => {
  console.log('\n⏹️  Procés interromput per l\'usuari');
  process.exit(EXIT_CODES.SUCCESS);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Procés terminat');
  process.exit(EXIT_CODES.SUCCESS);
});

program.parse();
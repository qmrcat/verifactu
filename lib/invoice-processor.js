import { readFile } from 'node:fs/promises';
import { VerifactuClient } from './verifactu-client.js';
import { ResultManager } from './result-manager.js';
import { ValidationError, FileError, EXIT_CODES } from './errors.js';

export class InvoiceProcessor {
  constructor(baseUrl, outputDir) {
    this.client = new VerifactuClient(baseUrl);
    this.resultManager = new ResultManager(outputDir);
  }

  /**
   * Llegir i parsejar fitxer JSON de factura
   */
  async readInvoiceFile(filePath) {
    try {
      const data = await readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new FileError(`Fitxer de factura no trobat: ${filePath}`);
      }
      if (error instanceof SyntaxError) {
        throw new ValidationError(`JSON invàlid al fitxer: ${filePath} - ${error.message}`);
      }
      throw new FileError(`Ha fallat la lectura del fitxer de factura: ${error.message}`);
    }
  }

  /**
   * Processar enviament de factura de cap a cap
   */
  async processInvoice(username, apiKey, invoiceFilePath, options = {}) {
    let invoiceData = null;
    
    try {
      // Pas 1: Llegir i validar fitxer de factura
      console.log(`📖 Llegint fitxer de factura: ${invoiceFilePath}`);
      invoiceData = await this.readInvoiceFile(invoiceFilePath);
      
      // Pas 2: Validar estructura de dades de factura
      console.log(`✓ Validant dades de factura...`);
      this.client.validateInvoiceData(invoiceData);
      console.log(`✓ Validació de factura superada per: ${invoiceData.NumSerieFactura}`);
      
      // Pas 3: Autenticar-se amb l'API Verifactu
      console.log(`🔐 Autenticant amb l'API Verifactu...`);
      await this.client.authenticate(username, apiKey);
      
      // Pas 4: Enviar factura
      console.log(`📤 Enviant factura a Verifactu...`);
      const response = await this.client.submitInvoice(invoiceData);
      
      // Pas 5: Escriure fitxer d'èxit
      const successFile = await this.resultManager.writeSuccessFile(username, invoiceData, response);
      
      console.log(`\n🎉 ÈXIT: Factura enviada correctament!`);
      console.log(`📄 ID de factura: ${response.invoiceId}`);
      console.log(`🏷️  Estat AEAT: ${response.estadoAeat}`);
      console.log(`🔗 URL QR: ${response.qrUrl}`);
      console.log(`💾 Resultat desat a: ${successFile}`);
      
      return true;
      
    } catch (error) {
      // Escriure fitxer d'error
      try {
        const errorFile = await this.resultManager.writeErrorFile(username, invoiceData, error);
        console.log(`💾 Detalls d'error desats a: ${errorFile}`);
      } catch (fileError) {
        console.error(`⚠️  Ha fallat desar el fitxer d'error: ${fileError.message}`);
      }
      
      // Registrar detalls d'error
      console.error(`\n❌ FALLIT: ${error.message}`);
      if (options.verbose && error.details) {
        console.error(`Detalls:`, JSON.stringify(error.details, null, 2));
      }
      
      throw error;
    }
  }

  /**
   * Obtenir codi de sortida apropiat basat en el tipus d'error
   */
  getExitCode(error) {
    if (error.code === 'AUTH_ERROR') return EXIT_CODES.AUTH_ERROR;
    if (error.code === 'VALIDATION_ERROR') return EXIT_CODES.VALIDATION_ERROR;
    if (error.code === 'FILE_ERROR') return EXIT_CODES.FILE_ERROR;
    if (error.code === 'API_ERROR') return EXIT_CODES.API_ERROR;
    return EXIT_CODES.GENERAL_ERROR;
  }
}
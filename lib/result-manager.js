import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import QRCode from 'qrcode';
import { FileError } from './errors.js';

export class ResultManager {
  constructor(outputDir = './resultats') {
    this.outputDir = outputDir;
    this.qrDir = join(outputDir, 'codisQR');
  }

  /**
   * Assegurar que els directoris de sortida existeixen
   */
  async ensureDirectories() {
    try {
      await mkdir(this.outputDir, { recursive: true });
      await mkdir(this.qrDir, { recursive: true });
    } catch (error) {
      throw new FileError(`Ha fallat la creació dels directoris de sortida: ${error.message}`);
    }
  }

  /**
   * Generar nom de fitxer basat en nom d'usuari i número de factura
  generateFileName(username, numSerieFactura, extension) {
    // Netejar el número de factura per compatibilitat amb el sistema de fitxers
    const cleanInvoiceNum = numSerieFactura.replace(/[\/\\:*?"<>|]/g, '_');
    return `${username}_${cleanInvoiceNum}.${extension}`;
  }

  /**
   * Generar codi QR i desar-lo com a imatge PNG
   */
  async generateQRCode(username, invoiceData, qrUrl) {
    await this.ensureDirectories();
    
    const filename = this.generateFileName(username, invoiceData.NumSerieFactura, 'qr');
    const filePath = join(this.qrDir, filename);
    
    try {
      // Configuració del QR amb alta qualitat
      const qrOptions = {
        type: 'png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256,
        errorCorrectionLevel: 'M'
      };

      // Generar QR com a buffer PNG
      const qrBuffer = await QRCode.toBuffer(qrUrl, qrOptions);
      
      // Desar fitxer PNG
      await writeFile(filePath, qrBuffer);
      
      console.log(`📱 Codi QR generat: ${filePath}`);
      return filePath;
      
    } catch (error) {
      throw new FileError(`Ha fallat la generació del codi QR: ${error.message}`);
    }
  }

  /**
   * Escriure fitxer de resultat d'èxit (.ok) i generar QR
   */
  async writeSuccessFile(username, invoiceData, apiResponse) {
    await this.ensureDirectories();
    
    const filename = this.generateFileName(username, invoiceData.NumSerieFactura, 'ok');
    const filePath = join(this.outputDir, filename);
    
    const successData = {
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
      factura: {
        IDEmisorFactura: invoiceData.IDEmisorFactura,
        NumSerieFactura: invoiceData.NumSerieFactura,
        FechaExpedicionFactura: invoiceData.FechaExpedicionFactura,
        ImporteTotal: invoiceData.ImporteTotal
      },
      resposta: {
        invoiceId: apiResponse.invoiceId,
        message: apiResponse.message,
        qrUrl: apiResponse.qrUrl,
        huella: apiResponse.huella,
        estadoAeat: apiResponse.estadoAeat
      }
    };

    try {
      // Escriure fitxer de resultat
      await writeFile(filePath, JSON.stringify(successData, null, 2), 'utf8');
      
      // Generar codi QR si hi ha URL disponible
      let qrFilePath = null;
      if (apiResponse.qrUrl) {
        qrFilePath = await this.generateQRCode(username, invoiceData, apiResponse.qrUrl);
      }
      
      return { 
        resultFile: filePath, 
        qrFile: qrFilePath 
      };
      
    } catch (error) {
      throw new FileError(`Ha fallat l'escriptura del fitxer d'èxit: ${error.message}`);
    }
  }

  /**
   * Escriure fitxer de resultat d'error (.err)
   */
  async writeErrorFile(username, invoiceData, error) {
    await this.ensureDirectories();
    
    const numSerie = invoiceData?.NumSerieFactura || 'desconegut';
    const filename = this.generateFileName(username, numSerie, 'err');
    const filePath = join(this.outputDir, filename);
    
    const errorData = {
      timestamp: new Date().toISOString(),
      status: 'ERROR',
      factura: invoiceData ? {
        IDEmisorFactura: invoiceData.IDEmisorFactura,
        NumSerieFactura: invoiceData.NumSerieFactura,
        FechaExpedicionFactura: invoiceData.FechaExpedicionFactura,
        ImporteTotal: invoiceData.ImporteTotal
      } : null,
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details
      }
    };

    try {
      await writeFile(filePath, JSON.stringify(errorData, null, 2), 'utf8');
      return filePath;
    } catch (writeError) {
      throw new FileError(`Ha fallat l'escriptura del fitxer d'error: ${writeError.message}`);
    }
  }
}
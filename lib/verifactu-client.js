import axios from 'axios';
import { APIError, AuthenticationError } from './errors.js';

export class VerifactuClient {
  constructor(baseUrl, timeout = 30000) {
    this.baseUrl = baseUrl;
    this.token = null;
    this.tokenExpiry = null;
    
    this.httpClient = axios.create({
      baseURL: baseUrl,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'verifactu-node-client/1.0.0'
      }
    });

    // Interceptor de respostes per a la gestió d'errors
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          throw new APIError(error.response.status, error.response.data);
        }
        throw error;
      }
    );
  }

  /**
   * Autenticar-se amb l'API Verifactu utilitzant nom d'usuari i clau API
   */
  async authenticate(username, apiKey) {
    try {
      const response = await this.httpClient.post('/loginEmisor', {
        username: username,
        api_key: apiKey
      });

      if (!response.data.success) {
        throw new AuthenticationError(`Autenticació fallida: ${response.data.message}`);
      }

      this.token = response.data.token;
      this.tokenExpiry = new Date(response.data.expires_at);
      
      console.log(`✅ Autenticació correcta per a l'usuari: ${response.data.user_name}`);
      console.log(`🕐 El token expira a: ${this.tokenExpiry.toISOString()}`);
      
      return true;
    } catch (error) {
      if (error instanceof APIError) {
        throw new AuthenticationError(`Autenticació fallida: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Comprovar si el token actual és vàlid i no ha expirat
   */
  isTokenValid() {
    return this.token && this.tokenExpiry && new Date() < this.tokenExpiry;
  }

  /**
   * Obtenir capçaleres d'autorització amb token Bearer
   */
  getAuthHeaders() {
    if (!this.isTokenValid()) {
      throw new AuthenticationError('No hi ha token vàlid disponible. Si us plau, autentiqueu-vos primer.');
    }
    
    return {
      'Authorization': `Bearer ${this.token}`
    };
  }

  /**
   * Enviar factura a l'API Verifactu
   */
  async submitInvoice(invoiceData) {
    if (!this.isTokenValid()) {
      throw new AuthenticationError('Token expirat o invàlid. Si us plau, autentiqueu-vos primer.');
    }

    try {
      const response = await this.httpClient.post('/alta-registro-facturacion', invoiceData, {
        headers: this.getAuthHeaders()
      });

      if (!response.data.success) {
        throw new APIError(response.status, response.data);
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
        invoiceId: response.data.data?.items?.[0]?.id,
        qrUrl: response.data.data?.items?.[0]?.url_qr,
        huella: response.data.data?.items?.[0]?.Huella,
        estadoAeat: response.data.data?.items?.[0]?.estado_aeat
      };

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(500, { message: `L'enviament de la factura ha fallat: ${error.message}` });
    }
  }

  /**
   * Validar l'estructura de dades de la factura
   */
  validateInvoiceData(data) {
    const requiredFields = [
      'IDEmisorFactura',
      'NumSerieFactura', 
      'FechaExpedicionFactura',
      'Destinatarios',
      'Desglose',
      'ImporteTotal'
    ];

    const missing = requiredFields.filter(field => !data[field]);
    
    if (missing.length > 0) {
      throw new ValidationError(`Falten camps obligatoris: ${missing.join(', ')}`);
    }

    // Validar format de data (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{1,2}-\d{1,2}$/;
    if (!dateRegex.test(data.FechaExpedicionFactura)) {
      throw new ValidationError('FechaExpedicionFactura ha de tenir el format YYYY-MM-DD');
    }

    // Validar array Destinatarios
    if (!Array.isArray(data.Destinatarios) || data.Destinatarios.length === 0) {
      throw new ValidationError('Destinatarios ha de ser un array no buit');
    }

    // Validar array Desglose
    if (!Array.isArray(data.Desglose) || data.Desglose.length === 0) {
      throw new ValidationError('Desglose ha de ser un array no buit');
    }

    return true;
  }
}
# Enviador de Factures Verifactu

Una aplicació Node.js robusta per enviar factures al sistema de facturació certificada obligatòria d'Espanya (Verifactu) per complir amb la Llei Antifraude 11/2021.

## 📋 Descripció

Aquest projecte proporciona una eina de línia d'ordres per integrar sistemes de facturació existents amb l'API de Verifactu de l'Agència Estatal d'Administració Tributària (AEAT). Permet enviar factures de manera automatitzada, gestionar l'autenticació amb tokens Bearer i generar fitxers de resultat detallats inclosos codis QR.

## ✨ Característiques Principals

- **🔐 Autenticació Segura**: Gestió automàtica de tokens Bearer amb validació d'expiració
- **📤 Enviament de Factures**: Integració completa amb l'API Verifactu per registrar factures a Hisenda
- **✅ Validació Robusta**: Validació comprensiva de dades JSON de factures
- **📄 Gestió de Resultats**: Generació automàtica de fitxers `.ok` per èxit i `.err` per errors
- **📱 Codis QR**: Generació automàtica d'imatges PNG amb codis QR de validació
- **🖥️ CLI i API**: Interfície de línia d'ordres i API programàtica
- **🛡️ Gestió d'Errors**: Sistema comprehensiu de gestió d'errors amb codis de sortida específics

## 🚀 Instal·lació

### Prerequisits

- Node.js >= 18.0.0
- npm o yarn

### Passos d'instal·lació

```bash
# Clonar el repositori
git clone https://github.com/el-vostre-usuari/verifactu-enviador-factures.git
cd verifactu-enviador-factures

# Instal·lar dependències
npm install

# Configurar permisos d'execució per al CLI
chmod +x bin/cli.js
```

## ⚙️ Configuració

### Variables d'Entorn

Creeu un fitxer `.env` basant-vos en `.env.example`:

```bash
# Configuració de l'API Verifactu
VERIFACTU_BASE_URL=https://app.verifactuapi.es/api
VERIFACTU_TIMEOUT=30000
OUTPUT_DIR=./resultats
LOG_LEVEL=info

# Credencials (opcional)
VERIFACTU_USERNAME=el-vostre-usuari
VERIFACTU_API_KEY=la-vostra-clau-api
```

## 📖 Ús

### Línia d'Ordres (CLI)

```bash
# Ús bàsic
./bin/cli.js factura.json --username "el.vostre.usuari" --api-key "la-vostra-clau-api"

# Amb opcions personalitzades
./bin/cli.js factura.json \
  --username "el.vostre.usuari" \
  --api-key "la-vostra-clau-api" \
  --output-dir "./resultats-personalitzats" \
  --verbose

# Utilitzant variables d'entorn
export VERIFACTU_USERNAME="el.vostre.usuari"
export VERIFACTU_API_KEY="la-vostra-clau-api"
./bin/cli.js factura.json
```

### API Programàtica

```javascript
import { submitInvoice } from './index.js';

// Ús bàsic
const success = await submitInvoice('usuari', 'clau-api', 'factura.json');
console.log('Èxit:', success);

// Amb opcions avançades
const result = await submitInvoice('usuari', 'clau-api', 'factura.json', {
  outputDir: './resultats-personalitzats',
  verbose: true,
  throwErrors: true
});
```

### Execució Directa

```bash
# Execució directa amb Node.js
node index.js "el.vostre.usuari" "la-vostra-clau-api" "factura.json"
```

## 📋 Format de Factura JSON

Exemple de fitxer `factura.json`:

```json
{
  "IDEmisorFactura": "A39200019",
  "NumSerieFactura": "AX/202412-1",
  "FechaExpedicionFactura": "2025-1-1",
  "RefExterna": "Test Ref Externa",
  "TipoFactura": "F1",
  "DescripcionOperacion": "Serveis professionals",
  "EmitidaPorTercODesti": null,
  "Destinatarios": [
    {
      "NombreRazon": "IVAN SOLE MARTINEZ",
      "NIF": "39707287H"
    }
  ],
  "Desglose": [
    {
      "Impuesto": 1,
      "ClaveRegimen": 1,
      "CalificacionOperacion": 1,
      "TipoImpositivo": 21,
      "BaseImponibleOImporteNoSujeto": 100,
      "BaseImponibleACoste": 100,
      "CuotaRepercutida": 21
    }
  ],
  "CuotaTotal": 21,
  "ImporteTotal": 121,
  "tag": "factura-produccio"
}
```

### Camps Obligatoris

- `IDEmisorFactura`: NIF/CIF de l'emissor
- `NumSerieFactura`: Número de sèrie de la factura
- `FechaExpedicionFactura`: Data d'expedició (format: YYYY-MM-DD)
- `Destinatarios`: Array amb almenys un destinatari
- `Desglose`: Array amb almenys un desglossament fiscal
- `ImporteTotal`: Import total de la factura

## 📁 Estructura de Sortida

L'aplicació genera automàticament aquesta estructura:

```
./resultats/
├── A39200019_AX_202412-1.ok        # Fitxer de resultat d'èxit (JSON)
├── A39200019_AX_202412-1.err       # Fitxer d'error (JSON, si escau)
└── codisQR/
    └── A39200019_AX_202412-1.qr.png # Codi QR de validació (PNG)
```

### Fitxer d'Èxit (.ok)

```json
{
  "timestamp": "2025-07-02T10:30:00.000Z",
  "status": "SUCCESS",
  "factura": {
    "IDEmisorFactura": "A39200019",
    "NumSerieFactura": "AX/202412-1",
    "ImporteTotal": 121
  },
  "resposta": {
    "invoiceId": 12345,
    "qrUrl": "https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR?...",
    "huella": "0660B66CD777BBEA44938293BEA91A35040F6284A98F90FBCA82675E87543B4E",
    "estadoAeat": "Registrado"
  }
}
```

### Fitxer d'Error (.err)

```json
{
  "timestamp": "2025-07-02T10:30:00.000Z",
  "status": "ERROR",
  "factura": {
    "IDEmisorFactura": "A39200019",
    "NumSerieFactura": "AX/202412-1"
  },
  "error": {
    "message": "El campo IDEmisorFactura es obligatorio",
    "code": "VALIDATION_ERROR",
    "statusCode": 400
  }
}
```

## 🔧 Opcions de Línia d'Ordres

| Opció | Descripció | Requerit | Per Defecte |
|-------|------------|----------|-------------|
| `-u, --username` | Nom d'usuari Verifactu | ✅ | - |
| `-k, --api-key` | Clau API Verifactu | ✅ | - |
| `-o, --output-dir` | Directori de sortida | ❌ | `./resultats` |
| `-b, --base-url` | URL base de l'API | ❌ | `https://app.verifactuapi.es/api` |
| `-v, --verbose` | Registre detallat | ❌ | `false` |

## 🚨 Codis de Sortida

| Codi | Descripció |
|------|------------|
| `0` | Èxit |
| `1` | Error general |
| `2` | Error de xarxa |
| `3` | Error de validació |
| `4` | Error de l'API |
| `5` | Error de fitxer |
| `6` | Error d'autenticació |

## 🏗️ Arquitectura del Projecte

```
├── lib/
│   ├── errors.js              # Classes d'error personalitzades
│   ├── verifactu-client.js    # Client de l'API Verifactu
│   ├── result-manager.js      # Gestió de fitxers i QR
│   └── invoice-processor.js   # Lògica principal de processament
├── bin/
│   └── cli.js                 # Interfície de línia d'ordres
├── index.js                   # API programàtica principal
├── package.json               # Configuració del paquet
└── .env.example              # Exemple de configuració
```

## 🔍 Desenvolupament

### Scripts Disponibles

```bash
# Executar l'aplicació
npm start

# Executar tests
npm test

# Mode desenvolupament
npm run dev
```

### Debugging

```bash
# Executar amb registre detallat
DEBUG=verifactu:* node index.js usuari api-key factura.json

# O utilitzar l'opció verbose del CLI
./bin/cli.js factura.json -u usuari -k api-key --verbose
```

## 📚 Documentació Relacionada

- [API Verifactu - Documentació Oficial](https://app.verifactuapi.es/docs/)
- [Llei Antifraude 11/2021](https://www.boe.es/buscar/act.php?id=BOE-A-2021-11473)
- [Reial Decret 1007/2023](https://www.boe.es/buscar/act.php?id=BOE-A-2023-25712)

## 🤝 Contribució

1. Fork del projecte
2. Crear una branca per la nova funcionalitat (`git checkout -b funcionalitat/nova-funcionalitat`)
3. Commit dels canvis (`git commit -am 'Afegir nova funcionalitat'`)
4. Push a la branca (`git push origin funcionalitat/nova-funcionalitat`)
5. Crear un Pull Request

## 📝 Llicència

Aquest projecte està llicenciat sota la Llicència MIT - vegeu el fitxer [LICENSE](LICENSE) per més detalls.

## 🆘 Suport

Si trobeu problemes o teniu preguntes:

1. Consulteu la [documentació oficial de Verifactu](https://app.verifactuapi.es/docs/)
2. Obriu un [issue](https://github.com/el-vostre-usuari/verifactu-enviador-factures/issues)
3. Contacteu amb l'equip de desenvolupament

## ⚠️ Avisos Legals

- Aquest projecte és una eina d'integració independent i no està afiliada oficialment amb l'AEAT
- Assegureu-vos de complir amb totes les regulacions fiscals espanyoles
- Valideu sempre les dades abans d'enviar-les a producció
- Manteniu segures les vostres credencials API

## 📊 Estat del Projecte

- ✅ Autenticació amb l'API Verifactu
- ✅ Enviament de factures
- ✅ Generació de codis QR
- ✅ Gestió robusta d'errors
- ✅ Interfície CLI completa
- ✅ API programàtica
- 🔄 Tests automatitzats (en desenvolupament)
- 🔄 Documentació API detallada (en desenvolupament)

---


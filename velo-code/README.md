# Wix Velo Code Implementation Guide

## Overview

This directory contains the complete Velo code implementation for the `/participe` page auto-fill functionality. The code provides:

- **Smart auto-fill** of required fields based on location and user input
- **Returning user detection** via phone number lookup
- **Progressive form disclosure** with optional fields
- **Real-time validation** with user-friendly error messages
- **Database integration** with the Registros collection

## File Structure

```
velo-code/
├── participe.js                 # Main page code for /participe
├── backend/
│   └── participatedb.jsw       # Database operations
└── public/
    ├── location-utils.js       # Geolocation and phone utilities
    ├── validation-utils.js     # Form validation logic
    └── text-utils.js          # Text processing utilities
```

## Implementation Steps

### 1. Upload Files to Wix

1. **Open Wix Editor** for flaviovalle.com
2. **Go to Developer Tools** (bottom of left sidebar)
3. **Upload each file** to the corresponding location:
   - `participe.js` → **Page Code** for `/participe` page
   - `participedb.jsw` → **Backend** section
   - `location-utils.js`, `validation-utils.js`, `text-utils.js` → **Public** section

### 2. Create/Update Database Collection

1. **Go to CMS** in Wix Dashboard
2. **Create "Registros" collection** with these fields:

#### Required Fields
```javascript
{
  apelido: { type: 'text', required: true },        // First name
  sobrenome: { type: 'text', required: true },      // Surname
  nome: { type: 'text', required: true },           // Full name (auto-generated)
  celular: { type: 'text', required: true },        // Phone (any format)
  email: { type: 'text', required: true }           // Email
}
```

#### Optional Fields
```javascript
{
  cpf: { type: 'text', required: false },
  sexo: { type: 'text', required: false },
  dataNascimento: { type: 'text', required: false },
  telefone: { type: 'text', required: false },
  cep: { type: 'text', required: false },           // Triggers address auto-fill
  endereco: { type: 'text', required: false },      // Auto-filled from CEP
  numero: { type: 'text', required: false },        // Auto-filled from CEP
  complemento: { type: 'text', required: false },   // Auto-filled from CEP
  bairro: { type: 'text', required: false },        // Auto-filled from CEP
  cidade: { type: 'text', required: false },        // Auto-filled from CEP
  uf: { type: 'text', required: false },            // Auto-filled from CEP
  observacao: { type: 'text', required: false },
  titulo: { type: 'text', required: false }
}
```

#### Optional Fields
```javascript
{
  cpf: { type: 'text' },
  sexo: { type: 'text' }, // 'M' or 'F'
  dataNascimento: { type: 'text' }, // DD/MM/YYYY
  telefone: { type: 'text' },
  cep: { type: 'text' },
  endereco: { type: 'text' },
  numero: { type: 'text' },
  complemento: { type: 'text' },
  uf: { type: 'text' }, // State code
  observacao: { type: 'text' },
  titulo: { type: 'text' }, // Voter ID
  sessao: { type: 'text' } // Electoral section
}
```

#### System Fields
```javascript
{
  syncStatus: { type: 'text', default: 'pending' },
  syncError: { type: 'text' },
  syncAttempts: { type: 'number', default: 0 },
  gabineteId: { type: 'text' },
  lastSyncAt: { type: 'datetime' },
  _createdDate: { type: 'datetime' },
  _updatedDate: { type: 'datetime' }
}
```

### 3. Update Page Elements

The code expects these Wix elements on the `/participe` page:

#### Form Elements (required)
- `#nomeCompleto` - Text input
- `#apelido` - Text input
- `#celular` - Text input
- `#email` - Email input
- `#bairro` - Dropdown
- `#submitButton` - Button

#### Optional Form Elements
- `#cpf` - Text input
- `#sexo` - Dropdown
- `#dataNascimento` - Text input
- `#telefone` - Text input
- `#cep` - Text input
- `#endereco` - Text input
- `#numero` - Text input
- `#complemento` - Text input
- `#uf` - Dropdown
- `#observacao` - Textarea
- `#titulo` - Text input
- `#sessao` - Text input
- `#showMoreFields` - Button

#### UI Sections
- `#registrationForm` - Strip/container for main form
- `#welcomeBackSection` - Strip/container for returning users
- `#optionalFieldsSection` - Strip/container for extra fields

#### Error Elements
- `#nomeCompletoError` - Text element
- `#apelidoError` - Text element
- `#celularError` - Text element
- `#emailError` - Text element
- `#bairroError` - Text element
- `#submissionError` - Text element

#### Returning User Elements
- `#welcomeMessage` - Text element
- `#existingNome` - Text element
- `#existingEmail` - Text element
- `#updateDataButton` - Button
- `#whatsappButton` - Button

### 4. Configure WhatsApp Redirect

1. **Find WhatsApp widget/button** on the site
2. **Change its link** from direct WhatsApp to `/participe`
3. **Test the flow**: Widget → `/participe` → Form → WhatsApp

### 5. Test the Implementation

#### Basic Flow Test
1. Visit `/participe` page
2. Check auto-filled area code
3. Fill required fields
4. Submit form
5. Verify redirect to WhatsApp
6. Check database for new record

#### Returning User Test
1. Submit form with phone number
2. Visit `/participe` again
3. Enter same phone number
4. Verify welcome back flow

#### Auto-fill Test
1. Clear browser data
2. Visit `/participe`
3. Check location-based auto-fill
4. Type name and check apelido suggestion

### 6. Permissions & Settings

#### Database Permissions
- **Registros collection**: Allow public read/write (for form submissions)
- **Bairros collection**: Allow public read (for dropdown options)

#### Site Settings
- **Developer Mode**: Enable in Wix Editor
- **CORS**: Allow external API calls (for IP geolocation)

### 7. Monitoring & Debugging

#### Wix Logs
- **Go to Developer Tools → Wix Logs**
- **Filter by "participe"** to see page-specific logs
- **Check for errors** in auto-fill or database operations

#### Common Issues
- **Geolocation fails**: Falls back to defaults, check console for errors
- **Database errors**: Check collection permissions and field names
- **Validation errors**: Verify element IDs match code expectations

### 8. Deployment Checklist

- [ ] All Velo files uploaded
- [ ] Database collection created with correct schema
- [ ] Page elements have correct IDs
- [ ] WhatsApp widget links to `/participe`
- [ ] Test on preview URL first
- [ ] Run journey agent validation
- [ ] Publish to live site
- [ ] Monitor first 10 submissions

## Auto-Fill Features Summary

| Feature | Implementation | Benefit |
|---------|----------------|---------|
| **Area Code** | IP geolocation → state → area code | Reduces typing |
| **Apelido** | First name extraction + suggestion | Personalization |
| **Bairro** | Location-based dropdown options | Better data quality |
| **Phone Lookup** | Database query on blur | Returning user flow |
| **Progressive UI** | Show required first, expand optional | Less overwhelming |
| **Real-time Validation** | Field-level error messages | Better UX |

## Performance Considerations

- **Geolocation**: Cached per session, fallback on failure
- **Database queries**: Indexed on `celular` field
- **Validation**: Client-side with server confirmation
- **Bundle size**: Modular imports, tree-shaking enabled

## Security Notes

- **Input validation**: All inputs validated client and server-side
- **Phone numbers**: Stored as digits-only for consistency
- **Personal data**: Only stored with user consent
- **API calls**: Limited to trusted geolocation service</content>
<parameter name="filePath">c:\Users\otavi\Documents\prova-ai\Updating-FlavioValle\velo-code\README.md
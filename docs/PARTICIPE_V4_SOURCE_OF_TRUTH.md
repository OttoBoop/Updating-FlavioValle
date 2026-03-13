# PARTICIPE V4.1 - Source of Truth

## Status
- Date: 2026-02-13
- Scope: Approved for implementation
- Supersedes older mixed plans that still mention bairro on frontend and optional expandable sections.

## Product Decisions (Locked)
1. Keep the current page layout and block placement; change only form behavior and fields.
2. Single form flow, with no expandable optional section.
3. No DB persistence and no external sync in this iteration.
4. Submit redirects to `https://wa.me/5521978919938` with no prefilled message.
5. `bairro` must not appear on the frontend.
6. The visual field `#mensagem` remains in Wix and is mapped internally to `observacao`.

## Field Contract
Required:
- `apelido`
- `sobrenome`
- `nome` (auto-generated from `apelido + sobrenome`)
- `celular`
- `email`
- `dataNascimento`
- `genero` (dropdown)
- `cep`
- `rua` (auto-fill, read-only)
- `cidade` (auto-fill, read-only)
- `numero` (accepts house number or `SN`)

Optional:
- `complemento`
- `observacao` (max 500)

Removed from frontend:
- `bairro`
- terms checkbox
- old optional toggle controls

## UI Mapping Contract
- `#mensagem` (Wix UI) -> `observacao` (internal payload) -> `observacao` (future gabineteonline1 destination)
- Validation error for `observacao` must render on `#mensagemError`.

## Genero Dropdown (exact options)
- `Homem`
- `Mulher`
- `Outro/Prefiro nao informar`

## CEP Resolution Rules
1. Frontend sends CEP to backend web module.
2. Backend sanitizes CEP and queries ViaCEP.
3. Backend returns:
   - `cep`
   - `rua`
   - `cidade`
   - `uf`
   - `bairro`
4. Frontend fills only `rua` and `cidade` (read-only).
5. If lookup fails or does not return both `rua` and `cidade`, submit is blocked.

## Technical Scope
### Frontend page code
- File: `velo-code/participe.js`
- Do not use `document.createElement` / `document.body`.
- Event binds must use fallback strategy (`onInput` -> `onChange` -> `onBlur`).
- Must log missing IDs without breaking execution.

### Public utilities
- File: `velo-code/public/validation-utils.js`
  - V4.1 schema with optional `observacao` (max 500).
- File: `velo-code/public/location-utils.js`
  - Formatting/normalization only.
- File: `velo-code/public/text-utils.js`
  - Name composition only.

### Backend web module
- File: `velo-code/backend/cep-resolver.web.js`
- Public API:
  - `resolveCep(cep: string): Promise<{ cep: string; rua: string; cidade: string; uf: string; bairro: string }>`

## Required Wix IDs
Fields:
- `#apelido`, `#sobrenome`, `#nome`, `#celular`, `#email`, `#dataNascimento`, `#genero`, `#cep`, `#rua`, `#cidade`, `#numero`, `#complemento`, `#mensagem`

Controls:
- `#submitButton`, `#submissionError`, `#cepLoading`

Debug (temporary required for runtime proof):
- `#debugBanner`, `#debugBannerText`

Error labels:
- `#apelidoError`, `#sobrenomeError`, `#nomeError`, `#celularError`, `#emailError`, `#dataNascimentoError`, `#generoError`, `#cepError`, `#ruaError`, `#cidadeError`, `#numeroError`, `#complementoError`, `#mensagemError`

## Acceptance Criteria
1. Page loads with no fatal page-code errors.
2. `Cannot find module 'backend/cep-resolver.web'` does not appear.
3. `TypeError: ...onInput is not a function` does not appear.
4. `document is not defined` does not appear due to this page code.
5. `nome` updates from `apelido + sobrenome`.
6. `genero` is required with exactly 3 options.
7. Valid CEP fills `rua` and `cidade`; invalid CEP blocks submit.
8. `numero` accepts numeric values and `SN`.
9. `#mensagem` is optional, accepts empty value, and enforces max 500.
10. Payload includes `observacao` with the value from `#mensagem`.
11. Valid submit still redirects to WhatsApp.
12. Debug banner appears with `V4 INJETADO` when page code executes.

## Notes
- Backend may return `bairro` for future use, but frontend must not display `bairro` in V4.1.
- UI and validation language: Portuguese (Brazil).

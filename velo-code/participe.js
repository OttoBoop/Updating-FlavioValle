// participe.js - V5: Iframe embed of Cidadão Participa
// Replaces V4 form logic with a simple iframe that loads the CP form directly.
// The user fills out and submits everything inside the CP platform.

$w.onReady(function () {
    const html1 = $w('#html1');
    if (!html1) {
        console.error('Participe V5: #html1 HtmlComponent not found on page. Add an HTML embed element with ID "html1".');
        return;
    }

    html1.src = buildIframeHtml();

    html1.onMessage((event) => {
        console.log('Participe V5 iframe message:', event.data);
    });

    console.log('Participe V5: Iframe loaded successfully.');
});

/**
 * Builds the self-contained HTML that goes inside the Wix HtmlComponent.
 * Contains an iframe pointing to cidadaoparticipa.com.br/flaviovalle/
 * with CSS cropping to hide the CP site header/branding.
 *
 * TUNING GUIDE:
 *   translateY(-200px)  → shows CP title + type buttons + form
 *   translateY(-260px)  → shows type buttons + form only
 *   translateY(-380px)  → shows form fields only (after type selected)
 *
 * Adjust .crop height if the form gets cut off at the bottom.
 */
function buildIframeHtml() {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    overflow-x: hidden;
    background: transparent;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .crop {
    width: 100%;
    height: 1400px;
    overflow: hidden;
    position: relative;
  }
  .crop iframe {
    width: 100%;
    height: 2200px;
    border: 0;
    /* Crop: shift the page UP to hide the CP header/logo.
       Adjust this value to control what's visible. */
    transform: translateY(-200px);
  }
</style>
</head>
<body>
<div class="crop">
  <iframe
    src="https://cidadaoparticipa.com.br/flaviovalle/"
    title="Formulário Cidadão Participa"
    allow="clipboard-write"
    loading="lazy">
  </iframe>
</div>
</body>
</html>`;
}


/* ====================================================================
 * V4 CODE BELOW - COMMENTED OUT (kept as reference)
 * This was the full form implementation with CEP resolution,
 * validation, DB sync, etc. Replaced by iframe embed in V5.
 * ====================================================================
 */

/*
// --- V4 IMPORTS (commented out) ---
// import wixLocation from 'wix-location';
// import { resolveCep } from 'backend/cep-resolver.web';
// import {
//     validationRules,
//     validateField,
//     validateFormData
// } from 'public/validation-utils.js';
// import {
//     formatCEP,
//     normalizePhone,
//     normalizeGenderValue
// } from 'public/location-utils.js';
// import { combineNames } from 'public/text-utils.js';
//
// const WHATSAPP_URL = 'https://wa.me/5521978919938';
// const DEBUG_VISUAL_PROOF = true;
//
// let isCepResolved = false;
// let resolvedCepData = null;
// let lastResolvedCep = '';
//
// $w.onReady(function () {
//     renderVisualProofOverlay();
//     logMissingRequiredElements();
//     configureStaticUI();
//     setupFormInteractions();
//     setupValidation();
//     updateNomeCompleto();
// });
//
// function configureStaticUI() {
//     configureGeneroDropdown();
//     setReadOnlyIfExists('#nome', true);
//     setReadOnlyIfExists('#rua', true);
//     setReadOnlyIfExists('#cidade', true);
// }
//
// function configureGeneroDropdown() {
//     const generoField = getElement('#genero');
//     if (!generoField || !generoField.options) return;
//     generoField.options = [
//         { label: 'Homem', value: 'homem' },
//         { label: 'Mulher', value: 'mulher' },
//         { label: 'Outro/Prefiro nao informar', value: 'outro_prefiro_nao_informar' }
//     ];
// }
//
// function setReadOnlyIfExists(selector, isReadOnly) {
//     const field = getElement(selector);
//     if (!field) return;
//     if ('readOnly' in field) field.readOnly = isReadOnly;
// }
//
// function setupFormInteractions() {
//     const apelidoField = getElement('#apelido');
//     bindValueEvent(apelidoField, () => updateNomeCompleto());
//     const sobrenomeField = getElement('#sobrenome');
//     bindValueEvent(sobrenomeField, () => updateNomeCompleto());
//     const celularField = getElement('#celular');
//     bindValueEvent(celularField, (event) => {
//         const value = readEventValue(event, celularField);
//         celularField.value = normalizePhone(value);
//     });
//     const cepField = getElement('#cep');
//     if (cepField) {
//         bindValueEvent(cepField, (event) => {
//             const formatted = formatCEP(readEventValue(event, cepField));
//             cepField.value = formatted;
//             resetCepResolution();
//             hideFieldError('cep');
//         });
//         if (typeof cepField.onBlur === 'function') {
//             cepField.onBlur(async (event) => {
//                 await resolveCepAndFillAddress(readEventValue(event, cepField));
//             });
//         }
//     }
//     const submitButton = getElement('#submitButton');
//     if (submitButton && typeof submitButton.onClick === 'function') {
//         submitButton.onClick(async () => { await handleFormSubmission(); });
//     }
// }
//
// function setupValidation() {
//     Object.keys(validationRules).forEach((fieldId) => {
//         const element = getElement(getFieldSelector(fieldId));
//         if (!element || typeof element.onBlur !== 'function') return;
//         element.onBlur((event) => {
//             const value = readEventValue(event, element);
//             validateFieldAndShowError(fieldId, value);
//         });
//     });
// }
//
// function updateNomeCompleto() {
//     const apelido = getValue('#apelido');
//     const sobrenome = getValue('#sobrenome');
//     const nomeCompleto = combineNames(apelido, sobrenome);
//     setValueIfExists('#nome', nomeCompleto);
// }
//
// async function resolveCepAndFillAddress(rawCep) {
//     const formattedCep = formatCEP(rawCep);
//     setValueIfExists('#cep', formattedCep);
//     if (!formattedCep) { resetCepResolution(); setValueIfExists('#rua', ''); setValueIfExists('#cidade', ''); return; }
//     showCepLoading(true);
//     try {
//         const data = await resolveCep(formattedCep);
//         setValueIfExists('#rua', data.rua || '');
//         setValueIfExists('#cidade', data.cidade || '');
//         resolvedCepData = data;
//         lastResolvedCep = data.cep;
//         isCepResolved = Boolean(data.rua && data.cidade);
//         if (!isCepResolved) throw new Error('CEP nao retornou rua e cidade.');
//         hideFieldError('cep');
//     } catch (error) {
//         resetCepResolution();
//         setValueIfExists('#rua', ''); setValueIfExists('#cidade', '');
//         showFieldError('cep', getCepErrorMessage(error));
//     } finally { showCepLoading(false); }
// }
//
// async function handleFormSubmission() {
//     hideAllErrors();
//     updateNomeCompleto();
//     const formData = collectFormData();
//     const errors = validateFormData(formData);
//     if (!isCepReadyForSubmission(formData.cep)) {
//         errors.push({ field: 'cep', message: 'Nao foi possivel validar o CEP. Confira e tente novamente.' });
//     }
//     if (errors.length > 0) { errors.forEach((error) => showFieldError(error.field, error.message)); return; }
//     const submitButton = getElement('#submitButton');
//     if (submitButton) { submitButton.disable(); submitButton.label = 'Enviando...'; }
//     try {
//         wixLocation.to(WHATSAPP_URL);
//     } catch (error) {
//         showSubmissionError(error);
//         if (submitButton) { submitButton.enable(); submitButton.label = 'Enviar'; }
//     }
// }
//
// function collectFormData() {
//     return {
//         apelido: getValue('#apelido'), sobrenome: getValue('#sobrenome'),
//         nome: getValue('#nome'), celular: normalizePhone(getValue('#celular')),
//         email: getValue('#email'), dataNascimento: getValue('#dataNascimento'),
//         genero: normalizeGenderValue(getValue('#genero')),
//         cep: formatCEP(getValue('#cep')), rua: getValue('#rua'),
//         cidade: getValue('#cidade'), numero: getValue('#numero'),
//         complemento: getValue('#complemento'), observacao: getValue('#mensagem')
//     };
// }
//
// function isCepReadyForSubmission(currentCep) {
//     const formattedCep = formatCEP(currentCep || '');
//     if (!isCepResolved || !resolvedCepData) return false;
//     if (!lastResolvedCep || formattedCep !== lastResolvedCep) return false;
//     return Boolean(resolvedCepData.rua && resolvedCepData.cidade);
// }
//
// function resetCepResolution() { isCepResolved = false; resolvedCepData = null; lastResolvedCep = ''; }
//
// function validateFieldAndShowError(fieldId, value) {
//     const rule = validationRules[fieldId];
//     if (!rule) return true;
//     const isValid = validateField(value, rule);
//     if (!isValid) { showFieldError(fieldId, rule.message); return false; }
//     hideFieldError(fieldId); return true;
// }
//
// function showFieldError(fieldId, message) {
//     const errorElement = getElement(getFieldErrorSelector(fieldId));
//     if (errorElement) { errorElement.text = message; errorElement.show(); }
//     const fieldElement = getElement(getFieldSelector(fieldId));
//     if (fieldElement && fieldElement.style) fieldElement.style.borderColor = '#d93025';
// }
//
// function hideFieldError(fieldId) {
//     const errorElement = getElement(getFieldErrorSelector(fieldId));
//     if (errorElement) errorElement.hide();
//     const fieldElement = getElement(getFieldSelector(fieldId));
//     if (fieldElement && fieldElement.style) fieldElement.style.borderColor = '';
// }
//
// function hideAllErrors() { Object.keys(validationRules).forEach((fieldId) => hideFieldError(fieldId)); }
//
// function showSubmissionError(error) {
//     const message = error && error.message ? error.message : 'Nao foi possivel enviar. Tente novamente.';
//     const submissionError = getElement('#submissionError');
//     if (!submissionError) return;
//     submissionError.text = message; submissionError.show();
// }
//
// function showCepLoading(isLoading) {
//     const loadingElement = getElement('#cepLoading');
//     if (!loadingElement) return;
//     if (isLoading) loadingElement.show(); else loadingElement.hide();
// }
//
// function getCepErrorMessage(error) {
//     if (!error || !error.message) return 'Nao foi possivel validar o CEP.';
//     return error.message;
// }
//
// function getValue(selector) {
//     const element = getElement(selector);
//     return element && element.value !== undefined ? element.value : '';
// }
//
// function setValueIfExists(selector, value) {
//     const element = getElement(selector);
//     if (element && element.value !== undefined) element.value = value;
// }
//
// function getElement(selector) {
//     try { return $w(selector); } catch (error) { return null; }
// }
//
// function renderVisualProofOverlay() {
//     if (!DEBUG_VISUAL_PROOF) return;
//     try {
//         const debugBanner = getElement('#debugBanner');
//         if (debugBanner) { if (typeof debugBanner.show === 'function') debugBanner.show(); if (debugBanner.style) { debugBanner.style.backgroundColor = '#ff0033'; debugBanner.style.borderColor = '#ffff00'; debugBanner.style.borderWidth = '8px'; } }
//         const debugBannerText = getElement('#debugBannerText');
//         if (debugBannerText) { if ('text' in debugBannerText) debugBannerText.text = 'V4 INJETADO'; if (typeof debugBannerText.show === 'function') debugBannerText.show(); if (debugBannerText.style) debugBannerText.style.color = '#ffffff'; }
//         const submitButton = getElement('#submitButton');
//         if (submitButton && 'label' in submitButton) submitButton.label = 'V4 INJETADO';
//         const submissionError = getElement('#submissionError');
//         if (submissionError && 'text' in submissionError && typeof submissionError.show === 'function') { submissionError.text = 'V4 INJETADO'; submissionError.show(); }
//         console.log('V4 visual proof executed.');
//     } catch (error) { console.error('Unable to render V4 visual proof:', error); }
// }
//
// function bindValueEvent(element, handler) {
//     if (!element || typeof handler !== 'function') return false;
//     if (typeof element.onInput === 'function') { element.onInput(handler); return true; }
//     if (typeof element.onChange === 'function') { element.onChange(handler); return true; }
//     if (typeof element.onBlur === 'function') { element.onBlur(handler); return true; }
//     return false;
// }
//
// function readEventValue(event, element) {
//     if (event && event.target && event.target.value !== undefined) return String(event.target.value || '');
//     if (element && element.value !== undefined) return String(element.value || '');
//     return '';
// }
//
// function getFieldSelector(fieldId) { if (fieldId === 'observacao') return '#mensagem'; return `#${fieldId}`; }
// function getFieldErrorSelector(fieldId) { if (fieldId === 'observacao') return '#mensagemError'; return `#${fieldId}Error`; }
//
// function logMissingRequiredElements() {
//     const missing = [];
//     Object.keys(validationRules).forEach((fieldId) => {
//         const fieldSelector = getFieldSelector(fieldId);
//         const errorSelector = getFieldErrorSelector(fieldId);
//         if (!getElement(fieldSelector)) missing.push(fieldSelector);
//         if (!getElement(errorSelector)) missing.push(errorSelector);
//     });
//     ['#submitButton', '#submissionError', '#cepLoading', '#debugBanner', '#debugBannerText'].forEach((selector) => {
//         if (!getElement(selector)) missing.push(selector);
//     });
//     if (missing.length > 0) { console.warn('Participe V4.1 - IDs ausentes:', missing.join(', ')); return; }
//     console.log('Participe V4.1 - IDs obrigatorios encontrados.');
// }
*/

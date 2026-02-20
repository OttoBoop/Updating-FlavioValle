/**
 * @jest-environment node
 *
 * Integration tests: Participe.c6vvk.js → participatedb.web.js wiring
 *
 * Verifies:
 *   1. saveRegistration (from participatedb.web) is called on form submission,
 *      NOT wixData.insert directly.
 *   2. lookupUserByPhone is called on celular onBlur.
 *   3. A welcome message appears when lookupUserByPhone returns a record.
 *
 * All Wix-specific modules are resolved via moduleNameMapper to __mocks__/ stubs.
 * The $w global is set up at module evaluation time (before the page is loaded via
 * dynamic import in beforeAll), so the page's $w.onReady() call is captured.
 */

import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals';

// Import mock handles BEFORE the page loads (static ESM imports are hoisted)
import { mockSaveRegistration, mockLookupUserByPhone } from 'backend/participatedb.web';
import { mockTo } from 'wix-location';
import { mockInsert, mockFind, mockEq, mockQuery } from 'wix-data';
import { mockResolveCep } from 'backend/cep-resolver.web';

// ── $w global mock ─────────────────────────────────────────────────────────────
// Must be assigned at module evaluation time so it exists when the page loads
// via dynamic import() inside beforeAll.

const elements = {};

const makeElement = () => ({
    value: '',
    text: '',
    label: '',
    _visible: true,
    _disabled: false,
    readOnly: false,
    style: { borderColor: '' },
    options: [],
    // Accumulating handler lists — Wix allows multiple onBlur/onInput bindings.
    // The page calls cepField.onBlur() in setupFormInteractions (resolver)
    // and again in setupValidation (validator). Both must fire.
    _blurHandlers: [],
    _inputHandlers: [],
    _changeHandlers: [],
    _clickHandlers: [],
    onBlur: function (fn) {
        this._blurHandlers.push(fn);
        this._blur = async (event) => {
            for (const h of this._blurHandlers) { await h(event); }
        };
    },
    onInput: function (fn) {
        this._inputHandlers.push(fn);
        this._input = async (event) => {
            for (const h of this._inputHandlers) { await h(event); }
        };
    },
    onChange: function (fn) {
        this._changeHandlers.push(fn);
        this._change = async (event) => {
            for (const h of this._changeHandlers) { await h(event); }
        };
    },
    onClick: function (fn) {
        this._clickHandlers.push(fn);
        this._click = async (event) => {
            for (const h of this._clickHandlers) { await h(event); }
        };
    },
    show: function () { this._visible = true; },
    hide: function () { this._visible = false; },
    enable: function () { this._disabled = false; },
    disable: function () { this._disabled = true; },
});

global.$w = (selector) => {
    if (!elements[selector]) elements[selector] = makeElement();
    return elements[selector];
};
global.$w.onReady = (fn) => { global.$w._onReadyFn = fn; };
global.$w._onReadyFn = null;

// ── Load page and wire handlers once ──────────────────────────────────────────
beforeAll(async () => {
    // Dynamic import executes the page module, which calls $w.onReady(callback).
    // The callback registers all event handlers onto the mock elements.
    await import('../../../flavio-valle/src/pages/Participe.c6vvk.js');
    if (global.$w._onReadyFn) {
        await global.$w._onReadyFn();
    }
});

// ── Reset per test ─────────────────────────────────────────────────────────────
beforeEach(async () => {
    // 1. Reset all mocks with sensible defaults
    mockSaveRegistration.mockReset().mockResolvedValue({ _id: 'new-id' });
    mockLookupUserByPhone.mockReset().mockResolvedValue(null);
    mockInsert.mockReset();
    mockFind.mockReset().mockResolvedValue({ items: [] });
    mockEq.mockReset().mockReturnValue({ find: mockFind });
    mockQuery.mockReset().mockReturnValue({ eq: mockEq });
    mockTo.mockReset();
    mockResolveCep.mockReset().mockResolvedValue({
        rua: 'Rua Voluntários da Pátria',
        cidade: 'Rio de Janeiro',
        cep: '22222-222',
    });

    // 2. Set all form element values to a valid submission
    elements['#apelido'].value = 'João';
    elements['#sobrenome'].value = 'Silva';
    elements['#nome'].value = '';          // filled by updateNomeCompleto() on submit
    elements['#celular'].value = '(21) 99999-9999';
    elements['#email'].value = 'joao@example.com';
    elements['#dataNascimento'].value = '1990-01-15';
    elements['#genero'].value = 'homem';
    elements['#cep'].value = '22222-222';
    elements['#rua'].value = '';
    elements['#cidade'].value = '';
    elements['#numero'].value = '100';
    elements['#complemento'].value = '';
    elements['#mensagem'].value = '';

    // 3. Clear any text/visibility state left by previous test
    Object.values(elements).forEach((el) => {
        el.text = '';
        el._visible = true;
    });

    // 4. Trigger CEP blur to set isCepResolved = true (module-level state in page)
    //    This also fills #rua and #cidade via setValueIfExists.
    if (elements['#cep'] && elements['#cep']._blur) {
        await elements['#cep']._blur({ target: { value: '22222-222' } });
    }
});

// ── Form submission wiring ────────────────────────────────────────────────────

describe('Form submission wiring', () => {
    it('should call saveRegistration from participatedb.web when form is submitted', async () => {
        if (elements['#submitButton'] && elements['#submitButton']._click) {
            await elements['#submitButton']._click();
        }

        expect(mockSaveRegistration).toHaveBeenCalledTimes(1);
    });

    it('should NOT call wixData.insert directly on form submission', async () => {
        if (elements['#submitButton'] && elements['#submitButton']._click) {
            await elements['#submitButton']._click();
        }

        expect(mockInsert).not.toHaveBeenCalled();
    });

    it('should call saveRegistration with the collected form data', async () => {
        if (elements['#submitButton'] && elements['#submitButton']._click) {
            await elements['#submitButton']._click();
        }

        expect(mockSaveRegistration).toHaveBeenCalledWith(
            expect.objectContaining({
                apelido: 'João',
                email: 'joao@example.com',
            })
        );
    });
});

// ── Returning user detection wiring ──────────────────────────────────────────

describe('Returning user detection wiring', () => {
    it('should call lookupUserByPhone on celular onBlur', async () => {
        elements['#celular'].value = '21999999999';

        if (elements['#celular'] && elements['#celular']._blur) {
            await elements['#celular']._blur({ target: { value: '21999999999' } });
        }

        expect(mockLookupUserByPhone).toHaveBeenCalledTimes(1);
    });

    it('should show a welcome message containing apelido when lookupUserByPhone returns a record', async () => {
        mockLookupUserByPhone.mockResolvedValue({ _id: 'u1', apelido: 'Maria', celular: '(21) 99999-9999' });
        elements['#celular'].value = '21999999999';

        if (elements['#celular'] && elements['#celular']._blur) {
            await elements['#celular']._blur({ target: { value: '21999999999' } });
        }

        const welcomeShown = Object.values(elements).some(
            (el) => typeof el.text === 'string' && el.text.includes('Bem-vindo de volta')
        );
        expect(welcomeShown).toBe(true);
    });
});

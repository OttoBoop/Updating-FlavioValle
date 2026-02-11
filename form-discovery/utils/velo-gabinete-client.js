// Wix Velo backend module (.jsw) for gabineteonline integration
// Uses wix-fetch for HTTP requests
// Implements xajax protocol for form submission

// Constants
const GABINETE_BASE_URL = 'https://www.gabineteonline1.com.br/flaviovalle';
const GABINETE_LOGIN_URL = `${GABINETE_BASE_URL}/`;
const GABINETE_SUBMIT_URL = `${GABINETE_BASE_URL}/cadastroclientes_dados.php`;
const XAJAX_FUNCTION_NAME = 'CadastrarClienteDados';
const CONTENT_TYPE_FORM = 'application/x-www-form-urlencoded';

/**
 * Extract cookies from HTTP response headers
 * @param {Object} headers - Response headers object
 * @returns {string[]} Array of cookie strings
 */
function extractCookies(headers) {
  const cookies = [];
  if (headers['set-cookie']) {
    const setCookie = headers['set-cookie'];
    if (Array.isArray(setCookie)) {
      cookies.push(...setCookie);
    } else if (typeof setCookie === 'string') {
      cookies.push(setCookie);
    }
  }
  return cookies;
}

/**
 * Build xajax protocol request body
 * @param {Object} formData - Form data object
 * @returns {string} URL-encoded xajax request body
 */
function buildXajaxBody(formData) {
  const timestamp = Date.now();
  const jsonFormData = JSON.stringify(formData);
  const encodedFormData = encodeURIComponent(jsonFormData);
  return `xajax=${XAJAX_FUNCTION_NAME}&xajaxr=${timestamp}&xajaxargs[]=${encodedFormData}`;
}

/**
 * Login to gabineteonline and get session cookies
 * @param {string} username - Username
 * @param {string} password - Password
 * @param {Object} wixFetch - wix-fetch instance (injected for testing)
 * @returns {Promise<{success: boolean, cookies: string[]}>}
 */
export async function login(username, password, wixFetch) {
  const formData = new URLSearchParams();
  formData.append('txtusuario', username);
  formData.append('txtsenha', password);

  const response = await wixFetch.fetch(GABINETE_LOGIN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': CONTENT_TYPE_FORM
    },
    body: formData.toString()
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  const cookies = extractCookies(response.headers);

  return { success: true, cookies };
}

/**
 * Submit registration form to gabineteonline using xajax protocol
 * @param {string[]} cookies - Session cookies from login
 * @param {Object} formData - Form data (already mapped to gabineteonline fields)
 * @param {Object} wixFetch - wix-fetch instance (injected for testing)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function submitRegistration(cookies, formData, wixFetch) {
  try {
    const body = buildXajaxBody(formData);

    const response = await wixFetch.fetch(GABINETE_SUBMIT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': CONTENT_TYPE_FORM,
        'Cookie': cookies.join('; ')
      },
      body: body
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

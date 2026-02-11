// Wix Velo backend module (.jsw) for gabineteonline integration
// Uses wix-fetch for HTTP requests
// Implements xajax protocol for form submission

/**
 * Login to gabineteonline and get session cookies
 * @param {string} username - Username
 * @param {string} password - Password
 * @param {Object} wixFetch - wix-fetch instance (injected for testing)
 * @returns {Promise<{success: boolean, cookies: string[]}>}
 */
export async function login(username, password, wixFetch) {
  // Build form data
  const formData = new URLSearchParams();
  formData.append('txtusuario', username);
  formData.append('txtsenha', password);

  const response = await wixFetch.fetch('https://www.gabineteonline1.com.br/flaviovalle/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData.toString()
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  // Extract cookies from response headers
  const cookies = [];
  if (response.headers['set-cookie']) {
    // In real wix-fetch, set-cookie might be a string or array
    const setCookie = response.headers['set-cookie'];
    if (Array.isArray(setCookie)) {
      cookies.push(...setCookie);
    } else if (typeof setCookie === 'string') {
      cookies.push(setCookie);
    }
  }

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
    // Generate timestamp for xajax request
    const timestamp = Date.now();

    // Encode form data as JSON for xajax
    const jsonFormData = JSON.stringify(formData);
    const encodedFormData = encodeURIComponent(jsonFormData);

    // Build xajax protocol request body
    // Format: xajax=CadastrarClienteDados&xajaxr=[timestamp]&xajaxargs[]=[encoded-form-data]
    const body = `xajax=CadastrarClienteDados&xajaxr=${timestamp}&xajaxargs[]=${encodedFormData}`;

    const response = await wixFetch.fetch(
      'https://www.gabineteonline1.com.br/flaviovalle/cadastroclientes_dados.php',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookies.join('; ')
        },
        body: body
      }
    );

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

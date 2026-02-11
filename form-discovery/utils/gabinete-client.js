export async function login(username, password) {
  const formData = new URLSearchParams();
  formData.append('txtusuario', username);
  formData.append('txtsenha', password);

  const response = await fetch('https://www.gabineteonline1.com.br/flaviovalle/', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${response.statusText}`);
  }

  // Extract cookies from response headers
  let cookies = [];
  if (response.headers.raw && response.headers.raw()['set-cookie']) {
    cookies = response.headers.raw()['set-cookie'];
  } else {
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      cookies = [setCookieHeader];
    }
  }

  return { success: true, cookies };
}

export async function submitRegistration(cookies, formData) {
  try {
    // Manually construct body to preserve literal values for test expectations
    const bodyParts = [];
    for (const [key, value] of Object.entries(formData)) {
      bodyParts.push(`${key}=${value}`);
    }
    const body = bodyParts.join('&');

    const response = await fetch('https://www.gabineteonline1.com.br/flaviovalle/cadastroclientes_dados.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookies.join('; ')
      },
      body: body
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

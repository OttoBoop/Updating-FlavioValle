#!/bin/bash

# Create browser-setup.js
cat > form-discovery/utils/browser-setup.js << 'EOF'
/**
 * Browser setup and login functionality
 */
import { chromium } from 'playwright';
import chalk from 'chalk';

export async function loginToGabinete(credentials, options = {}) {
  const {
    headless = false,
    timeout = 30000,
    baseUrl = 'https://www.gabineteonline1.com.br/flaviovalle/'
  } = options;

  let browser, page;

  try {
    console.log(chalk.blue('🚀 Launching browser...'));
    browser = await chromium.launch({ 
      headless,
      timeout 
    });
    
    const context = await browser.newContext();
    page = await context.newPage();

    console.log(chalk.blue(\`🌐 Navigating to \${baseUrl}\`));
    await page.goto(baseUrl, { timeout, waitUntil: 'networkidle' });

    // Wait for login form to be visible
    console.log(chalk.blue('🔍 Looking for login form...'));
    
    // Try common login field selectors
    const emailSelector = await page.locator('input[type="email"], input[name="email"], input[name="usuario"], input[id="email"], input[id="usuario"]').first();
    const passwordSelector = await page.locator('input[type="password"], input[name="password"], input[name="senha"], input[id="password"], input[id="senha"]').first();
    
    if (!await emailSelector.count()) {
      throw new Error('Could not find email/username input field');
    }
    
    if (!await passwordSelector.count()) {
      throw new Error('Could not find password input field');
    }

    console.log(chalk.blue('✍️  Filling login credentials...'));
    await emailSelector.fill(credentials.email);
    await passwordSelector.fill(credentials.password);

    // Find and click submit button
    const submitButton = await page.locator('button[type="submit"], input[type="submit"], button:has-text("Entrar"), button:has-text("Login")').first();
    
    if (!await submitButton.count()) {
      throw new Error('Could not find login submit button');
    }

    console.log(chalk.blue('🔐 Submitting login...'));
    await submitButton.click();

    // Wait for navigation or error message
    try {
      await page.waitForNavigation({ timeout: 10000, waitUntil: 'networkidle' });
    } catch (e) {
      // Check if still on login page (login failed)
      const currentUrl = page.url();
      if (currentUrl.includes('login') || await page.locator('input[type="password"]').count() > 0) {
        throw new Error('Login failed - still on login page');
      }
    }

    // Check for error messages
    const errorMessages = await page.locator('.error, .alert-danger, .alert-error, [class*="error"]').allTextContents();
    if (errorMessages.length > 0 && errorMessages.some(msg => msg.trim())) {
      throw new Error(\`Login error: \${errorMessages.join(', ')}\`);
    }

    // Get cookies for session management
    const cookies = await context.cookies();

    console.log(chalk.green('✅ Login successful!'));

    return {
      success: true,
      browser,
      page,
      cookies,
      url: page.url()
    };

  } catch (error) {
    console.error(chalk.red(\`❌ Login failed: \${error.message}\`));
    
    // Close browser on failure
    if (browser) {
      await browser.close();
    }

    return {
      success: false,
      error: error.message,
      browser: null,
      page: null
    };
  }
}
EOF

# Create form-inspector.js
cat > form-discovery/utils/form-inspector.js << 'EOF'
/**
 * Form field extraction and schema generation
 */
import chalk from 'chalk';

export async function extractFormFields(page) {
  console.log(chalk.blue('🔍 Extracting form fields from page...'));

  const fields = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
    
    return inputs
      .filter(input => {
        // Filter out hidden inputs, CSRF tokens, etc.
        const name = input.name || input.id || '';
        const type = input.type || '';
        
        if (type === 'hidden') return false;
        if (name.match(/csrf|token|_token/i)) return false;
        if (!name) return false;
        
        return true;
      })
      .map(input => {
        // Get label text
        let label = '';
        if (input.labels && input.labels.length > 0) {
          label = input.labels[0].textContent.trim();
        } else {
          const prevElement = input.previousElementSibling;
          if (prevElement && prevElement.tagName === 'LABEL') {
            label = prevElement.textContent.trim();
          }
        }
        
        // Get options for select elements
        let options = null;
        if (input.tagName === 'SELECT') {
          options = Array.from(input.options).map(opt => ({
            value: opt.value,
            text: opt.textContent.trim()
          }));
        }

        return {
          name: input.name || input.id,
          type: input.type || input.tagName.toLowerCase(),
          label: label || input.placeholder || input.name,
          required: input.required,
          placeholder: input.placeholder || '',
          maxLength: input.maxLength > 0 ? input.maxLength : null,
          pattern: input.pattern || null,
          options: options
        };
      });
  });

  console.log(chalk.green(\`✅ Extracted \${fields.length} form fields\`));
  
  return fields;
}

export function generateSchema(fields, autoFillable = []) {
  console.log(chalk.blue('📝 Generating schema...'));

  const schema = {
    fields: fields,
    autoFillable: autoFillable,
    discoveredAt: new Date().toISOString(),
    metadata: {
      totalFields: fields.length,
      requiredFields: fields.filter(f => f.required).length,
      optionalFields: fields.filter(f => !f.required).length
    }
  };

  console.log(chalk.green('✅ Schema generated successfully'));

  return schema;
}
EOF

echo "✅ Utility files created successfully!"

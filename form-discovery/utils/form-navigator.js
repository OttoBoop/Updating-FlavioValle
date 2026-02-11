export async function findRegistrationForm(page) {
  const keywords = [
    'Cadastro',
    'Cadastrar',
    'Novo cliente',
    'Novo usuário',
    'Adicionar',
    '+'
  ];

  for (const keyword of keywords) {
    const links = await page.locator(`a:has-text("${keyword}"), button:has-text("${keyword}")`).all();

    if (links.length > 0) {
      console.log(`Found ${links.length} link(s) with keyword "${keyword}"`);
      await links[0].click();
      await page.waitForLoadState('domcontentloaded');

      // Check if form exists
      const formCount = await page.locator('form').count();
      if (formCount > 0) {
        return { success: true, keyword, url: page.url() };
      }
    }
  }

  // Fallback: explore all navigation links
  console.log('Keywords not found - logging all links...');
  try {
    const navLocator = page.locator('nav a, .menu a, .navigation a');
    const navLinks = await navLocator.all();
    const allLinks = [];
    for (const link of navLinks) {
      const text = await link.textContent();
      if (text) allLinks.push(text.trim());
    }
    console.log('Available links:', allLinks);
    return { success: false, availableLinks: allLinks };
  } catch (error) {
    console.log('Could not extract navigation links:', error.message);
    return { success: false, availableLinks: [] };
  }
}

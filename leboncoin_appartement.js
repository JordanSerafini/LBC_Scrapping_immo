const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  let currentPage = 1;
  const maxPages = 25;
  let apartments = [];

  while (currentPage <= maxPages) {
    await page.goto(`https://www.leboncoin.fr/recherche?category=9&locations=Annecy_74000&page=${currentPage}`, { waitUntil: 'networkidle2' });

    // Gestion de la fenêtre de consentement aux cookies
    try {
      await page.waitForSelector('button[id="didomi-notice-agree-button"]', { timeout: 5000 });
      await page.click('button[id="didomi-notice-agree-button"]');
      console.log("Bouton 'Accepter & Fermer' cliqué.");
    } catch (e) {
      console.log('Pas de fenêtre de consentement à gérer.');
    }

    // Pause manuelle pour permettre le chargement de la page
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Vérification de la présence du CAPTCHA
    const isCaptcha = await page.evaluate(() => {
      return document.querySelector('.no-js .captcha-container') !== null;
    });

    if (isCaptcha) {
      console.log("CAPTCHA détecté, veuillez le résoudre manuellement.");
      await page.waitForNavigation();
    }

    try {
      // Attendre que les annonces soient chargées
      await page.waitForSelector('a[data-test-id="ad"]', { timeout: 60000 });

      const newApartments = await page.evaluate(() => {
        const items = document.querySelectorAll('a[data-test-id="ad"]');
        const results = [];
        items.forEach(item => {
          const title = item.querySelector('span[data-qa-id="aditem_title"]')?.innerText || 'Titre non disponible';
          const price = item.querySelector('span[data-qa-id="aditem_price"]')?.innerText || 'Prix non disponible';
          const location = item.querySelector('p[data-qa-id="aditem_location"]')?.innerText || 'Localisation non disponible';
          const url = item.href || 'URL non disponible';

          results.push({
            title,
            price,
            location,
            url,
          });
        });
        return results;
      });

      apartments = apartments.concat(newApartments);
      currentPage++;
    } catch (error) {
      console.error(`Erreur lors de la récupération des annonces à la page ${currentPage}: ${error.message}`);
      break;
    }
  }

  console.log(apartments);
  await browser.close();
})();

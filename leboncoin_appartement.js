import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import randomUseragent from 'random-useragent';

puppeteer.use(StealthPlugin());

// Fonction pour créer un délai personnalisé avec un délai aléatoire
function delay(min, max) {
  return new Promise(function(resolve) { 
    const time = Math.floor(Math.random() * (max - min + 1)) + min;
    setTimeout(resolve, time);
  });
}

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars'
    ]
  });
  const page = await browser.newPage();
  
  // Configure User-Agent et viewport
  const userAgent = randomUseragent.getRandom();
  await page.setUserAgent(userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  await page.setViewport({ width: 1366, height: 768 });

  let currentPage = 1;
  const maxPages = 2;
  let apartments = [];

  while (currentPage <= maxPages) {
    try {
      await page.goto(`https://www.leboncoin.fr/recherche?category=9&locations=Annecy_74000&page=${currentPage}`, { waitUntil: 'domcontentloaded' });

      // Vérification de la présence du CAPTCHA
      let isCaptcha = await page.evaluate(() => {
        return document.querySelector('.no-js .captcha-container') !== null;
      });

      if (isCaptcha) {
        console.log("CAPTCHA détecté, veuillez le résoudre manuellement.");
        // Attendre que l'utilisateur résolve le CAPTCHA
        await page.waitForFunction(() => {
          return document.querySelector('.no-js .captcha-container') === null;
        }, { timeout: 0 });
        console.log("CAPTCHA résolu.");
      }

      // Gestion de la fenêtre de consentement aux cookies après le CAPTCHA
      try {
        await page.waitForSelector('button[id="didomi-notice-agree-button"]', { timeout: 10000 });
        await page.click('button[id="didomi-notice-agree-button"]');
        console.log("Bouton 'Accepter & Fermer' cliqué.");
      } catch (e) {
        console.log('Pas de fenêtre de consentement à gérer.');
      }

      // Attendre que les annonces soient chargées
      await page.waitForSelector('a[data-test-id="ad"]', { timeout: 60000 });

      const links = await page.evaluate(() => {
        const items = document.querySelectorAll('a[data-test-id="ad"]');
        return Array.from(items).map(item => item.href);
      });

      for (let link of links) {
        await page.goto(link, { waitUntil: 'domcontentloaded' });

        // Pause pour simuler une lecture humaine
        await delay(2000, 5000);  // Pause aléatoire entre 2 et 5 secondes

        const apartmentDetails = await page.evaluate(() => {
          const title = document.querySelector('h1[data-qa-id="adview_title"]')?.innerText || 'Titre non disponible';
          const price = document.querySelector('span[data-qa-id="adview_price"]')?.innerText || 'Prix non disponible';
          const description = document.querySelector('div[data-qa-id="adview_description_container"] p')?.innerText || 'Description non disponible';
          const surface = Array.from(document.querySelectorAll('div[data-qa-id="criteria_item"]')).find(el => el.innerText.includes('m²'))?.innerText || 'Surface non disponible';

          return {
            title,
            price,
            description,
            surface,
            link: window.location.href
          };
        });

        apartments.push(apartmentDetails);

        // Pause entre chaque annonce
        await delay(3000, 6000);  // Pause aléatoire entre 3 et 6 secondes
      }

      currentPage++;
    } catch (error) {
      console.error(`Erreur lors de la récupération des annonces à la page ${currentPage}: ${error.message}`);
      break;
    }
  }

  console.log(apartments);
  await browser.close();
})();

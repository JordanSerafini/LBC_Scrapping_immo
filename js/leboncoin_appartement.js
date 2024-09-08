import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import randomUseragent from 'random-useragent';

puppeteer.use(StealthPlugin());

function delay(min, max) {
  return new Promise(resolve => {
    const time = Math.floor(Math.random() * (max - min + 1)) + min;
    setTimeout(resolve, time);
  });
}

function moveMouseRandomly(page, width = 1280, height = 800) {
  const x = Math.floor(Math.random() * width);
  const y = Math.floor(Math.random() * height);
  return page.mouse.move(x, y);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--lang=fr-FR,fr',
      '--window-size=1280,800'
    ]
  });
  const page = await browser.newPage();

  const userAgent = randomUseragent.getRandom();
  await page.setUserAgent(userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.4472.124 Safari/537.36');
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });

  await page.setExtraHTTPHeaders({
    'User-Agent': userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.4472.124 Safari/537.36',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': 'https://www.leboncoin.fr/',
    'Upgrade-Insecure-Requests': '1',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
  });

  await page.mouse.move(Math.random() * 100, Math.random() * 100);

  let currentPage = 1;
  const maxPages = 2;
  let apartments = [];

  while (currentPage <= maxPages) {
    try {
      await page.goto(`https://www.leboncoin.fr/recherche?category=9&locations=Annecy_74000&page=${currentPage}`, { waitUntil: 'domcontentloaded' });

      // Déplacer la souris au hasard avant d'interagir avec la page
      await moveMouseRandomly(page);
      await delay(3000, 5000);  // Ajout d'un délai aléatoire

      let isCaptcha = await page.evaluate(() => {
        return document.querySelector('.no-js .captcha-container') !== null;
      });

      if (isCaptcha) {
        console.log("CAPTCHA détecté, veuillez le résoudre manuellement.");
        await page.waitForFunction(() => {
          return document.querySelector('.no-js .captcha-container') === null;
        }, { timeout: 0 });
        console.log("CAPTCHA résolu.");
      }

      try {
        await page.waitForSelector('button[id="didomi-notice-agree-button"]', { timeout: 10000 });
        await page.click('button[id="didomi-notice-agree-button"]');
        console.log("Bouton 'Accepter & Fermer' cliqué.");
      } catch (e) {
        console.log('Pas de fenêtre de consentement à gérer.');
      }

      await page.waitForSelector('a[data-test-id="ad"]', { timeout: 60000 });

      const links = await page.evaluate(() => {
        const items = document.querySelectorAll('a[data-test-id="ad"]');
        return Array.from(items).map(item => item.href);
      });

      for (let link of links) {
        await page.goto(link, { waitUntil: 'domcontentloaded' });
        await moveMouseRandomly(page);  // Déplacer la souris au hasard sur la page de l'annonce
        await delay(4000, 8000); // Plus long délai pour imiter une navigation humaine.

        const apartmentDetails = await page.evaluate(() => {
          const title = document.querySelector('h1[data-qa-id="adview_title"]')?.innerText || 'Titre non disponible';
          const price = document.querySelector('p.text-headline-2')?.innerText || 'Prix non disponible';
          const description = document.querySelector('div[data-qa-id="adview_description_container"] p')?.innerText || 'Description non disponible';
          const surface = document.querySelector('span.text-body-1')?.innerText || 'Surface non disponible';

          return {
            title,
            price,
            description,
            surface,
            link: window.location.href
          };
        });

        apartments.push(apartmentDetails);
        await delay(5000, 10000); // Augmenter la pause entre les pages pour éviter les détections.
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
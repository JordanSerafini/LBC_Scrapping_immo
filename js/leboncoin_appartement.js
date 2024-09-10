import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import randomUseragent from 'random-useragent';

// Utilisation du plugin Stealth pour masquer les caractéristiques d'un bot
puppeteer.use(StealthPlugin());

// Fonction pour ajouter des délais aléatoires
function delay(min, max) {
  return new Promise(resolve => {
    const time = Math.floor(Math.random() * (max - min + 1)) + min;
    setTimeout(resolve, time);
  });
}

// Fonction pour déplacer la souris de manière aléatoire (simulation de mouvement humain)
function moveMouseRandomly(page, width = 1280, height = 800) {
  const x = Math.floor(Math.random() * width);
  const y = Math.floor(Math.random() * height);
  return page.mouse.move(x, y);
}

// Fonction pour faire défiler la page de manière aléatoire
async function scrollPage(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let totalHeight = 0;
      const distance = Math.floor(Math.random() * 200) + 100;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, Math.random() * 500 + 500); // Délai aléatoire entre les défilements
    });
  });
}

 // Ajouter les cookies récupérés
 const cookies = [
  {
    "name": "datadome",
    "value": "VeyqfEo80payX1d0pIRLVjedRjLL6LQMYA8VOpiahUbPImFl3Ws5e~qFJ85zRDTc4ce686Q8OjrxLjnWzW~JDFqh7IUbbs537PR3Id5fBsI4GaOqno8OTHXfjrBEh5p1",
    "domain": ".leboncoin.fr",
    "path": "/",
    "expires": 1694362234,
    "httpOnly": true,
    "secure": true,
    "sameSite": "Lax"
  },
  {
    "name": "dblockS",
    "value": "11",
    "domain": "www.leboncoin.fr",
    "path": "/",
    "expires": -1,
    "httpOnly": false,
    "secure": false
  },
  {
    "name": "utag_main",
    "value": "v_id:0191d277f2c8000292f1fdba5dfb0506f003a06700bd6$_sn:3$_ss:0$_st:1725982834408$_pn:4%3Bexp-session$ses_id:1725980852687%3Bexp-session",
    "domain": ".leboncoin.fr",
    "path": "/",
    "expires": 1725982834,
    "httpOnly": false,
    "secure": true
  },
  {
    "name": "didomi_token",
    "value": "eyJ1c2VyX2lkIjoiMTkxZDI3N2UtYzc4Yi02OWUxLTljN2QtYmNmYmVjNGYyZjdkIiwiY3JlYXRlZCI6IjIwMjQtMDktMDhUMTY6Mjk6MjAuMzc2WiIsInVwZGF0ZWQiOiIyMDI0LTA5LTA4VDE2OjI5OjIyLjYyNFoiLCJ2ZW5kb3JzIjp7ImVuYWJsZWQiOlsiZ29vZ2xlIiwiYzpsYmNmcmFuY2UiLCJjOnJldmxpZnRlci1jUnBNbnA1eCIsImM6cHVycG9zZWxhLTN3NFpmS0tEIiwiYzppbmZlY3Rpb3VzLW1lZGlhIiwiYzp0dXJibyIsImM6YWRpbW8tUGhVVm02RkUiLCJjOmdvb2dsZWFuYS00VFhuSmlnUiIsImM6dW5kZXJ0b25lLVRManFkVHBmIiwiYzptNnB1YmxpY2ktdFhUWUROQWMiLCJjOnJvY2tlcmJveC1mVE04RUo5UCIsImM6YWZmaWxpbmV0IiwiYzpzcG9uZ2VjZWxsLW55eWJBS0gyIiwiYzp0YWlsdGFyZ2UtbkdXVW5heTciLCJjOnRpa3Rvay1yS0FZRGdiSCIsImM6emFub3gtYVlZejZ6VzQiLCJjOnBpbnRlcmVzdCIsImM6aWduaXRpb25vLUxWQU1aZG5qIiwiYzpkaWRvbWkiLCJjOmxiY2ZyYW5jZS1IeTNrWU05RiJdfSwicHVycG9zZXMiOnsiZW5hYmxlZCI6WyJleHBlcmllbmNldXRpbGlzYXRldXIiLCJtZXN1cmVhdWRpZW5jZSIsInBlcnNvbm5hbGlzYXRpb25tYXJrZXRpbmciLCJwcml4IiwiZGV2aWNlX2NoYXJhY3RlcmlzdGljcyIsImNvbXBhcmFpc29tYXJrZXQ2NDciXX0sInZlbmRvcnNfbGkiOnsiZW5hYmxlZCI6WyJnb29nbGUiLCJjOnB1cnBvc2VsYS0zdzRaZktLRCIsImM6dHVyYm8iXX0sInZ…",
    "domain": ".leboncoin.fr",
    "path": "/",
    "expires": 1733933764,
    "httpOnly": false,
    "secure": true
  }
];

(async () => {


  // Configuration du navigateur avec un proxy et Stealth
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--window-size=1280,800'
    ]
  });

  
  const page = await browser.newPage();

  // Rotation aléatoire des user-agents
  const userAgent = randomUseragent.getRandom();
  await page.setUserAgent(userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.4472.124 Safari/537.36');
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });

  await page.setRequestInterception(true);
  page.on('request', (request) => {
    // Bloquer certains scripts ou requêtes indésirables
    if (request.url().includes('iovation-first-third.js')) {
      request.abort();  // Bloquer le script de détection
    } else {
      request.continue();
    }
  });

  // Ajouter la gestion des cookies
  const client = await page.target().createCDPSession();
  await client.send('Network.clearBrowserCookies'); // Supprimer les cookies avant de commencer
  
  await page.setExtraHTTPHeaders({
    'User-Agent': userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.4472.124 Safari/537.36',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': 'https://www.leboncoin.fr/',
    'Upgrade-Insecure-Requests': '1',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
  });

  // Mouvement initial de la souris pour simuler un comportement humain
  await moveMouseRandomly(page);

  let currentPage = 1;
  const maxPages = 2;
  let apartments = [];

  while (currentPage <= maxPages) {
    try {
      await page.goto(`https://www.leboncoin.fr/recherche?category=9&locations=Annecy_74000&page=${currentPage}`, { waitUntil: 'networkidle0' });
      await page.setCookie(...cookies);

      // Déplacer la souris de manière aléatoire avant d'interagir
      await moveMouseRandomly(page);
      await delay(5000, 10000);  // Pause plus longue pour simuler un comportement humain

      // Simuler un défilement de page
      await scrollPage(page);
      await delay(4000, 8000);  // Pause aléatoire après le défilement

      // Vérifier et gérer le CAPTCHA manuellement
      let isCaptcha = await page.evaluate(() => {
        return document.querySelector('.no-js .captcha-container') !== null;
      });

      if (isCaptcha) {
        console.log("CAPTCHA détecté, veuillez le résoudre manuellement.");
        await page.waitForFunction(() => {
          return document.querySelector('.no-js .captcha-container') === null;
        }, { timeout: 0 });
        console.log("CAPTCHA résolu.");
        await delay(3000, 5000);  // Pause supplémentaire après le CAPTCHA
      }

      try {
        await page.waitForSelector('button[id="didomi-notice-agree-button"]', { timeout: 10000 });
        await page.click('button[id="didomi-notice-agree-button"]');
        console.log("Bouton 'Accepter & Fermer' cliqué.");
      } catch (e) {
        console.log('Pas de fenêtre de consentement.');
      }

      await page.waitForSelector('a[data-test-id="ad"]', { timeout: 60000 });

      const links = await page.evaluate(() => {
        const items = document.querySelectorAll('a[data-test-id="ad"]');
        return Array.from(items).map(item => item.href);
      });

      for (let link of links) {
        const newPage = await browser.newPage();  // Ouvrir un nouvel onglet pour chaque annonce
        try {
          await newPage.goto(link, { waitUntil: 'networkidle0' });
          await moveMouseRandomly(newPage);
          await delay(3000, 6000);  // Pause pour simuler la lecture de la page

          const apartmentDetails = await newPage.evaluate(() => {
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
          await delay(5000, 10000);  // Pause plus longue pour simuler une navigation lente
        } catch (error) {
          console.error(`Erreur lors de la navigation vers l'annonce ${link}: ${error.message}`);
        } finally {
          await newPage.close();  // Fermer l'onglet après avoir récupéré les détails
        }
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

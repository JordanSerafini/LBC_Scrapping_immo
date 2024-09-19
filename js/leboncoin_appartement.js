import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import randomUseragent from 'random-useragent';
import pLimit from 'p-limit';
import fs from 'fs/promises';

// Utilisation du plugin Stealth pour masquer les caractéristiques d'un bot
puppeteer.use(StealthPlugin());

// Fonction pour ajouter des délais aléatoires
function delay(min, max) {
  const time = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, time));
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

(async () => {
  // Configuration du navigateur avec Stealth et autres options
  const browser = await puppeteer.launch({
    headless: false, // false pour voir le navigateur, true pour headless
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
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.5845.96 Safari/537.36');
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });

  // Interception des requêtes pour bloquer certains scripts ou ressources
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const blockedResourceTypes = ['image', 'stylesheet', 'font', 'media'];
    const blockedDomains = ['iovation-first-third.js'];
    if (blockedResourceTypes.includes(request.resourceType()) || blockedDomains.some(domain => request.url().includes(domain))) {
      request.abort();
    } else {
      request.continue();
    }
  });

  // Ajouter les cookies récupérés avant la navigation
  const cookies = [
    {
      name: 'datadome',
      value: 'VeyqfEo80payX1d0pIRLVjedRjLL6LQMYA8VOpiahUbPImFl3Ws5e~qFJ85zRDTc4ce686Q8OjrxLjnWzW~JDFqh7IUbbs537PR3Id5fBsI4GaOqno8OTHXfjrBEh5p1',
      domain: '.leboncoin.fr',
      path: '/',
      expires: 1694362234,
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
    },
    {
      name: 'dblockS',
      value: '11',
      domain: 'www.leboncoin.fr',
      path: '/',
      expires: -1,
      httpOnly: false,
      secure: false,
    },
    {
      name: 'utag_main',
      value: 'v_id:0191d277f2c8000292f1fdba5dfb0506f003a06700bd6$_sn:3$_ss:0$_st:1725982834408$_pn:4%3Bexp-session$ses_id:1725980852687%3Bexp-session',
      domain: '.leboncoin.fr',
      path: '/',
      expires: 1725982834,
      httpOnly: false,
      secure: true,
    },
    {
      name: 'didomi_token',
      value: 'eyJ1c2VyX2lkIjoiMTkxZDI3N2UtYzc4Yi02OWUxLTljN2QtYmNmYmVjNGYyZjdkIiwiY3JlYXRlZCI6IjIwMjQtMDktMDhUMTY6Mjk6MjAuMzc2WiIsInVwZGF0ZWQiOiIyMDI0LTA5LTA4VDE2OjI5OjIyLjYyNFoiLCJ2ZW5kb3JzIjp7ImVuYWJsZWQiOlsiZ29vZ2xlIiwiYzpsYmNmcmFuY2UiLCJjOnJldmxpZnRlci1jUnBNbnA1eCIsImM6cHVycG9zZWxhLTN3NFpmS0tEIiwiYzppbmZlY3Rpb3VzLW1lZGlhIiwiYzp0dXJibyIsImM6YWRpbW8tUGhVVm02RkUiLCJjOmdvb2dsZWFuYS00VFhuSmlnUiIsImM6dW5kZXJ0b25lLVRManFkVHBmIiwiYzptNnB1YmxpY2ktdFhUWUROQWMiLCJjOnJvY2tlcmJveC1mVE04RUo5UCIsImM6YWZmaWxpbmV0IiwiYzpzcG9uZ2VjZWxsLW55eWJBS0gyIiwiYzp0YWlsdGFyZ2UtbkdXVW5heTciLCJjOnRpa3Rvay1yS0FZRGdiSCIsImM6emFub3gtYVlZejZ6VzQiLCJjOnBpbnRlcmVzdCIsImM6aWduaXRpb25vLUxWQU1aZG5qIiwiYzpkaWRvbWkiLCJjOmxiY2ZyYW5jZS1IeTNrWU05RiJdfSwicHVycG9zZXMiOnsiZW5hYmxlZCI6WyJleHBlcmllbmNldXRpbGlzYXRldXIiLCJtZXN1cmVhdWRpZW5jZSIsInBlcnNvbm5hbGlzYXRpb25tYXJrZXRpbmciLCJwcml4IiwiZGV2aWNlX2NoYXJhY3RlcmlzdGljcyIsImNvbXBhcmFpc29tYXJrZXQ2NDciXX0sInZlbmRvcnNfbGkiOnsiZW5hYmxlZCI6WyJnb29nbGUiLCJjOnB1cnBvc2VsYS0zdzRaZktLRCIsImM6dHVyYm8iXX0sInZlbmRvcnMiOltdfX0=',
      domain: '.leboncoin.fr',
      path: '/',
      expires: 1733933764,
      httpOnly: false,
      secure: true,
    },
  ];

  await page.setCookie(...cookies);

  // Définir les en-têtes HTTP supplémentaires
  await page.setExtraHTTPHeaders({
    'User-Agent': userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.4472.124 Safari/537.36',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': 'https://www.leboncoin.fr/',
    'Upgrade-Insecure-Requests': '1',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  });

  // Mouvement initial de la souris pour simuler un comportement humain
  await moveMouseRandomly(page);

  let currentPage = 1;
  const maxPages = 2;
  let apartments = [];

  // Limiter la concurrence à 3 onglets simultanément
  const limit = pLimit(3);

  while (currentPage <= maxPages) {
    try {
      console.log(`Navigating to page ${currentPage}...`);
      await page.goto(
        `https://www.leboncoin.fr/recherche?category=9&locations=Annecy_74000&page=${currentPage}`,
        { waitUntil: 'networkidle0' }
      );

      // Déplacer la souris de manière aléatoire avant d'interagir
      await moveMouseRandomly(page);
      await delay(5000, 10000); // Pause entre 5 et 10 secondes

      // Simuler un défilement de page
      await scrollPage(page);
      await delay(4000, 8000); // Pause entre 4 et 8 secondes après le défilement

      // Vérifier et gérer le CAPTCHA manuellement
      const isCaptcha = await page.evaluate(() => {
        return document.querySelector('.no-js .captcha-container') !== null;
      });

      if (isCaptcha) {
        console.log('CAPTCHA détecté, veuillez le résoudre manuellement.');
        await page.waitForFunction(() => {
          return document.querySelector('.no-js .captcha-container') === null;
        }, { timeout: 0 });
        console.log('CAPTCHA résolu.');
        await delay(3000, 5000); // Pause supplémentaire après le CAPTCHA
      }

      // Gérer la fenêtre de consentement
      try {
        await page.waitForSelector('button[id="didomi-notice-agree-button"]', { timeout: 10000 });
        await page.click('button[id="didomi-notice-agree-button"]');
        console.log("Bouton 'Accepter & Fermer' cliqué.");
      } catch (e) {
        console.log('Pas de fenêtre de consentement.');
      }

      // Attendre que les annonces soient chargées
      await page.waitForSelector('a[data-test-id="ad"]', { timeout: 60000 });

      // Extraire les liens des annonces
      const links = await page.evaluate(() => {
        const items = document.querySelectorAll('a[data-test-id="ad"]');
        return Array.from(items).map((item) => item.href);
      });

      console.log(`Nombre d'annonces trouvées sur la page ${currentPage}: ${links.length}`);

      // Extraire les détails des annonces avec limitation de concurrence
      const profilePromises = links.map((link) =>
        limit(async () => {
          const newPage = await browser.newPage();
          try {
            // Appliquer les mêmes en-têtes et user-agent à chaque nouvelle page
            await newPage.setUserAgent(
              userAgent ||
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.4472.124 Safari/537.36'
            );
            await newPage.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });

            // Bloquer les mêmes ressources sur les nouvelles pages
            await newPage.setRequestInterception(true);
            newPage.on('request', (request) => {
              const blockedResourceTypes = ['image', 'stylesheet', 'font', 'media'];
              const blockedDomains = ['iovation-first-third.js'];
              if (
                blockedResourceTypes.includes(request.resourceType()) ||
                blockedDomains.some((domain) => request.url().includes(domain))
              ) {
                request.abort();
              } else {
                request.continue();
              }
            });

            console.log(`Extraction des informations de l'annonce : ${link}`);
            await newPage.goto(link, { waitUntil: 'networkidle0' });
            await moveMouseRandomly(newPage);
            await delay(3000, 6000); // Pause pour simuler la lecture de la page

            // Simuler un défilement sur la page de l'annonce
            await scrollPage(newPage);
            await delay(2000, 4000); // Pause après le défilement

            const apartmentDetails = await newPage.evaluate(() => {
              const title = document.querySelector('h1[data-qa-id="adview_title"]')?.innerText.trim() || 'Titre non disponible';
              const price = document.querySelector('p[data-qa-id="adview_price"]')?.innerText.trim() || 'Prix non disponible';
              const description = document.querySelector('div[data-qa-id="adview_description_container"] p')?.innerText.trim() || 'Description non disponible';
              const surface = document.querySelector('span[data-qa-id="adview_surface"]')?.innerText.trim() || 'Surface non disponible';
              const date = document.querySelector('span[data-qa-id="adview_publication_date"]')?.innerText.trim() || 'Date non disponible';

              return {
                title,
                price,
                description,
                surface,
                date,
                link: window.location.href,
              };
            });

            apartments.push(apartmentDetails);
            console.log(`Détails extraits pour l'annonce : ${apartmentDetails.title}`);
            await delay(5000, 10000); // Pause plus longue pour simuler une navigation lente
          } catch (error) {
            console.error(`Erreur lors de la navigation vers l'annonce ${link}: ${error.message}`);
          } finally {
            await newPage.close(); // Fermer l'onglet après avoir récupéré les détails
          }
        })
      );

      await Promise.all(profilePromises);
      console.log(`Fin de l'extraction des annonces pour la page ${currentPage}.`);
      currentPage++;
    } catch (error) {
      console.error(`Erreur lors de la récupération des annonces à la page ${currentPage}: ${error.message}`);
      // Optionnel : Implémenter une logique de retry ici si nécessaire
      break; // Sortir de la boucle en cas d'erreur critique
    }
  }

  // Enregistrer les données extraites dans un fichier JSON
  try {
    await fs.writeFile('apartments.json', JSON.stringify(apartments, null, 2), 'utf-8');
    console.log('Données enregistrées dans apartments.json');
  } catch (error) {
    console.error(`Erreur lors de l'enregistrement des données: ${error.message}`);
  }

  await browser.close();
  console.log('Navigateur fermé.');
})();

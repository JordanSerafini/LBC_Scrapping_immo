import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import pLimit from 'p-limit';

puppeteer.use(StealthPlugin());

const delay = (time) => new Promise(resolve => setTimeout(resolve, time));

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    try {
        const page = await browser.newPage();

        console.log('Accès à la page de connexion PagesJaunes...');
        await page.goto('https://www.pagesjaunes.fr/', { waitUntil: 'networkidle2' });

        await page.waitForSelector('#didomi-notice-agree-button', { visible: true });
        console.log('Clic sur le bouton "Accepter & Fermer"...');
        await page.click('#didomi-notice-agree-button');
        await delay(500);

        await page.waitForSelector('#ou', { visible: true });
        await page.waitForSelector('#quoiqui', { visible: true });

        await page.type('#ou', 'Annecy');
        await delay(500);

        await page.type('#quoiqui', 'restaurant');
        await delay(500);

        await page.waitForSelector('#findId', { visible: true });
        await page.click('#findId');
        console.log('Recherche soumise en cliquant sur le bouton "Trouver"...');
        await delay(1000);

        await page.waitForSelector('.SEL-lieu.pjpopin-closer.pj-link', { visible: true });
        await page.click('.SEL-lieu.pjpopin-closer.pj-link');
        console.log('Clic sur le 1er lien');

        await page.waitForSelector('a.bi-denomination.pj-link h3', { visible: true, timeout: 60000 });
        console.log('Résultats de recherche chargés.');

        const results = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('a.bi-denomination.pj-link h3'));
            return elements.map(el => el.innerText.trim());
        });

        console.log('Résultats extraits :', results);

    } catch (error) {
        console.error('Erreur dans le processus :', error);
        
        // if (error instanceof puppeteer.errors.TimeoutError) {
        //     const screenshotPath = 'error_screenshot.png';
        //     await page.screenshot({ path: screenshotPath, fullPage: true });
        //     console.log(`Capture d'écran enregistrée à ${screenshotPath}`);
        // }
    } finally {
        await browser.close();
        console.log('Navigateur fermé.');
    }
})();

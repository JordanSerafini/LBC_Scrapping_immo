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

        await page.type('#quoiqui', 'hotel');
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

        const name = await page.evaluate(() => {
            const name = Array.from(document.querySelectorAll('a.bi-denomination.pj-link h3'));
            return name.map(el => el.innerText.trim());
        });

        console.log('Name extraits :', name);

        
        const addresses = await page.evaluate(() => {
            // Sélectionner toutes les balises <a> qui ont l'attribut title="Voir le plan"
            const addressElements = Array.from(document.querySelectorAll('a[title="Voir le plan"]'));
        
            // Retourner uniquement le texte avant les balises <span> (qui contiennent des icônes ou autres éléments)
            return addressElements.map(el => {
                // Extraire les nœuds de texte à l'intérieur de l'élément <a>
                const textNodes = Array.from(el.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
                // Combiner tous les nœuds de texte ensemble pour former l'adresse
                return textNodes.map(node => node.textContent.trim()).join(' ');
            });
        });
        
        console.log('Adresses extraites :', addresses);
        

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

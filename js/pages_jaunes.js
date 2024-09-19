import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import pLimit from 'p-limit';

puppeteer.use(StealthPlugin());

const delay = (time) => new Promise(resolve => setTimeout(resolve, time));

(async () => {
    const browser = await puppeteer.launch({ headless: true });
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
        await delay(1000);

        const allData = [];

        let hasNextPage = true;
        while (hasNextPage) {
            await page.waitForSelector('a.bi-denomination.pj-link h3', { visible: true, timeout: 60000 });
            console.log('Résultats de recherche chargés.');

            const name = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('a.bi-denomination.pj-link h3')).map(el => el.innerText.trim());
            });

            const addresses = await page.evaluate(() => {
                const addressElements = Array.from(document.querySelectorAll('a[title="Voir le plan"]'));
                return addressElements.map(el => {
                    const textNodes = Array.from(el.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
                    return textNodes.map(node => node.textContent.trim()).join(' ');
                });
            });

            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('span.value'))
                    .filter(span => span.innerText.includes('Afficher le N°'));

                buttons.forEach(button => button.click());
                console.log('Clic sur les boutons "Afficher le N°" réussi.');
            });

            const numeros = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('span.annonceur')).map(el => el.innerText.trim());
            });

            const pageData = name.map((nom, index) => ({
                name: nom,
                address: addresses[index] || 'Adresse non trouvée',
                phone: numeros[index] || 'Numéro non trouvé'
            }));

            allData.push(...pageData);

            const nextPageExists = await page.$('#pagination-next');
            if (nextPageExists) {
                console.log('Attente de 5 secondes avant de cliquer sur "Suivant"...');
                await delay(5000);
                
                try {
                    console.log('Clic sur "Suivant"...');
                    await page.click('#pagination-next');
                    
                    await page.waitForSelector('a.bi-denomination.pj-link h3', { visible: true, timeout: 60000 });
                    await delay(5000);
                } catch (err) {
                    console.error('Erreur lors du passage à la page suivante :', err);
                    hasNextPage = false;
                }
            } else {
                hasNextPage = false;
            }
        }

        console.log('Données JSON assemblées pour toutes les pages :', JSON.stringify(allData, null, 2));

    } catch (error) {
        console.error('Erreur dans le processus :', error);
    } finally {
        await browser.close();
        console.log('Navigateur fermé.');
    }
})();

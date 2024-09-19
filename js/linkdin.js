import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import pLimit from 'p-limit';

puppeteer.use(StealthPlugin());

const delay = (time) => new Promise(resolve => setTimeout(resolve, time));

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    try {
        const page = await browser.newPage();

        console.log('Accès à la page de connexion LinkedIn...');
        await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle2' });

        const username = 'tinkerbell.7490@gmail.com';
        const password = 'qQfmp5$Jok4Gx!P5';

        console.log('Remplissage du formulaire de connexion...');
        await page.type('input#username', username, { delay: 100 });
        await delay(500);
        await page.type('input#password', password, { delay: 100 });
        await delay(500);

        console.log('Soumission du formulaire de connexion...');
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
        ]);

        if (page.url().includes('/feed')) {
            console.log('Connexion réussie !');
        } else {
            console.log('Vérification manuelle requise. Veuillez compléter la vérification dans le navigateur.');
            
            await page.waitForFunction(
                () => window.location.href.includes('/feed'),
                { timeout: 0 }
            );
            console.log('Vérification manuelle complétée. Connexion réussie !');
        }
        

        console.log('Accès à la barre de recherche...');
        await page.waitForSelector('.search-global-typeahead__input', { visible: true });
        await page.type('.search-global-typeahead__input', 'Jordan Serafini', { delay: 100 });
        await delay(500);
        await page.keyboard.press('Enter');

        console.log('Attente des résultats de la recherche...');
        await page.waitForSelector('.entity-result__title-text a', { timeout: 10000 });

        const profileLinks = await page.evaluate(() => {
            const links = [];
            const nodes = document.querySelectorAll('.entity-result__title-text a');

            nodes.forEach((node, index) => {
                if (index < 10) {
                    links.push({
                        name: node.textContent.trim(),
                        url: node.href
                    });
                }
            });

            return links;
        });

        console.log('Profils extraits :', profileLinks);

        const limit = pLimit(3);

        const profilePromises = profileLinks.map(profile => limit(async () => {
            const profilePage = await browser.newPage();
            try {
                console.log(`Extraction des informations du profil : ${profile.name}`);
                await profilePage.goto(profile.url, { waitUntil: 'networkidle2' });

                await profilePage.waitForSelector('.pv-text-details__left-panel', { timeout: 10000 });

                const profileInfo = await profilePage.evaluate(() => {
                    const name = document.querySelector('.pv-text-details__left-panel h1')?.textContent?.trim();
                    const title = document.querySelector('.pv-text-details__left-panel .text-body-medium')?.textContent?.trim();
                    const location = document.querySelector('.pv-top-card--list-bullet li')?.textContent?.trim();

                    return { name, title, location };
                });

                console.log('Infos profil :', profileInfo);
            } catch (error) {
                console.error(`Erreur lors de l'extraction du profil ${profile.url} :`, error);
            } finally {
                await profilePage.close();
            }
        }));

        await Promise.all(profilePromises);

    } catch (error) {
        console.error('Erreur globale du script :', error);
    } finally {
        await browser.close();
        console.log('Navigateur fermé.');
    }
})();

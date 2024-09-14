import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Accéder à la page de connexion LinkedIn
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle2' });

    const cookies = [
        {
            name: 'li_at',
            value: 'AQEDATKmGy8F5Q7-AAABdG3Zz2kAAAF6J1dH6U4A1jE3Z2N6QvQyKv',    
            domain: '.linkedin.com',
        },
    ];

    // Remplir le formulaire de connexion
    await page.type('input#username', 'tinkerbell.7490@gmail.com');
    await page.type('input#password', 'qQfmp5$Jok4Gx!P5');

    // Soumettre le formulaire de connexion
    await page.click('button[type="submit"]');
    
    // Attendre que la page suivante se charge après connexion
    await page.waitForNavigation();

    // Attendre que l'icône de recherche soit visible avant de la cliquer
    await page.waitForSelector('.search-global-typeahead__search-icon-container', { visible: true });
    await page.click('.search-global-typeahead__search-icon-container');

    // Rechercher un nom dans la barre de recherche
    await page.type('input.search-global-typeahead__input', 'Jordan Serafini');
    await page.keyboard.press('Enter');

    // Attendre que la page de résultats se charge
    await page.waitForSelector('.entity-result__title-text', { timeout: 10000 });

    // Extraire les 10 premiers résultats de la recherche
    const profileLinks = await page.evaluate(() => {
        const profileLinks = [];
        const nodes = document.querySelectorAll('.entity-result__title-text a');

        nodes.forEach((node, index) => {
            if (index < 10) {
                profileLinks.push({
                    name: node.textContent.trim(),
                    url: node.href
                });
            }
        });

        return profileLinks;
    });

    //console.log('Profils extraits :', profileLinks);

    // Itérer sur chaque profil pour extraire des informations
    for (const profile of profileLinks) {
        // Ouvrir un nouvel onglet pour chaque profil
        const profilePage = await browser.newPage();
        await profilePage.goto(profile.url, { waitUntil: 'networkidle2' });

        // Attendre que les éléments du profil soient visibles
        await profilePage.waitForSelector('.pv-text-details__left-panel', { timeout: 10000 });

        // Extraire des informations du profil
        const profileInfo = await profilePage.evaluate(() => {
            const name = document.querySelector('.pv-text-details__left-panel h1')?.textContent?.trim();
            const title = document.querySelector('.pv-text-details__left-panel .text-body-medium')?.textContent?.trim();
            const location = document.querySelector('.pv-top-card--list-bullet li')?.textContent?.trim();

            return { name, title, location };
        });

        console.log('Infos profil :', profileInfo);

        // Fermer l'onglet du profil
        await profilePage.close();
    }

    // Fermer le navigateur
    await browser.close();
})();

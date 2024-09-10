import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Accéder à la page de connexion LinkedIn
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle2' });

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
    const results = await page.evaluate(() => {
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

    console.log(results);

    // Fermer le navigateur
    await browser.close();
})();

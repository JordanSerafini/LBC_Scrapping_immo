import puppeteer from 'puppeteer';

export default async function fetchBookingInfo(city) {
    console.log('Lancement du navigateur...');
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text())); // afficher les consoles log

    console.log('Visite de la page...');
    await page.goto(`https://www.laforet.com/agence-immobiliere/${city}/acheter?next=88`);
    //await page.goto(`https://www.laforet.com/agence-immobiliere/annecy-parmelan/acheter?next=88`);

    console.log('Attente des sélecteurs...');
    await page.waitForSelector('.apartment-card'); 

    console.log('Récupération des données...');
    const results = await page.evaluate(() => {
        console.log('Recherche des cartes d\'appartement...');
        const apartmentCards = Array.from(document.querySelectorAll('.apartment-card'));
        console.log(`Nombre de cartes trouvées: ${apartmentCards.length}`);

        const getTextContent = (element, selector) => {
            console.log(`Recherche du texte pour le sélecteur: ${selector}`);
            const target = element.querySelector(selector);
            const textContent = target ? target.textContent.trim() : null;
            console.log(`Texte trouvé: ${textContent}`);
            return textContent;
        };

        console.log('Mapping des propriétés...');
        const apartments = apartmentCards.map(card => {
            const label = getTextContent(card, '.apartment__label');
            const ville = getTextContent(card, '.apartment-content > p'); 
            const price = getTextContent(card, '.apartment__price');
            const tags = Array.from(card.querySelectorAll('.tag')).map(tag => {
                console.log(`Tag trouvé: ${tag.textContent.trim()}`);
                return tag.textContent.trim();
            });

            return {
                label,
                ville,
                price,
                tags
            };
        });

        return apartments;
    });

    console.log('Fermeture du navigateur...');
    await browser.close();

    return results;
}
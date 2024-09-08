import time
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


import os

# Désactiver la vérification SSL
os.environ['WDM_SSL_VERIFY'] = '0'

# Démarre le navigateur avec undetected-chromedriver
options = uc.ChromeOptions()
options.add_argument("--no-sandbox")
options.add_argument("--disable-setuid-sandbox")
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_argument("--disable-infobars")
options.add_argument("--lang=fr-FR,fr")

driver = uc.Chrome(service=Service(ChromeDriverManager().install()), options=options)

# Fonction pour attendre un délai aléatoire
def delay(min_sec, max_sec):
    time.sleep(time.uniform(min_sec, max_sec))

# Ouverture de la page cible
driver.get("https://www.leboncoin.fr/recherche?category=9&locations=Annecy_74000&page=1")

# Vérifie la présence de CAPTCHA et attend manuellement sa résolution
captcha_present = driver.find_elements(By.CLASS_NAME, "captcha-container")

if captcha_present:
    print("CAPTCHA détecté, merci de le résoudre manuellement.")
    while driver.find_elements(By.CLASS_NAME, "captcha-container"):
        time.sleep(5)  # Vérifie toutes les 5 secondes si le CAPTCHA est toujours présent
    print("CAPTCHA résolu.")

# Continue après le CAPTCHA
try:
    # Clique sur le bouton d'acceptation des cookies si présent
    accept_cookies_button = driver.find_element(By.ID, "didomi-notice-agree-button")
    accept_cookies_button.click()
    print("Cookies acceptés.")
except:
    print("Pas de bouton d'acceptation des cookies trouvé.")

# Extraction des annonces
links = driver.find_elements(By.CSS_SELECTOR, 'a[data-test-id="ad"]')[:5]
apartments = []
for link in links:
    href = link.get_attribute('href')
    driver.get(href)
    
    # Extraction des détails
    title = driver.find_element(By.CSS_SELECTOR, 'h1[data-qa-id="adview_title"]').text
    try:
        price = driver.find_element(By.CSS_SELECTOR, 'p.text-headline-2').text
    except:
        price = "Prix non disponible"
    
    try:
        description = driver.find_element(By.CSS_SELECTOR, 'div[data-qa-id="adview_description_container"] p').text
    except:
        description = "Description non disponible"
    
    try:
        surface = driver.find_element(By.CSS_SELECTOR, 'span.text-body-1').text
    except:
        surface = "Surface non disponible"

    apartments.append({
        "title": title,
        "price": price,
        "description": description,
        "surface": surface,
        "link": href
    })
    
    # Délai entre chaque annonce pour éviter la détection
    delay(3, 6)

# Affichage des résultats
for apt in apartments:
    print(f"Title: {apt['title']}\nPrice: {apt['price']}\nSurface: {apt['surface']}\nDescription: {apt['description']}\nLink: {apt['link']}\n")

# Fermer le navigateur après
driver.quit()

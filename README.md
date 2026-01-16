# Crawlee + Playwright – prosty crawler

Projekt przedstawia prosty crawler oparty o **Crawlee** i **Playwright**, który:
- otwiera wskazaną stronę,
- czeka na załadowanie elementu,
- pobiera HTML z konkretnego elementu (`div[data-test="abc"]`),
- wypisuje jego zawartość w konsoli.

---

## Wymagania
Node.js >= 18

## 📦 Instalacja

1. Sklonuj repozytorium:
git clone https://github.com/gosia-barlik/Prosty_crawler.git
cd Prosty_crawler

2. Zainstaluj zależności:
npm install

3. Zainstaluj przeglądarki Playwrighta:
npx playwright install

##  Uruchomienie crawlera
node src/index.js




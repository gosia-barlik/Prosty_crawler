# Web Crawling Playground

Projekt demonstracyjny pokazujący **dwa różne podejścia do pobierania danych** w Node.js:

1. Crawlowanie HTML przy użyciu przeglądarki (Crawlee + Playwright)
2. Bezpośrednie pobieranie danych z API (fetch)

Repozytorium ma charakter edukacyjny i porównawczy — pozwala szybko sprawdzić, **które podejście jest właściwe w danym przypadku**.

---

## Spis treści

* [Technologie](#technologie)
* [Struktura projektu](#struktura-projektu)
* [Rozwiązania](#rozwiązania)

  * [Crawler HTML (Crawlee + Playwright)](#1-crawler-html-crawlee--playwright)
  * [Crawler API (Node.js)](#2-crawler-api-nodejs)
* [Jak uruchomić](#jak-uruchomić)
* [Porównanie podejść](#porównanie-podejść)

---

## Technologie

* **Node.js** (>= 18)
* **Crawlee**
* **Playwright**
* **fetch API** (wbudowane w Node.js)

---

## Struktura projektu

```
.
├── index.js        # Crawler HTML (Crawlee + Playwright)
├── api-test.js     # Crawlowanie danych z API
├── package.json
└── README.md
```

---

## Rozwiązania

### 1. Crawler HTML (Crawlee + Playwright)

**Plik:** `index.js`

Rozwiązanie oparte o **Crawlee** i **Playwright**, uruchamiane w kontekście przeglądarki.

Crawler:

* otwiera wskazaną stronę WWW,
* czeka na załadowanie konkretnego elementu DOM,
* pobiera HTML z wybranego elementu (`div[data-test="abc"]`),
* wypisuje zawartość elementu w konsoli.

**Kiedy używać:**

* dane są renderowane dynamicznie (SPA),
* brak publicznego API,
* wymagane jest czekanie na elementy lub interakcja z DOM.

---

### 2. Crawler API (Node.js)

**Plik:** `api-test.js`

Rozwiązanie wykorzystujące **bezpośrednie zapytanie HTTP** do endpointu API, bez uruchamiania przeglądarki.

Wymaga znajomości URL API


**Kiedy używać:**

* dostępne jest publiczne lub nieautoryzowane API,
* zależy nam na szybkości i prostocie,
* nie ma potrzeby renderowania HTML.

---

## Jak uruchomić

1. Zainstaluj zależności:

```bash
npm install
```
1a. Opcjonalnie zainstaluj przeglądarki Playwrighta: 

```bash
npx playwright install
```

2. Uruchom crawler HTML:

```bash
node index.js
```

3. Uruchom crawler API:

```bash
node api-test.js
```

---

## Porównanie podejść

| Cecha               | Crawlee + Playwright | API crawler   |
| ------------------- | -------------------- | ------------- |
| Wydajność           | Wolniejsza           | Bardzo szybka |
| Zależność od UI     | Tak                  | Nie           |
| Wymaga przeglądarki | Tak                  | Nie           |
| Stabilność          | Średnia (zmiany DOM) | Wysoka        |
| Złożoność           | Wyższa               | Niska         |





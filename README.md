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

  * [Crawler HTML - zapis HTML (Crawlee + Playwright)](#1-crawler-html-zapis-html)
  * [Crawler HTML - zapis innerText (Crawlee + Playwright)](#2-crawler-html-zapis-innerText)
  * [Crawler API (Node.js)](#3-crawler-api-nodejs)
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
├── getHtml.js              # Crawler HTML zapisujący pełny HTML
├── getHtmlWithParams.js    # Crawler HTML z parametrami CLI zapisujący pełny HTML 
├── getInnerText.js         # Crawler HTML zapisujący innerText
├── api-test.js             # Crawlowanie danych z API
├── package.json
└── README.md

```

---

## Rozwiązania

### 1. Crawler HTML – zapis HTML

**Plik** : `getHtml.js`

Crawler oparty o Crawlee i Playwright, uruchamiany w kontekście przeglądarki.

Działanie skryptu:
- uruchamia crawler na wskazanej stronie archiwum,
- wyszukuje linki znajdujące się w div.offers,
- otwiera każdą znalezioną podstronę,
- odczytuje zawartość elementu div#offer-details,
- zapisuje pełny HTML tego elementu.

**Plik** : `getHtmlWithParams.js`

Crawler oparty o Crawlee i Playwright, uruchamiany w kontekście przeglądarki.

Działanie skryptu:
- Parametry wejściowe:
    year – rok archiwum (wymagany)
    month – miesiąc archiwum (wymagany)
    **startPage – opcjonalny numer strony, jeśli podany → crawler pobiera tylko tę stronę, jeśli nie podany → crawler automatycznie przechodzi przez strony, aż do ustawionego limitu (MAX_PAGES)**
    **endPage – opcjonalny numer strony, jeśli podany → crawler pobiera strony z zakresu startPage - endPage, jeśli nie podany → crawler automatycznie przechodzi przez strony, aż do ustawionego limitu (MAX_PAGES)**

- Obsługa stron listingowych
  - wczytuje wskazaną stronę archiwum
  - odczytuje wszystkie linki do ofert znajdujące się w div.offers
  - dodaje je do kolejki do pobrania
  - jeśli działamy w trybie automatycznym (bez podanego startPage) → po krótkiej przerwie (debounce, domyślnie 5s) dodaje kolejny numer strony do kolejki, aż do limitu stron (MAX_PAGES)

- Obsługa stron ofert
  - dla każdej podstrony oferty oczekuje na element div#offer-details
  - odczytuje pełny HTML tego elementu
  - zapisuje HTML do katalogu wyjściowego

- Dodatkowe funkcje
  - licznik stron odwiedzonych i zapisanych ofert w logu (htmlWithParams.log)
  - limit równoległości (maxConcurrency) dla bezpieczeństwa pamięci i CPU
  - obsługa restartu lub debugowania od dowolnej strony (przez opcjonalny startPage)
  - debounce między stronami listingowymi, aby nie przeciążać serwera


### 2. Crawler HTML – zapis innerText

**Plik** : `getInnerText.js`

Crawler działa analogicznie do getHtml.js, ale różni się sposobem zapisu danych.
Działanie skryptu:
- uruchamia crawler na stronie archiwum,
- zbiera linki z div.offers,
- otwiera podstrony ofert,
- odczytuje zawartość div#offer-details,
- zapisuje wyłącznie tekst (innerText) bez HTML.


### 3. Crawler API (Node.js)

**Plik:**  `api-test.js`

Rozwiązanie wykorzystujące bezpośrednie zapytanie HTTP do endpointu API, bez uruchamiania przeglądarki.

Wymaga znajomości URL API.


---

## Jak uruchomić

1. Zainstaluj zależności:

```bash
npm install
```
2. Zainstaluj przeglądarki Playwrighta: 

```bash
npx playwright install
```

3. Uruchom crawler zapisujący HTML:

```bash
node src/getHtml.js
node src/getHtmlWithParams.js 2024 2 3 5 //(year, month, startPage, endPage - ostatnie 2 parametry opcjonalne)
```

4. Uruchom crawler zapisujący innerText:

```bash
node src/getInnerText.js
```

5. Uruchom crawler API:
```bash
node src/api-test.js
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





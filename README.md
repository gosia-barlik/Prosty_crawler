# Web Crawling Playground

Projekt demonstracyjny pokazujący **dwa różne podejścia do pobierania danych** w Node.js:

1. Crawlowanie HTML przy użyciu przeglądarki (Crawlee + Playwright)
2. Bezpośrednie pobieranie danych z API (fetch)

Repozytorium ma charakter edukacyjny i porównawczy — pozwala szybko sprawdzić, **które podejście jest właściwe w danym przypadku**.



## Spis treści

* [Technologie](#technologie)
* [Struktura projektu](#struktura-projektu)
* [Rozwiązania](#rozwiązania)

  * [Crawler HTML - zapis HTML (Crawlee + Playwright)](#1-crawler-html-zapis-html)
  * [Crawler HTML - zapis innerText (Crawlee + Playwright)](#2-crawler-html-zapis-innerText)
  * [Crawler API (Node.js)](#3-crawler-api-nodejs)
* [Jak uruchomić](#jak-uruchomić)
* [Porównanie podejść](#porównanie-podejść)



## Technologie

* **Node.js** (>= 18)
* **Crawlee**
* **Playwright**
* **fetch API** (wbudowane w Node.js)



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



## Rozwiązania

### 1. Crawler HTML – zapis HTML

**1a. Plik** : `getHtml.js`

Crawler oparty o Crawlee i Playwright, uruchamiany w kontekście przeglądarki.

**Działanie skryptu:**
- uruchamia crawler na wskazanej stronie archiwum,
- wyszukuje linki znajdujące się w div.offers,
- otwiera każdą znalezioną podstronę,
- odczytuje zawartość elementu div#offer-details,
- zapisuje pełny HTML tego elementu.

**1b. Plik** : `getHtmlWithParams.js`

Crawler oparty o Crawlee i Playwright, uruchamiany w kontekście przeglądarki.

**Działanie skryptu:**
- Parametry wejściowe:
    - year – rok archiwum (wymagany)
    - month – miesiąc archiwum (wymagany)
    - startPage – opcjonalny numer strony początkowej, 
      - jeśli podany, crawler rozpoczyna pobieranie od wskazanej strony
      - jeśli nie podany, crawler rozpoczyna od strony 1
    - endPage – opcjonalny numer strony końcowej, 
      - jeśli podany, crawler pobiera strony z zakresu startPage - endPage
      - jeśli nie podany, crawler automatycznie przechodzi przez strony aż do ustawionego limitu (MAX_PAGES) lub napotkania 10 pustych stron z rzędu

**Przykłady:**
```bash
node getHtmlWithParams.js 2022 6
```
Pobiera strony od 1 wzwyż. Crawler zakończy pracę po osiągnięciu MAX_PAGES lub po napotkaniu 10 pustych stron z rzędu.

```bash
node getHtmlWithParams.js 2022 6 10
```
Pobiera strony od 10 wzwyż. Crawler zakończy pracę po osiągnięciu MAX_PAGES lub po napotkaniu 10 pustych stron z rzędu.

```bash
node getHtmlWithParams.js 2022 6 10 300
```
Pobiera strony od 10 do 300 włącznie.

**Obsługa stron listingowych:**

Dla każdej strony archiwum crawler:
  - wczytuje stronę listingu ofert,
  - odczytuje wszystkie linki do ofert zawierające '/praca/'
  - dodaje je do kolejki do pobrania
  - po krótkiej przerwie (debounce, domyślnie 10 s) dodaje do kolejki następną stronę listingu.

**Obsługa pustych stron:**

Jeżeli strona nie zawiera ofert:
  - przy podanym parametrze endPage crawler kontynuuje przechodzenie do kolejnych stron aż do osiągnięcia endPage,
  - przy braku parametru endPage crawler prowadzi licznik pustych stron z rzędu,
  - napotkanie strony zawierającej oferty zeruje licznik,
  - po napotkaniu 10 pustych stron z rzędu crawler kończy pracę.

**Obsługa stron ofert:**

Dla każdej znalezionej oferty crawler:
  - oczekuje na pojawienie się elementu div#offer-details,
  - pobiera pełny HTML strony oferty,
  - zapisuje HTML do katalogu wyjściowego.

**Logowanie:**

Crawler zapisuje log do pliku:
```bash
htmlWithParams_<year>_<month>_p<startPage>-p<endPage>.log
```
Log zawiera m.in.:
- informacje o starcie crawlera,
- liczbę ofert znalezionych na każdej stronie,
- informacje o pustych stronach,
- informacje o zapisanych ofertach,
- błędy pobierania stron,
- moment zakończenia pracy crawlera.

**Dodatkowe funkcje:**
  - limit równoległości (maxConcurrency) dla bezpieczeństwa pamięci i CPU,
  - możliwość wznowienia pracy od dowolnej strony (startPage),
  - możliwość ograniczenia zakresu stron (endPage),
  - automatyczne zatrzymanie po 10 pustych stronach z rzędu (gdy nie podano endPage),
  - obsługa błędów i ponownych prób pobrania (maxRequestRetries),
  - kontrolowane zakończenie procesu po zakończeniu pracy crawlera.


### 2. Crawler HTML – zapis innerText

**Plik** : `getInnerText.js`

Crawler działa analogicznie do getHtml.js, ale różni się sposobem zapisu danych.
**Działanie skryptu:**
- uruchamia crawler na stronie archiwum,
- zbiera linki z div.offers,
- otwiera podstrony ofert,
- odczytuje zawartość div#offer-details,
- zapisuje wyłącznie tekst (innerText) bez HTML.


### 3. Crawler API (Node.js)

**Plik:**  `api-test.js`

Rozwiązanie wykorzystujące bezpośrednie zapytanie HTTP do endpointu API, bez uruchamiania przeglądarki.

Wymaga znajomości URL API.




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


## Porównanie podejść

| Cecha               | Crawlee + Playwright | API crawler   |
| ------------------- | -------------------- | ------------- |
| Wydajność           | Wolniejsza           | Bardzo szybka |
| Zależność od UI     | Tak                  | Nie           |
| Wymaga przeglądarki | Tak                  | Nie           |
| Stabilność          | Średnia (zmiany DOM) | Wysoka        |
| Złożoność           | Wyższa               | Niska         |





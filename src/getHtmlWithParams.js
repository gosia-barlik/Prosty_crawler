import { PlaywrightCrawler } from "crawlee";
import fs from "fs";
import path from "path";

// Funkcja opóźniająca wykonanie używana, żeby nie wysyłać kolejnych zapytań zbyt szybko.
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// ==================================================
// STAŁE KONFIGURACYJNE
// ==================================================

const MAX_PAGES = 2000;
const MAX_EMPTY_PAGES_IN_ROW = 10;

// Selektor prowadzący do ofert pracy. W obecnej wersji nie ma już div.offers, dlatego wyszukujemy linki zawierające '/praca/'
const OFFER_LINK_SELECTOR = 'a[href*="/praca/"][href*=",oferta,"]';

let emptyPagesInRow = 0;

// ==================================================
// ODCZYT PARAMETRÓW Z CLI
// ==================================================

// process.argv zawiera:[ścieżka do node, ścieżka do skryptu, year, month, startPage, endPage]
const [, , year, month, startPageArg, endPageArg] = process.argv;

if (!year || !month) {
  console.error("Użycie: node getHtmlWithParams.js <year> <month> [startPage] [endPage]");
  process.exit(1);
}
// Jeżeli nie podano startPage, zaczynamy od pierwszej strony.
const startPage = startPageArg ? Number(startPageArg) : 1;

// Informacja, czy użytkownik podał endPage.
const hasExplicitEndPage = endPageArg !== undefined;

// Jeżeli endPage nie zostało podane, przyjmujemy MAX_PAGES.
const endPage = hasExplicitEndPage ? Number(endPageArg) : MAX_PAGES;

// ==================================================
// WALIDACJA PARAMETRÓW
// ==================================================

// Sprawdzenie poprawności parametrów wejściowych.
if (Number.isNaN(startPage) || startPage < 1) {
  console.error("startPage musi być liczbą >= 1");
  process.exit(1);
}

if (Number.isNaN(endPage) || endPage < 1) {
  console.error("endPage musi być liczbą >= 1");
  process.exit(1);
}

if (startPage > endPage) {
  console.error("startPage nie może być większy niż endPage");
  process.exit(1);
}

if (startPage > MAX_PAGES) {
  console.error(`startPage nie może być większy niż MAX_PAGES=${MAX_PAGES}`);
  process.exit(1);
}

if (endPage > MAX_PAGES) {
  console.error(`endPage nie może być większy niż MAX_PAGES=${MAX_PAGES}`);
  process.exit(1);
}

// ==================================================
// LOGOWANIE
// ==================================================

// Każde uruchomienie tworzy osobny plik logów.
const LOG_FILE = `./htmlWithParams_${year}_${String(month).padStart(2, "0")}_p${startPage}-p${endPage}.log`;

// Funkcja zapisująca informacje do pliku logów i do konsoli.
function log(message, level = "INFO") {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] ${message}\n`;

  fs.appendFileSync(LOG_FILE, line, "utf-8");

  if (level === "ERROR") {
    console.error(message);
  } else {
    console.log(message);
  }
}

// Zapis parametrów, z którymi został uruchomiony crawler.
log(
  `START crawlera: year=${year}, month=${month}, startPage=${startPage}, ` +
    `endPage=${endPage}, hasExplicitEndPage=${hasExplicitEndPage}, ` +
    `MAX_EMPTY_PAGES_IN_ROW=${MAX_EMPTY_PAGES_IN_ROW}`,
);

// ==================================================
// GENEROWANIE ADRESU URL STRONY LISTINGOWEJ
// ==================================================

const buildUrl = (pageNumber) => `https://archiwum.pracuj.pl/?year=${year}&month=${month}&pageNumber=${pageNumber}`;

// ==================================================
// KATALOG Z POBRANYMI OFERTAMI
// ==================================================

const OUTPUT_DIR = `htmlWithParamsOutput_${year}_${String(month).padStart(2, "0")}`;

// Utworzenie katalogu, jeżeli jeszcze nie istnieje.
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ==================================================
// KONFIGURACJA CRAWLERA
// ==================================================

const crawler = new PlaywrightCrawler({
  // Maksymalna liczba jednocześnie otwartych stron.
  maxConcurrency: 3,

  // Włączenie zarządzanie sesjami użytkownika (Crawlee może rotować sesje, np. gdy dana sesja zostanie zablokowana).
  useSessionPool: true,

  // Maksymalny czas obsługi jednego requestu.
  requestHandlerTimeoutSecs: 60,

  // Maksymalny czas ładowania strony.
  navigationTimeoutSecs: 25,

  // Liczba ponowień po błędzie.
  maxRequestRetries: 1,

  // Wywoływane po definitywnym niepowodzeniu pobrania strony.
  failedRequestHandler({ request, error }) {
    log(`FAILED REQUEST: ${request.url} | ${error.message}`, "ERROR");
  },

  // ==================================================
  // GŁÓWNA LOGIKA CRAWLERA
  // ==================================================

  async requestHandler({ request, page, enqueueLinks, crawler }) {
    log(`REQUEST: ${request.url}`);
    log(`Aktywne strony: ${crawler.autoscaledPool?.currentConcurrency}`);

    // Sprawdzenie, czy znajdujemy się na stronie listingu
    const requestUrl = new URL(request.url);

    // Listing rozpoznajemy po domenie archiwum, a nie po klasie HTML.
    const isListingPage = requestUrl.hostname === "archiwum.pracuj.pl";

    // ==========================================
    // OBSŁUGA STRONY LISTINGOWEJ
    // ==========================================

    if (isListingPage) {
      // Odczyt numeru strony z parametru pageNumber.
      const currentPage = Number(requestUrl.searchParams.get("pageNumber"));

      // Walidacja numeru strony.
      if (Number.isNaN(currentPage) || currentPage < 1) {
        log(`Nieprawidłowy numer strony w URL: ${request.url}`, "ERROR");
        return;
      }

      // Pominięcie stron poza zadanym zakresem.
      if (currentPage > endPage) {
        log(`Pominięto stronę ${currentPage} (endPage=${endPage})`);
        return;
      }

      // Czekamy na załadowanie zawartości strony.
      await page.waitForLoadState("domcontentloaded");

      // Zliczamy wszystkie linki prowadzące do ofert.
      const linksCount = await page.locator(OFFER_LINK_SELECTOR).count();

      log(`Listing: strona ${currentPage}, ofert: ${linksCount}`);

      // ==========================================
      // OBSŁUGA PUSTYCH STRON
      // ==========================================

      if (linksCount > 0) {
        // Znaleziono oferty - zerujemy licznik pustych stron.
        emptyPagesInRow = 0;

        // Zbieramy wszystkie linki do ofert i dodajemy je do kolejki. Odrzucamy adresy, które nie prowadzą do właściwej strony z ofertą.
        await enqueueLinks({
          selector: OFFER_LINK_SELECTOR,
          strategy: "same-domain",
          transformRequestFunction(request) {
            const url = new URL(request.url);

            // Akceptujemy wyłącznie rzeczywiste adresy ofert.
            if (!url.pathname.includes("/praca/") || !url.pathname.includes(",oferta,")) {
              return false;
            }

            return request;
          },
        });
      } else {
        // Brak ofert - zwiększamy licznik.
        emptyPagesInRow += 1;

        log(
          `Brak ofert na stronie ${currentPage}. Licznik pustych stron: ` +
            `${emptyPagesInRow}/${MAX_EMPTY_PAGES_IN_ROW}`,
        );
      }

      // Jeżeli użytkownik nie podał endPage i napotkaliśmy zbyt wiele pustych stron z rzędu, kończymy pracę.
      if (!hasExplicitEndPage && emptyPagesInRow >= MAX_EMPTY_PAGES_IN_ROW) {
        log(
          `Koniec paginacji - osiągnięto ${MAX_EMPTY_PAGES_IN_ROW} pustych stron z rzędu. ` +
            `Ostatnia sprawdzona strona: ${currentPage}`,
        );
        return;
      }

      // Sprawdzenie, czy osiągnęliśmy ostatnią stronę.
      if (currentPage >= endPage) {
        log(`Osiągnięto ostatnią stronę zakresu: ${currentPage}. Nie dodaję kolejnych stron.`);
        return;
      }

      // Dodanie kolejnej strony do kolejki.
      const nextPage = currentPage + 1;

      // Krótkie opóźnienie, żeby nie przeciążać serwera.
      log(`Debounce 10s przed stroną ${nextPage}...`);
      await sleep(10000);
      await crawler.addRequests([{ url: buildUrl(nextPage) }]);

      return;
    }

    // ==========================================
    // OBSŁUGA STRONY OFERTY
    // ==========================================
    try {
      // Czekamy na załadowanie szczegółów oferty.
      await page.waitForSelector("div#offer-details", { timeout: 5000 });

      // Pobranie pełnego HTMLa strony.
      const html = await page.content();

      // Utworzenie nazwy pliku na podstawie URLa.
      const fileName = request.url.replace(/^https?:\/\//, "").replace(/[^\w]/g, "_") + ".html";

      // Zapis do pliku.
      fs.writeFileSync(path.join(OUTPUT_DIR, fileName), html, "utf-8");
      log(`Zapisano ofertę: ${fileName}`);
    } catch (err) {
      log(`Błąd przy przetwarzaniu oferty ${request.url}: ${err.message}`, "ERROR");
    }
  },
});

// ==================================================
// OBSŁUGA NIEOCZEKIWANYCH BŁĘDÓW
// ==================================================

process.on("uncaughtException", (err) => {
  log(`UNCAUGHT EXCEPTION: ${err.stack}`, "ERROR");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  log(`UNHANDLED PROMISE REJECTION: ${reason}`, "ERROR");
});

// ==================================================
// START CRAWLERA
// ==================================================

await crawler.run([buildUrl(startPage)]);

log("Crawler.run() zakończony.");

// Wymuszenie zakończenia procesu Node.js.
process.exit(0);

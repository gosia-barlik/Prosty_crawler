import { PlaywrightCrawler } from "crawlee";
import fs from "fs";
import path from "path";

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// ====== STAŁE ======
const MAX_PAGES = 2000;

// ====== PARAMETRY Z CLI ======
const [, , year, month, startPageArg, endPageArg] = process.argv;

if (!year || !month) {
  console.error("Użycie: node getHtmlWithParams.js <year> <month> [startPage] [endPage]");
  process.exit(1);
}

const startPage = startPageArg ? Number(startPageArg) : 1;
const endPage = endPageArg ? Number(endPageArg) : MAX_PAGES;

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

// ====== LOGGER ======

const LOG_FILE = `./htmlWithParams_${year}_${String(month).padStart(2, "0")}_p${startPage}-p${endPage}.log`;

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

log(`START crawlera: year=${year}, month=${month}, startPage=${startPage}, endPage=${endPage}`);

// ====== KONSTRUKCJA URL ======
const buildUrl = (pageNumber) =>
  `https://archiwum.pracuj.pl/archive/offers?Year=${year}&Month=${month}&PageNumber=${pageNumber}`;

// ====== KATALOG WYJŚCIOWY ======
const OUTPUT_DIR = `htmlWithParamsOutput_${year}_${String(month).padStart(2, "0")}`;

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ====== CRAWLER ======
const crawler = new PlaywrightCrawler({
  maxConcurrency: 3,
  useSessionPool: true,
  requestHandlerTimeoutSecs: 60,
  navigationTimeoutSecs: 25,
  maxRequestRetries: 1,

  failedRequestHandler({ request, error }) {
    log(`FAILED REQUEST: ${request.url} | ${error.message}`, "ERROR");
  },

  async requestHandler({ request, page, enqueueLinks, crawler }) {
    log(`Aktywne strony: ${crawler.autoscaledPool?.currentConcurrency}`);

    const isListingPage = await page.$("div.offers");

    // ===== STRONA LISTINGOWA =====
    if (isListingPage) {
      const url = new URL(request.url);
      const currentPage = Number(url.searchParams.get("PageNumber"));

      if (Number.isNaN(currentPage) || currentPage < 1) {
        log(`Nieprawidłowy numer strony w URL: ${request.url}`, "ERROR");
        return;
      }

      if (currentPage > endPage) {
        log(`Pominięto stronę ${currentPage} (endPage=${endPage})`);
        return;
      }

      const linksCount = await page.$$eval("div.offers a[href*='/praca/']", (els) => els.length);

      log(`Listing: strona ${currentPage}, ofert: ${linksCount}`);

      if (linksCount > 0) {
        await enqueueLinks({
          selector: "div.offers a[href*='/praca/']",
          strategy: "same-domain",
        });
      } else {
        log(`Brak ofert na stronie ${currentPage}. Idę dalej.`);
      }

      if (currentPage >= endPage) {
        log(`Osiągnięto ostatnią stronę zakresu: ${currentPage}. Nie dodaję kolejnych stron.`);
        return;
      }

      const nextPage = currentPage + 1;
      log(`Debounce 10s przed stroną ${nextPage}...`);
      await sleep(10000);
      await crawler.addRequests([{ url: buildUrl(nextPage) }]);

      return;
    }

    // ===== STRONA OFERTY =====
    try {
      await page.waitForSelector("div#offer-details", { timeout: 5000 });
      const html = await page.content();
      const fileName = request.url.replace(/^https?:\/\//, "").replace(/[^\w]/g, "_") + ".html";

      fs.writeFileSync(path.join(OUTPUT_DIR, fileName), html, "utf-8");
      log(`Zapisano ofertę: ${fileName}`);
    } catch (err) {
      log(`Błąd przy przetwarzaniu oferty ${request.url}: ${err.message}`, "ERROR");
    }
  },
});

// === HANDLERY BŁĘDÓW GLOBALNYCH ===
process.on("uncaughtException", (err) => {
  log(`UNCAUGHT EXCEPTION: ${err.stack}`, "ERROR");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  log(`UNHANDLED PROMISE REJECTION: ${reason}`, "ERROR");
});

// ====== START ======
await crawler.run([buildUrl(startPage)]);

console.log("=== AFTER CRAWLER RUN ===");
log("Crawler.run() zakończony.");
process.exit(0);

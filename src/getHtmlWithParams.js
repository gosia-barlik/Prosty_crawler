// process.env.CRAWLEE_DISABLE_SYSTEM_INFO = "1";

import { PlaywrightCrawler } from "crawlee";
import fs from "fs";
import path from "path";

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// ====== LOGGER ======
const LOG_FILE = "./htmlWithParams.log";

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

// ====== PARAMETRY Z CLI ======
const [, , year, month, pageNumber] = process.argv;
log(`START crawlera: year=${year}, month=${month}`);
if (!year || !month) {
  log(`Użycie: node getHtmlWithParams.js <year> <month> [pageNumber]`);
  process.exit(1);
}
const singlePageMode = pageNumber !== undefined;
const startPage = singlePageMode ? Number(pageNumber) : 1;

if (Number.isNaN(startPage) || startPage < 1) {
  log("pageNumber musi być liczbą >= 1");
  process.exit(1);
}

log(
  singlePageMode
    ? `START crawlera: year=${year}, month=${month}, ONLY page=${startPage}`
    : `START crawlera: year=${year}, month=${month}, AUTO pages`,
);

// ====== KONSTRUKCJA URL ======
const MAX_PAGES = 500;
const buildUrl = (pageNumber) =>
  `https://archiwum.pracuj.pl/archive/offers?Year=${year}&Month=${month}&PageNumber=${pageNumber}`;
const OUTPUT_DIR = "./htmlWithParamsOutput";

// ====== KATALOG WYJŚCIOWY ======
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// ====== CRAWLER ======
const crawler = new PlaywrightCrawler({
  maxConcurrency: 3,
  useSessionPool: true,

  failedRequestHandler({ request, error }) {
    log(`FAILED REQUEST: ${request.url} | ${error.message}`, "ERROR");
  },

  async requestHandler({ request, page, enqueueLinks, crawler }) {
    // ===== STRONA LISTINGOWA =====
    const isListingPage = await page.$("div.offers");

    if (isListingPage) {
      const url = new URL(request.url);
      const pageNumber = Number(url.searchParams.get("PageNumber"));
      const linksCount = await page.$$eval("div.offers a[href*='/praca/']", (els) => els.length);

      await enqueueLinks({
        selector: "div.offers a[href*='/praca/']",
        strategy: "same-domain",
      });

      log(`Listing: strona ${pageNumber}, ofert: ${linksCount}`);

      if (!singlePageMode && pageNumber && pageNumber > MAX_PAGES) {
        log(`Pominięto stronę ${pageNumber} (MAX_PAGES=${MAX_PAGES})`);
        return;
      }

      if (!singlePageMode && linksCount > 0 && pageNumber < MAX_PAGES) {
        const nextPage = pageNumber + 1;
        log(`Debounce 10s przed stroną ${nextPage}...`);
        await sleep(10000);
        await crawler.addRequests([{ url: buildUrl(nextPage) }]);
      }

      return;
    }

    // ===== STRONA OFERTY =====
    try {
      await page.waitForSelector("div#offer-details", { timeout: 5000 });
      const html = await page.$eval("div#offer-details", (el) => el.outerHTML);
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

// process.env.CRAWLEE_DISABLE_SYSTEM_INFO = "1";

import { PlaywrightCrawler } from "crawlee";
import fs from "fs";
import path from "path";

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// ====== LOGGER ======
const LOG_FILE = "./htmlWithParams.log";

function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, line, "utf-8");
  console.log(message);
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
const MAX_PAGES = 3;
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

  async requestHandler({ request, page, enqueueLinks, crawler }) {
    // ===== STRONA LISTINGOWA =====
    const isListingPage = await page.$("div.offers");

    if (isListingPage) {
      const url = new URL(request.url);
      const pageNumber = Number(url.searchParams.get("PageNumber"));
      const linksCount = await page.$$eval("div.offers a", (els) => els.length);

      if (pageNumber && pageNumber > MAX_PAGES) {
        log(`Pominięto stronę ${pageNumber} (MAX_PAGES=${MAX_PAGES})`);
        return;
      }

      await enqueueLinks({
        selector: "div.offers a[href*='/praca/']",
        strategy: "same-domain",
      });

      log(`Listing: strona ${pageNumber}, ofert: ${linksCount}`);

      if (!singlePageMode && linksCount > 0 && pageNumber < MAX_PAGES) {
        const nextPage = pageNumber + 1;

        log(`Debounce 5s przed stroną ${pageNumber}...`);
        await sleep(5000);

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
    } catch {
      log(`Brak div#offer-details na ${request.url}`);
    }
  },
});

// ====== START ======
await crawler.run([buildUrl(startPage)]);

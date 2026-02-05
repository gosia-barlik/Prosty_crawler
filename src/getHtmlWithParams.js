// process.env.CRAWLEE_DISABLE_SYSTEM_INFO = "1";

import { PlaywrightCrawler } from "crawlee";
import fs from "fs";
import path from "path";

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// ====== LoGGER ======
const LOG_FILE = "./htmlWithParams.log";

function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;

  fs.appendFileSync(LOG_FILE, line, "utf-8");
  console.log(message);
}

// ====== PARAMETRY Z CLI ======
const [, , year, month] = process.argv;
log(`START crawlera: year=${year}, month=${month}`);

if (!year || !month) {
  console.error("Użycie: node getHtmlWithParams.js <year> <month>");
  process.exit(1);
}

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
  async requestHandler({ request, page, enqueueLinks, crawler }) {
    // ===== STRONA LISTINGOWA =====
    const isListingPage = await page.$("div.offers");

    if (isListingPage) {
      const url = new URL(request.url);
      const pageNumber = Number(url.searchParams.get("PageNumber"));

      const linksCount = await page.$$eval("div.offers a", (els) => els.length);

      await enqueueLinks({
        selector: "div.offers a",
        strategy: "same-domain",
      });

      console.log(`Listing: strona ${pageNumber}, ofert: ${linksCount}`);
      log(`Listing: strona ${pageNumber}, ofert: ${linksCount}`);

      if (linksCount > 0 && pageNumber < MAX_PAGES) {
        const nextPage = pageNumber + 1;

        log(`Debounce 5s przed stroną ${nextPage}...`);
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

      console.log(`Zapisano ofertę: ${fileName}`);
      log(`Zapisano ofertę: ${fileName}`);
    } catch {
      console.log(`Brak div#offer-details na ${request.url}`);
      log(`Brak div#offer-details na ${request.url}`);
    }
  },
});

// ====== START ======
await crawler.run([buildUrl(1)]);

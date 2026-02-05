import { PlaywrightCrawler } from "crawlee";
import fs from "fs";
import path from "path";

// ====== PARAMETRY Z CLI ======
const [, , year, month, pageNumber] = process.argv;

if (!year || !month || !pageNumber) {
  console.error("Użycie: node crawler.js <year> <month> <pageNumber>");
  process.exit(1);
}

// ====== KONSTRUKCJA URL ======
const BASE_URL =  `https://archiwum.pracuj.pl/archive/offers?Year=${year}&Month=${month}&PageNumber=${pageNumber}`;
const OUTPUT_DIR = "./htmlWithParamsOutput";

// ====== KATALOG WYJŚCIOWY ======
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// ====== CRAWLER ======
const crawler = new PlaywrightCrawler({
  async requestHandler({ request, page, enqueueLinks }) {

    // Strona główna – zbieranie linków
    if (request.url === BASE_URL) {
      await page.waitForSelector("div.offers");

      await enqueueLinks({
        selector: "div.offers a",
        strategy: "same-domain",
        transformRequestFunction: (req) => {
          if (req.url !== BASE_URL) return req;
          return null;
        },
      });

      console.log("Zebrano linki z div.offers");
      return;
    }

    // Podstrony – zapis div#offer-details
    try {
      await page.waitForSelector("div#offer-details", { timeout: 5000 });

      const html = await page.$eval(
        "div#offer-details",
        (el) => el.outerHTML
      );

      const fileName =
        request.url
          .replace(/^https?:\/\//, "")
          .replace(/[^\w]/g, "_") + ".html";

      fs.writeFileSync(
        path.join(OUTPUT_DIR, fileName),
        html,
        "utf-8"
      );

      console.log(`Zapisano: ${fileName}`);
    } catch {
      console.log(`Brak div#offer-details na ${request.url}`);
    }
  },
});

// ====== START ======
await crawler.run([BASE_URL]);

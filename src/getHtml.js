import { PlaywrightCrawler, Dataset } from "crawlee";
import fs from "fs";
import path from "path";

const BASE_URL = "https://archiwum.pracuj.pl/archive/offers?Year=2025&Month=1&PageNumber=1";
const OUTPUT_DIR = "./htmlOutput";

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

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

      const html = await page.$eval("div#offer-details", (el) => el.outerHTML);

      const fileName = request.url.replace(/^https?:\/\//, "").replace(/[^\w]/g, "_") + ".html";

      fs.writeFileSync(path.join(OUTPUT_DIR, fileName), html, "utf-8");

      console.log(`Zapisano: ${fileName}`);
    } catch (err) {
      console.log(`Brak div#offer-details na ${request.url}`);
    }
  },
});

await crawler.run([BASE_URL]);

// INFO  PlaywrightCrawler: Final request statistics: {"requestsFinished":52,"requestsFailed":0,"retryHistogram":[27,12,9,4],"requestAvgFailedDurationMillis":null,"requestAvgFinishedDurationMillis":3955,"requestsFinishedPerMinute":48,"requestsFailedPerMinute":0,"requestTotalDurationMillis":205660,"requestsTotal":52,"crawlerRuntimeMillis":65023}
// INFO  PlaywrightCrawler: Finished! Total 52 requests: 52 succeeded, 0 failed. {"terminal":true}
// 3,427 min
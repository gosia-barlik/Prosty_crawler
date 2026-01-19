import { PlaywrightCrawler, Dataset } from "crawlee";

console.log("Crawler startuje...");

const START_PAGES = Array.from({ length: 10 }, (_, i) => 
  `https://www.pracuj.pl/praca${i === 0 ? "" : `?pn=${i + 1}`}`
);

const crawler = new PlaywrightCrawler({
  headless: true,
  maxRequestsPerCrawl: 500,
  maxConcurrency: 3,

  async requestHandler({ page, request, log, enqueueLinks }) {
    log.info(`Otwieram: ${request.url}`);

    await page.waitForLoadState("networkidle");

    const bodyFirst500 = await page.evaluate(() => {
      return document.body.innerText.replace(/\s+/g, " ").slice(0, 500);
    });

    console.log("──────────────");
    console.log(request.url);
    console.log(bodyFirst500);

    await Dataset.pushData({
      url: request.url,
      preview: bodyFirst500,
    });

    // zbieranie linków z każdej strony 
    await enqueueLinks({
      selector: "a",
      baseUrl: request.loadedUrl,
      strategy: "same-domain",
      globs: ["https://www.pracuj.pl/**"],
      exclude: [/\/konto/, /\/login/, /\/regulamin/, /\/polityka/],
    });
  },
});

await crawler.run(START_PAGES);

await Dataset.exportToCSV("wyniki.csv");

console.log("Crawler zakończył działanie – paginacja 1–10 + linki + CSV gotowe");

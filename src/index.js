import { PlaywrightCrawler } from "crawlee";

console.log("Crawler startuje...");

const crawler = new PlaywrightCrawler({
  headless: true,
  maxRequestsPerCrawl: 20,
  maxConcurrency: 3, // kilka przeglądarek równocześnie

  async requestHandler({ page, request, log }) {
    log.info(`Otwieram: ${request.url}`);

    //przy założeniu, że znamy atrybut albo selektor
    await page.waitForSelector('[data-test="section-offers"]', { timeout: 10000 });
    const offersHTML = await page.$eval('[data-test="section-offers"]', (el) => el.innerHTML);
    console.log("Zawartość diva data-test=section-offers:");
    console.log(offersHTML);
  },
});

await crawler.run(["https://www.pracuj.pl/praca"]);

console.log("Crawler zakończył działanie");

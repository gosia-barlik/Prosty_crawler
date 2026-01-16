import { PlaywrightCrawler } from "crawlee";

console.log("Crawler startuje...");

const crawler = new PlaywrightCrawler({
  headless: true,
  maxRequestsPerCrawl: 20,
  maxConcurrency: 3,

  //nie znamy selektora, bierzemy body
  async requestHandler({ page, request, log }) {
    log.info(`Otwieram: ${request.url}`);

    await page.waitForLoadState("domcontentloaded");

    const bodyFirst2000 = await page.evaluate(() => {
      return document.body.innerText.slice(0, 2000);
    });

    console.log("Pierwsze 2000 znaków body:");
    console.log(bodyFirst2000);
  },

  // przy założeniu, że znamy atrybut albo selektor
  //   async requestHandler({ page, request, log }) {
  //     log.info(`Otwieram: ${request.url}`);

  //     await page.waitForSelector('[data-test="section-offers"]', { timeout: 10000 });
  //     const offersHTML = await page.$eval('[data-test="section-offers"]', (el) => el.innerHTML);
  //     console.log("Zawartość diva data-test=section-offers:");
  //     console.log(offersHTML);
  //   },
});
await crawler.run(["https://www.pracuj.pl/praca/inzynier-w-dziale-technicznym-m-k-lodz,oferta,1004569218"]);
// await crawler.run(["https://www.pracuj.pl/praca"]);

console.log("Crawler zakończył działanie");

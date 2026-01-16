import { PlaywrightCrawler } from "crawlee";

console.log("Crawler startuje...");

//przy założeniu, że znamy atrybut albo selektor
const crawler = new PlaywrightCrawler({
  headless: true,
  maxRequestsPerCrawl: 20,
  maxConcurrency: 3, // kilka przeglądarek równocześnie

  async requestHandler({ page, request, log }) {
    log.info(`Otwieram: ${request.url}`);

    await page.waitForSelector('[data-test="section-offers"]', { timeout: 10000 });
    const offersHTML = await page.$eval('[data-test="section-offers"]', (el) => el.innerHTML);
    console.log("Zawartość diva data-test=section-offers:");
    console.log(offersHTML);
  },
});

//nie znamy selektora, bierzemy body
// const crawler = new PlaywrightCrawler({
//   headless: true,
//   maxRequestsPerCrawl: 20,
//   maxConcurrency: 3,

//   async requestHandler({ page, request, log }) {
//     log.info(`Otwieram: ${request.url}`);

//     await page.waitForLoadState('domcontentloaded');

//     const bodyFirst500 = await page.evaluate(() => {
//       return document.body.innerText.slice(0, 500);
//     });

//     console.log('Pierwsze 500 znaków body:');
//     console.log(bodyFirst500);
//   },
// });

await crawler.run(["https://www.pracuj.pl/praca"]);

console.log("Crawler zakończył działanie");

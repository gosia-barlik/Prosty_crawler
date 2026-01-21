import { PlaywrightCrawler } from 'crawlee';
import fs from 'fs';
import path from 'path';

const BASE_URL = "https://archiwum.pracuj.pl/archive/offers?Year=2025&Month=1&PageNumber=1";
const OUTPUT_DIR = './innerTextOutput';

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

const crawler = new PlaywrightCrawler({
    async requestHandler({ request, page, enqueueLinks }) {

        // Strona główna – zbieranie linków
        if (request.url === BASE_URL) {
            await page.waitForSelector('div.offers');

            await enqueueLinks({
                selector: 'div.offers a',
                strategy: 'same-domain',
                transformRequestFunction: (req) => {
                    if (req.url !== BASE_URL) return req;
                    return null;
                },
            });

            console.log('Zebrano linki z div.offers');
            return;
        }

        // Podstrony – zapis innerText z div#offer-details
        try {
            await page.waitForSelector('#offer-details', { timeout: 5000 });

            const text = await page.$eval(
                '#offer-details',
                el => el.innerText.trim()
            );

            // logowanie (zwracanie wyniku)
            console.log(`\n=== ${request.url} ===\n`);
            console.log(text);

            const fileName = request.url
                .replace(/^https?:\/\//, '')
                .replace(/[^\w]/g, '_') + '.txt';

            fs.writeFileSync(
                path.join(OUTPUT_DIR, fileName),
                text,
                'utf-8'
            );

        } catch (err) {
            console.log(`Brak div#offer-details na ${request.url}`);
        }
    },
});

await crawler.run([BASE_URL]);

// INFO  PlaywrightCrawler: Final request statistics: {"requestsFinished":51,"requestsFailed":1,"retryHistogram":[27,12,3,10],"requestAvgFailedDurationMillis":674,"requestAvgFinishedDurationMillis":2929,"requestsFinishedPerMinute":58,"requestsFailedPerMinute":1,"requestTotalDurationMillis":150078,"requestsTotal":52,"crawlerRuntimeMillis":53194}
// INFO  PlaywrightCrawler: Error analysis: {"totalErrors":1,"uniqueErrors":1,"mostCommonErrors":["1x: Request blocked - received 403 status code. 
// INFO  PlaywrightCrawler: Finished! Total 52 requests: 51 succeeded, 1 failed. {"terminal":true}
// 2,5013 min
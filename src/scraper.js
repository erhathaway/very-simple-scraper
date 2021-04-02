const moment = require("moment");
require("moment-precise-range-plugin");
const https = require("https");
const { performance } = require("perf_hooks");

/**
 * Iterate over row objects and scrape the row
 */
exports.fetchUrlFromProxyAndCache = (
  formProxyUrl,
  rows,
  apiKey,
  cache,
  domains,
  context = {
    originTime: performance.now(),
    totalLength: 0,
    totalInCache: 0,
    totalScraped: 0,
  }
) => {
  const totalRunTimeInMS = parseInt(performance.now() - context.originTime);
  const urlsProcessed = context.totalLength - rows.length;
  const urlsInCache = context.totalInCache;
  const urlsScraped = context.totalScraped;
  const speed =
    context.totalScraped !== 0
      ? parseInt(totalRunTimeInMS / 1000 / context.totalScraped)
      : 0;
  console.log("\n********************************************");
  console.log(`
          \nMetrics:
          \nOverview:
          Total: ${context.totalLength}
          Processed: ${urlsProcessed}
          Remaining: ${rows.length}
          \nCount:
          Total In Cache: ${urlsInCache} - ${parseInt(
    (urlsInCache / urlsProcessed) * 100
  )} %
          Total Scraped: ${urlsScraped} - ${parseInt(
    (urlsScraped / urlsProcessed) * 100
  )} %
          \nSpeed:
          Lifetime Speed: ${moment.preciseDiff(
            performance.now(),
            context.originTime
          )} -- ${totalRunTimeInMS} ms
          Scrape Speed: ${speed} sec/url
      `);
  console.log("********************************************\n");

  if (rows.length > 0) {
    try {
      const row = rows.shift();
      const { domain, kind, id } = row;
      const domainMistero = domains[domain][kind];

      console.log("\nWorking with: ", domain, kind, id);

      const domainSpecificPath = cache.formDomainSpecificCachePath(
        domain,
        kind,
        id
      );

      if (cache.hasCacheData(domainSpecificPath)) {
        console.log("Found cached data. Skipping!");
        const newTotalInCache = context.totalInCache + 1;
        return exports.fetchUrlFromProxyAndCache(
          formProxyUrl,
          rows,
          apiKey,
          cache,
          domains,
          { ...context, totalInCache: newTotalInCache }
        );
      } else {
        console.log("No cache data found");
      }

      const url = domainMistero.formScrapeUrlFromId(id);
      console.log("Url to scrape: ", url);
      if (apiKey == null || apiKey.length === 0) {
        throw new Error(
          "Missing proxy token. Supply one with the `token` option. For example:`node run.js scrape --token=A92QJCSDML13ZN7YB06N31MCL54W9USEL6O096TNM66M`"
        );
      }
      const proxyUrl = formProxyUrl(url, apiKey);

      let options = new URL(proxyUrl);

      console.log("Fetching data...");

      return https
        .request(options, (res) => {
          let data = "";
          res.on("data", (d) => {
            console.log("Found data...");
            data += d;
          });
          res.on("end", () => {
            console.log("Saving data...");
            cache.saveToCacheData(domainSpecificPath, data);
            console.log("Moving on...");
            const newTotalScraped = context.totalScraped + 1;
            exports.fetchUrlFromProxyAndCache(
              formProxyUrl,
              rows,
              apiKey,
              cache,
              domains,
              { ...context, totalScraped: newTotalScraped }
            );
          });
        })
        .end();
    } catch (error) {
      console.log(error);
    }
  }
  console.log("\nNo more urls found. Exiting");

  return;
};

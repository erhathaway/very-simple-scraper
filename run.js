const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const { spawnSync, execSync, exec, spawn } = require("child_process");

const csv = require("./src/csv");
const cache = require("./src/cache");
const cli = require("./src/cli");
const scraper = require("./src/scraper");
const utils = require("./src/utils");

exports.utils = utils;

const vsscraper = (domains, formProxyUrl = (u) => u) => {
  const command = cli.extractCommandCLIArg();

  const token = cli.extractProxyTokenCLIArg(command);
  const outputSessionName = cli.extractSessionNameCLIArg(command);
  const inputFileName = cli.extractInputFileCLIArg();
  const filter = cli.extractFilterCLIArg(command);
  const to = cli.extractToCLIArg();
  const from = cli.extractFromCLIArg();
  const parallelizeCount = cli.extractParallelizeCountCLIArg(command);

  if (command === "scrape") {
    csv.extractRowsFromCSV(
      inputFileName,
      (rows) => {
        if (to === -1) {
          rows = rows.slice(from);
        } else {
          rows = rows.slice(from, to + 1);
        }

        if (parallelizeCount) {
          console.log("parallelizing");
          const chunkSize = Math.ceil(rows.length / parallelizeCount);

          const scrapeCommandIndex = process.argv.indexOf("scrape");
          const options = process.argv.slice(scrapeCommandIndex + 1);
          const filteredOptions = options
            .filter((o) => {
              optionName = o.split("=")[0];
              return (
                optionName !== "--from" &&
                optionName !== "--to" &&
                optionName !== "--parallelize"
              );
            })
            .map((o) => {
              optionName = o.split("=")[0];
              optionValue = o.split("=")[1];
              const hasWords = optionValue.split(" ").length > 1;
              if (hasWords) return `${optionName}="${optionValue}"`;
              else {
                return `${optionName}=${optionValue}`;
              }
            });

          spawnSync("tmux", ["kill-session", "-t", "scraper"]);
          spawnSync("tmux", ["new-session", "-d", "-s", "scraper"]);
          for (i = 0; i < parallelizeCount; i++) {
            let min;
            let max;

            min = from + i * chunkSize;
            max = min + chunkSize - 1;

            if (min > to && to !== -1) {
              continue;
            }

            if (max > to && to !== -1) {
              max = to;
            }

            if (i - 1 === parallelizeCount && max < to) {
              max = to;
            }

            const windowName = `${min}-${max}`;
            spawnSync("tmux", ["new-window", "-n", windowName]);

            const command = `node run.js scrape --from=${min} --to=${max} ${filteredOptions.join(
              " "
            )}`;

            spawnSync("tmux", [
              "send-keys",
              "-t",
              windowName,
              "C-z",
              command,
              "Enter",
            ]);
          }
          console.log(
            "\n\nTo attach to the session enter: \n\ntmux attach-session -t scraper\n\n\n"
          );
        } else {
          const rowsToScrape = rows.map((row) => {
            if (row == null) {
              console.log("Missing url");
              throw new Error("Missing url");
            }
            return row;
          });

          console.log("\n");
          console.log("----------Starting Scrape-------------");
          console.log(`${rowsToScrape.length} urls to scrape\n`);

          console.log("\n");
          let callTime = performance.now();
          const originTime = performance.now();
          scraper.fetchUrlFromProxyAndCache(
            formProxyUrl,
            rowsToScrape,
            token,
            cache,
            domains,
            {
              originTime,
              callTime,
              totalLength: rows.length,
              totalInCache: 0,
              totalScraped: 0,
            }
          );
        }
      },
      filter
    );
  }

  if (command === "parse") {
    console.log("Parsing urls....");
    csv.extractRowsFromCSV(
      inputFileName,
      (rows) => {
        if (to === -1) {
          rows = rows.slice(from);
        } else {
          rows = rows.slice(from, to + 1);
        }

        console.log(`Found ${rows.length} rows to parse`);
        const outputData = rows.reduce(
          (acc, row) => {
            if (row == null) {
              throw new Error("Missing row");
            }
            const { domain, kind, id } = row;
            const outputFilename = `${domain}__${kind}`;
            const domainMistero = domains[domain][kind];

            const domainSpecificPath = cache.formDomainSpecificCachePath(
              domain,
              kind,
              id
            );
            if (cache.hasCacheData(domainSpecificPath)) {
              const data = cache.fetchCacheData(domainSpecificPath);

              const parsedData = domainMistero.parseData(data);
              if (!parsedData) {
                acc.missing.push(row);

                return acc;
              }
              const { payload, inputs } = parsedData;

              if (payload) {
                p = acc.present[outputFilename] || [];
                p.push(payload);
                acc.present[outputFilename] = p;
              } else {
                acc.missing.push(row);
              }

              if (inputs) {
                acc.inputs.push(...inputs);
              }
            } else {
              console.log(
                `Found no cached data for: ${outputFilename} with id: ${id}.... \n Run the scraper first`
              );
            }
            return acc;
          },
          { present: {}, missing: [], inputs: [] }
        );

        if (outputSessionName == null) {
          throw new Error(
            "Missing output session name. Set it using the `--session` option"
          );
        }
        const outputFolder = path.join("scraped", "output", outputSessionName);

        fs.mkdirSync(outputFolder, { recursive: true });

        Object.keys(outputData.present).forEach((outputFileName) => {
          const parsedDataRows = outputData.present[outputFileName];
          const [domain, kind] = outputFileName.split("__");

          const domainMistero = domains[domain][kind];

          const csvWriter = createCsvWriter({
            path: path.join(outputFolder, `${outputFileName}.csv`),
            header: domainMistero.csvShape,
          });

          csvWriter
            .writeRecords(parsedDataRows)
            .then(() =>
              console.log(
                `\n\n${parsedDataRows.length} urls were parsed.\nParsed data was written to the CSV file at ${outputFileName}.\n\n`
              )
            );
        });

        const missingPath = path.join(outputFolder, `missing.csv`);

        const missingCSVWriter = createCsvWriter({
          path: missingPath,
          header: [
            { id: "domain", title: "domain" },
            { id: "kind", title: "kind" },
            { id: "id", title: "id" },
            { id: "originDomain", title: "originDomain" },
            { id: "originKind", title: "originKind" },
            { id: "originId", title: "originId" },
            { id: "context", title: "context" },
          ],
        });

        missingCSVWriter
          .writeRecords(outputData.missing)
          .then(() =>
            console.log(
              `\n\n${outputData.missing.length} urls were Missing.\nMissing info was written to the CSV file at ${missingPath}.\n\n`
            )
          );

        const inputsPath = path.join(outputFolder, `inputs.csv`);

        const inputCSVWriter = createCsvWriter({
          path: inputsPath,
          header: [
            { id: "domain", title: "domain" },
            { id: "kind", title: "kind" },
            { id: "id", title: "id" },
            { id: "originDomain", title: "originDomain" },
            { id: "originKind", title: "originKind" },
            { id: "originId", title: "originId" },
            { id: "context", title: "context" },
          ],
        });

        inputCSVWriter
          .writeRecords(outputData.inputs)
          .then(() =>
            console.log(
              `\n\n${outputData.inputs.length} new inputs found.\Input info was written to the CSV file at ${inputsPath}.\n\n`
            )
          );
      },
      filter
    );
  }
};

exports.scraper = vsscraper;

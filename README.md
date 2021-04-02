# Very Simple Scraper

## Overview

This library exposes a scraper function that can be used to quickly build scrapers. 

Typical usage looks like:

### 1. Install the scraper as a dependency in your scraper project

```
npm i very-simple-scraper
```

### 2. Call the `scraper` function exposed by the library.

```
// run.js

const scraper = require('very-simple-scraper').scraper;
const domains = require("./domains");

const formProxyUrl = (urlToScrape, apiKey) =>
  `https://someproxyservice/?key=${apiKey}&url=${urlToScrape}`;

scraper(domains, formProxyUrl)
```

#### The `scraper` function has the signature: 
   
```
   (
     domains: DomainObj, 
     formProxyUrl?: (urlToScrape: string, apiKey?: string) => url
   ) => null
```

#### The `DomainObj` looks like:

```
  { domainName: {
      kindName: {
          csvShape: [{ id: string, title: string }],
          formScrapeUrlFromId: (id) => string,
          parseData: (data: ResponseFromScrape) => ({ 
              payload: ObjectMatchingCsvShape, 
              links: [LinkObj] 
          }) | null
      }
  }}

```

> The purpose of the `DomainObj` is to define how each `domain` and domain `kind` is scraped and parsed.



### 3. Call the above `run.js` file with the `scrape` arg

> The scrape arg fetches the response objects associated with each constructed URL from the `input` file. These response objects are stored locally in the `./scraped/response_cache` folder.

```
node run.js scrape --token=TKM0D87U1XR98JD0F74RMULE7GMLYDVY2O --input=./input.csv --from=20 --to=100 --parallelize=10
```

### 4. Call the above `run.js` file with the `parse` arg

> The parse arg parses the response objects associated with each constructed URL from the `input` file. Objects are only parsed if they exist in the `./scraped/response_cache` folder. The parsed output is stored in `./scraped/output/<session name>`

```
node run.js parse --input=input.csv --session=wiki_data_apr_1 --from=20 --to=100 
```

## Paradigm

This scraper separates out the `storage of responses` from the `parsing of responses`. Thus, using this scraper is a two step operation. First you `scrape` and then you `parse`:

```
node run.js scrape --token=TKM0D87U1XR98JD0F74RMULE7GMLYDVY2O --input=./input.csv
node run.js parse --session=mysession --input=./input.csv
```

When you run `parse` the output is another folder located at `./scraped/output/<session name>`. Inside this folder are files associated with `extracted data`, `missing data`, and `new inputs`.

The `new inputs` from a parse session can be used as inputs in a new scrape:

```
// run the first scrape & parse session
node run.js scrape --token=TKM0D87U1XR98JD0F74RMULE7GMLYDVY2O --input=./input.csv
node run.js parse --session=my_first_session --input=./input.csv

// use the parsed output's input in a new scrape & parse session
node run.js scrape --token=TKM0D87U1XR98JD0F74RMULE7GMLYDVY2O --input=./scraped/output/my_first_session/input.csv
node run.js parse --session=my_second_session --input=./scraped/output/my_first_session/input.csv
```

This pattern allows you to chain together scrape sessions in very specific ways.


## Inputs

The input csv file requires that you have a `domain`, `kind`, and `id` header.

> Make sure the csv file has the headers present as the first line of the file

```csv
domain,kind,id
wikipedia,homepage,''
wikipedia,wiki,Ever_Given
wikipedia,wiki,COVID-19_pandemic
```

Optionally, you may also provide a `originDomain`, `originKind`, `originId`, and `context`.

You can use the `filter` option below to filter on specific contexts.

When you generate parse session output, you will often see a `inputs.csv` file in the folder. This file contains inputs found when parsing whatever data you ran it over. It is common to use this new `inputs.csv` as a input for a brand new `scrape` and `parse` session.

## Scraping

Data is scraped from a domain and saved in a local html cache folder. Data in this folder can than be parsed with the other command.

### Args

You must specify: `token` and `input` command line arguments.

- `token` : the ScrapingBee token
- `input` : the input csv file. A header with `url` must exist in this file.

You may specify: `from`, `to`, `filter`, and `parallelize` command line argument.

- `from` : start at the `from` row number in the input CSV. Ex: `--from=10`
- `to` : end at the `to` row number in the input CSV. Ex: `--to=90`
- `filter`: Filter by a domain kind's context. Ex: `--filter="wiki link"`. Filters can use the union operator. For example: `--filter="wiki link|reference link"`
- `parallelize`: run the scraper in Tmux in N parallel sessions. Each session is a window named after the chunk it is processing. Ex: `--parallelize=3` will run 3 sessions. If there are 9 rows, the windows will be named `0-2`, `3-5`, and `6-8`.

### Example

```sh
node run.js scrape --token=MYTOKEN --input=input.csv --to=5
```

## Parsing

### Args

You must specify: `input` and `output` command line arguments.

- `input` : the input csv file. A header with `url` must exist in this file.
- `session` : the output session name. Output files will be written to `scraped/output/<session name>/*`

You may specify: `from`, `to` and `filter` command line argument.

- `from` : start at the `from` row number in the input CSV. Ex: `--from=10`
- `to` : end at the `to` row number in the input CSV. Ex: `--to=90`
- `filter`: Filter by a domain kind's context. Ex: `--filter="wiki link"`. Filters can use the union operator. For example: `--filter="wiki link|reference link"`

### Examples

#### Parse the fist 500 rows of a CSV

```sh
node run.js parse --input=input.csv --session=wiki_data_apr_1 --to=500
```

#### Parse the first 10 rows and filter for rows that have the context `reference link`

```sh
node run.js parse --input=scraped/output/out2/inputs.csv --session=out3 --to=10 --filter="reference link"
```

#### Scrape rows 20 to 100 across 10 sessions in parallel

```sh
node run.js scrape --token=TKM0D87U1XR98JD0F74RMULE7GMLYDVY2O --input=input.csv --from=20 --to=100 --parallelize=10
```

#### Scrape everything in the input csv across 10 sessions in parallel

```sh
node run.js scrape --token=TKM0D87U1XR98JD0F74RMULE7GMLYDVY2O --input=input.csv --parallelize=10
```

# Very Simple Scraper

## Overview

This repo contains a scraper and parser that both work on a specified `input` csv file. First you `scrape` the rows in the file. Then you `parse` the scraped response associated with each row. The `parse` command generates a parse session folder. In this folder you will find files associated with extracted data, missing data, and new inputs.

## Initial setup

```
npm i very-simple-scraper
```

```
const scraper = require('very-simple-scraper').scraper;
const domains = require("./domains");

const formProxyUrl = (urlToScrape, apiKey) =>
  `https://someproxyservice/?key=${apiKey}&url=${urlToScrape}`;

scraper(domains, formProxyUrl)
```

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

#### Parse the first 10 rows and filter for rows that have the context `tag media`

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

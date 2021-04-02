const findArg = (argv, argName) => {
  return argv.find((arg) => {
    const currentArg = arg.split("=")[0];
    return currentArg === argName;
  });
};

const hasArg = (argv, argName) => {
  return argv.find((arg) => arg == argName);
};

exports.extractProxyTokenCLIArg = (command) => {
  if (command === "scrape") {
    const tokenArg = findArg(process.argv, "--token");
    if (!tokenArg) {
      console.log("Specify a proxy token with: `node run.js --token=MYTOKEN`");
      return;
    }
    const token = tokenArg.split("=")[1];
    if (!token) {
      console.log("Specify a proxy token with: `node run.js --token=MYTOKEN`");
      return;
    }
    return token;
  }
};

exports.extractParallelizeCountCLIArg = (command) => {
  if (command === "scrape") {
    const countArg = findArg(process.argv, "--parallelize");
    if (!countArg) {
      return;
    }
    const count = countArg.split("=")[1];
    if (!count) {
      console.log(
        "Specify a parallelize count with: `node run.js --parallelize=10`"
      );
      return;
    }
    return parseInt(count);
  }
};

exports.extractSessionNameCLIArg = (command) => {
  const isParseCommand = command === "parse";

  const tokenArg = findArg(process.argv, "--session");
  if (!tokenArg && isParseCommand) {
    console.log(
      "Specify a parse session name: `node run.js parse --session=wiki_data_apr_1`"
    );
    return;
  }
  if (tokenArg && !isParseCommand) {
    throw new Error(
      `--session option specified, but ${command} does not support it. Only the parse command uses a session name.`
    );
  }
  if (tokenArg && isParseCommand) {
    const token = tokenArg.split("=")[1];
    if (!token) {
      console.log(
        "Specify a parse session name: `node run.js parse --session=wiki_data_apr_1`"
      );
      return;
    }
    return token;
  }
  return null;
};

exports.extractFilterCLIArg = (command) => {
  const isParseOrScrapeCommand = command === "parse" || command === "scrape";

  const tokenArg = findArg(process.argv, "--filter");
  if (!tokenArg && isParseOrScrapeCommand) {
    return;
  }
  if (tokenArg && !isParseOrScrapeCommand) {
    throw new Error(
      `--filter option specified, but ${command} does not support it. Only the parse or scrape command uses a filter option.`
    );
  }
  if (tokenArg && isParseOrScrapeCommand) {
    const token = tokenArg.split("=")[1];
    if (!token) {
      console.log(
        'Error specifying a parse filter option. Try this format: `node run.js parse --filter="wiki links|wiki references"`'
      );
      return;
    }
    return token.split("|");
  }
  return null;
};

exports.extractInputFileCLIArg = () => {
  const tokenArg = findArg(process.argv, "--input");
  if (!tokenArg) {
    console.log(
      "Specify a input csv file name with a `url` header: `node run.js scrape --input=input.csv`"
    );
    return;
  }
  const token = tokenArg.split("=")[1];
  if (!token) {
    console.log(
      "Specify a input csv file name with a `url` header: `node run.js scrape --input=input.csv`"
    );
    return;
  }
  return token;
};

exports.extractCommandCLIArg = () => {
  const isScrapeCommand = hasArg(process.argv, "scrape");
  if (isScrapeCommand) {
    return "scrape";
  }
  const isParseCommand = hasArg(process.argv, "parse");
  if (isParseCommand) {
    return "parse";
  }

  console.log(
    "Specify either a `scrape` or `parse` command: `node run.js scrape --input=input.csv`"
  );
};

exports.extractToCLIArg = () => {
  const tokenArg = findArg(process.argv, "--to");
  if (!tokenArg) {
    return -1;
  }
  const token = tokenArg.split("=")[1];
  if (!token) {
    console.log(
      "Specify a start after position for the current csv file name with a `to` option: `node run.js --to=500`"
    );
    return -1;
  }
  return parseInt(token);
};
exports.extractFromCLIArg = () => {
  const tokenArg = findArg(process.argv, "--from");
  if (!tokenArg) {
    return 0;
  }
  const token = tokenArg.split("=")[1];
  if (!token) {
    console.log(
      "Specify a start after position for the current csv file name with a `from` option: `node run.js --from=500`"
    );
    return 0;
  }
  return parseInt(token);
};

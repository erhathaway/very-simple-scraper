const fs = require("fs");
const csv = require("fast-csv");
const path = require("path");

/**
 * Read url from csv file
 */
exports.extractRowsFromCSV = (fileLocation, onFinish, filter = []) => {
  const rows = [];

  fs.createReadStream(path.resolve(process.cwd(), fileLocation))
    .pipe(csv.parse({ headers: true }))
    .on("error", (error) => console.error(error))
    .on("data", (row) => {
      domain = row["domain"];
      kind = row["kind"];
      id = row["id"];
      originDomain = row["originDomain"];
      originKind = row["originKind"];
      originId = row["originId"];
      context = row["context"];
      row = { domain, kind, id, originDomain, originKind, originId, context };
      if (
        domain == null ||
        kind == null ||
        id == null ||
        domain === "" ||
        kind === "" ||
        id === ""
      ) {
        throw new Error(`Missing domain, kind, or id: ${JSON.stringify(row)}`);
      }

      if (filter.length > 0) {
        // console.log(filter.includes(row.context), row.context, filter)
        if (filter.includes(row.context)) {
          rows.push(row);
        }
      } else {
        rows.push(row);
      }
    })
    .on("end", () => {
      onFinish(rows);
    });

  return rows;
};

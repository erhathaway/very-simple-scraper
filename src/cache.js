const path = require("path");
const fs = require("fs");

const CONTENT_CACHE_PATH = "scraped/response_cache";

exports.formDomainSpecificCachePath = (domain, kind, id) => {
  const subfolder = id.substring(0, 2).toLowerCase();
  return `${domain}/${kind}/${subfolder}/${id}`;
};

exports.hasCacheData = (domainSpecificPath) => {
  const p = path.resolve(process.cwd(), CONTENT_CACHE_PATH, domainSpecificPath);
  return fs.existsSync(p);
};

exports.fetchCacheData = (domainSpecificPath) => {
  const p = path.resolve(process.cwd(), CONTENT_CACHE_PATH, domainSpecificPath);

  const f = fs.readFileSync(p, "utf8");
  return f;
};

exports.saveToCacheData = (domainSpecificPath, data) => {
  const p = path.resolve(process.cwd(), CONTENT_CACHE_PATH, domainSpecificPath);
  const p_without_data = p.split("/").slice(0, -1).join("/");

  fs.mkdirSync(p_without_data, { recursive: true });

  fs.writeFileSync(p, data, function (err, data) {
    if (err) {
      return console.log(err);
    }
    console.log(`Saved cache at path: ${p}`);
  });
};

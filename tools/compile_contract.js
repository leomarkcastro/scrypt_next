const path = require("path");
const { compileContract, compile } = require("scryptlib");

function compileContractCounter(fileName, options) {
  const filePath = path.join(__dirname, "contracts", fileName);
  console.log(filePath);
  const out = path.join(__dirname, "out");
  console.log(out);

  const result = compileContract(
    filePath,
    options
      ? options
      : {
          out: out,
          sourceMap: true,
          artifact: true,
        }
  );

  console.log(result);
  if (result.errors.length > 0) {
    console.log(`Compile contract ${filePath} failed: `, result.errors);
    throw result.errors;
  }

  // export result as json
  const json = JSON.stringify(result, null, 2);
  const jsonPath = path.join(out, fileName + ".json");
  console.log("jsonPath: ", jsonPath);

  const fs = require("fs");
  fs.writeFileSync(jsonPath, json, "utf8", function (err) {
    if (err) {
      return console.log(err);
    }
  });

  return result;
}

compileContractCounter("counter.scrypt");

module.exports = { compileContract };

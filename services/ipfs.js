const ipfsAPI = require("ipfs-api");
const config = require("../config");
const ipfs = ipfsAPI(config.ipfs.url, config.ipfs.port, { protocol: "https" });
var Duplex = require("stream").Duplex;

function BufferToStream(buffer) {
  const stream = new Duplex();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

const Download = (res, buffer) => {
  return new Promise((resolve, reject) => {
    return BufferToStream(buffer)
      .pipe(res)
      .on("error", (error) => {
        res.sendStatus(404);
        resolve();
      })
      .on("finish", function () {
        console.log("done");
        resolve();
      })
      .on("end", function () {
        console.log("end");
        resolve();
      });
  });
};

const GetFile = async (ipfsName) => {
  const files = await ipfs.files.get(ipfsName);
  return files[0].content;
};

const AddFile = async (fileBuffer) => {
  return await ipfs.files.add(fileBuffer)[0].hash;
};

module.exports = {
  Download,
  GetFile,
  AddFile,
};

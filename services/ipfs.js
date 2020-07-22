const ipfsAPI = require("ipfs-api");
const config = require("../config");
const ipfs = ipfsAPI(config.ipfs.url, config.ipfs.port, { protocol: "https" });
const Duplex = require("stream").Duplex;

const Download = (res, buffer) => {
  function BufferToStream(buffer) {
    const stream = new Duplex();
    stream.push(buffer);
    stream.push(null);
    return stream;
  }
  return new Promise((resolve, reject) => {
    return BufferToStream(buffer)
      .pipe(res)
      .on("error", (error) => {
        reject(error);
      })
      .on("finish", function () {
        resolve();
      })
      .on("end", function () {
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

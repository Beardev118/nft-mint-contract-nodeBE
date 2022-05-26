const fs = require("fs");
const EthereumTx = require("ethereumjs-tx").Transaction;
const WAValidator = require("wallet-address-validator");

const NFTData = function (mintedNFT) {
  this.tokenId = mintedNFT.tokenId;
  this.metadata = JSON.parse(mintedNFT.tokenUri);
  this.owner = mintedNFT.owner;
  this.attachedText = mintedNFT.attachedText;
};

function routes(web3, app, pinata, upload, nftList, contractAddress) {
  app.post("/nftmint", upload.single("nftfile"), async function (req, res) {
    const reqData = req.body;

    if (req.file === undefined) {
      return res.status(400).json({
        status: 400,
        message: "Please attach the image or text file.",
      });
    }

    const valid = WAValidator.validate(reqData.mintTo, "ETH");

    if (!valid) {
      return res.status(400).json({
        status: 400,
        message: "Please send the nft owner wallet address",
      });
    }

    if (reqData.name === undefined || reqData.name.length === 0) {
      return res.status(400).json({
        status: 400,
        message: "Please enter the nft name.",
      });
    }

    const mimetype = req.file.mimetype;
    const fileSize = req.file.size;

    const metaData = {};
    metaData.name = reqData.name;
    metaData.image = "";
    metaData.description =
      reqData.description !== undefined ? reqData.description : "";
    metaData.attachedText = "";

    if (
      mimetype === "image/png" ||
      mimetype === "image/jpeg" ||
      mimetype === "image/gif"
    ) {
      if (fileSize > 10000000) {
        return res
          .status(400)
          .json({ status: 400, message: "Image file size is less than 10MB." });
      } else {
        const readableStreamForFile = fs.createReadStream(req.file.path);
        const options = {
          pinataMetadata: {
            name: reqData.name,
            description:
              reqData.description !== undefined ? reqData.description : " ",
          },
        };
        const pinataRes = await pinata.pinFileToIPFS(
          readableStreamForFile,
          options
        );
        metaData.image =
          "https://gateway.pinata.cloud/ipfs/" + pinataRes.IpfsHash;
      }
    } else if (mimetype === "text/plain") {
      if (fileSize > 1024) {
        return res
          .status(400)
          .json({ status: 400, message: "Text file size is less than 1kB." });
      } else {
        const data = fs.readFileSync(req.file.path, "utf8");
        metaData.attachedText = data;
      }
    } else {
      return res
        .status(400)
        .json({ status: 400, message: "Please check the file type." });
    }

    fs.unlink(`./${req.file.path}`, (err) => {
      if (err) throw err;
      console.log("path/file.txt was deleted");
    });

    // const tokenId = await nftList.methods
    //   .createToken(reqData.mintTo, JSON.stringify(metaData))
    //   .send({ from: "0x135455ABCb36d6DC4A24f505C67f3BEEC82A5b32" });

    const account1 = "0x135455abcb36d6dc4a24f505c67f3beec82a5b32";
    web3.eth.defaultAccount = account1;

    const privateKey1 = Buffer.from(
      "b451a3558b6a3a9937d625c2e2a12fbc7dd3d5b5bd1e2f541cf56b4f2c93eaed",
      "hex"
    );

    const myData = nftList.methods
      .createToken(reqData.mintTo, JSON.stringify(metaData))
      .encodeABI();

    web3.eth.getTransactionCount(account1, async (_err, txCount) => {
      // Build the transaction
      const txObject = {
        nonce: web3.utils.toHex(txCount),
        to: contractAddress,
        value: web3.utils.toHex(web3.utils.toWei("0", "ether")),
        gasLimit: web3.utils.toHex(2100000),
        gasPrice: web3.utils.toHex(web3.utils.toWei("6", "gwei")),
        data: myData,
      };
      // Sign the transaction
      const tx = new EthereumTx(txObject, { chain: "rinkeby" });
      tx.sign(privateKey1);

      const serializedTx = tx.serialize();
      const raw = "0x" + serializedTx.toString("hex");

      // Broadcast the transaction
      const transaction = await web3.eth.sendSignedTransaction(raw);
      res.json(transaction);
    });
  });

  app.get("/nftmint", async (req, res) => {
    const options = {
      fromBlock: 0,
      toBlock: "latest",
    };

    const rest = await nftList.getPastEvents("NftCreated", options);

    let result = [];
    if (rest.length > 0) {
      result = rest.map((data) => {
        return new NFTData(data.returnValues);
      });
    }

    res.json(result);
  });

  app.get("/nftmint/:tokenId", async (req, res) => {
    const options = {
      filter: {
        tokenId: req.params.tokenId,
      },
      fromBlock: 0,
      toBlock: "latest",
    };

    const result = await nftList.getPastEvents("NftCreated", options);

    let nftItem = {};
    if (result.length > 0) {
      nftItem = new NFTData(result[0].returnValues);
    }
    res.json(nftItem);
  });
}

module.exports = routes;

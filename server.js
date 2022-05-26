require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const routes = require("./routes");
const Web3 = require("web3");
const CONTACT_ABI = require("./config");
const CONTACT_ADDRESS = require("./config");
const bodyParser = require("body-parser");
const pinataSDK = require("@pinata/sdk");
const pinata = pinataSDK(
  process.env.PINATA_APIKEY,
  process.env.PINATA_SECRETKEY
);

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// if (typeof web3 !== "undefined") {
//   var web3 = new Web3(web3.currentProvider);
// } else {
const web3 = new Web3(
  new Web3.providers.HttpProvider(process.env.DEPLOY_KEY_RINKEBY)
);
// }

web3.eth.getAccounts().then((accounts) => {
  const nftList = new web3.eth.Contract(
    CONTACT_ABI.CONTACT_ABI,
    CONTACT_ADDRESS.CONTACT_ADDRESS
  );

  routes(web3, app, pinata, upload, nftList, CONTACT_ADDRESS.CONTACT_ADDRESS);

  app.listen(process.env.PORT || 3001, () => {
    console.log("listening on port " + (process.env.PORT || 3001));
  });
});

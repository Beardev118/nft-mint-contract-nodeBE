import { expect } from "chai";
import { ethers } from "hardhat";

describe("NFT", function () {
  it("Should be built", async function () {
    const NFT = await ethers.getContractFactory("NFT");
    const nft = await NFT.deploy();
    await nft.deployed();
    const nftAddress = nft.address;
    console.log("contract address :: ", nftAddress);

    await nft.createToken("https://aa.aa");
    await nft.createToken("https://bb.bb");

    const nftCount = await nft.getCount();
    console.log("nft count:: ", nftCount);
    expect(nftCount).equal(2);
  });
});

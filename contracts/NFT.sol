// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    event NftCreated(uint256 indexed tokenId, string tokenUri, address owner);

    constructor() ERC721("Atato Tokens", "ATT"){
    }

    function createToken(address mintTo, string memory tokenUri) public returns (uint) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();

        _mint(mintTo, newItemId);
        _setTokenURI(newItemId, tokenUri);

        emit NftCreated(newItemId, tokenUri, mintTo);
        return newItemId;
    }

    function getCount() public view returns (uint256) {
        return _tokenIds.current();
    }
}



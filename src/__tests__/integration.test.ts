import { expect } from "chai";
import { EthereumProvider } from "../services/ethereum.service.js";
import { TezosProvider } from "../services/tezos.service.js";

// These tests must not run outside of a local environment
describe.skip("Integration Tests", function () {
  this.timeout(50000);

  describe("Ethereum", () => {
    const provider = new EthereumProvider({
      blockchain: "ethereum",
      url: "http://localhost:8545",
    });

    it("gets the balance of '0xc797A0025a36f70654adAAC16af1751cC06EFcaD'", async () => {
      // 1000 ETH on fresh node
      expect(await provider.getBalance("0xc797A0025a36f70654adAAC16af1751cC06EFcaD")).to.deep.equal({
        balance: "1000000000000000000000",
        unit: "wei",
      });
    });

    it("deploys a contract and reads its state", async () => {
      const code = `// SPDX-License-Identifier: MIT
// compiler version must be greater than or equal to 0.8.24 and less than 0.9.0
pragma solidity ^0.8.24;

contract AgeContract {
    uint256 public age = 30;
}`;

      const receipt = await provider.deploy({ code }, "8120f6b018e852dd4f8db58be93e04f951d00cff399741824fce5167d63665d0");

      expect(receipt).to.have.keys("address", "txHash", "gasUsed");

      expect(await provider.call({ code, address: receipt.address, entrypoint: "age" })).to.equal("0x000000000000000000000000000000000000000000000000000000000000001e"); // 30, 32-bytes hex encoded
    });

    it("deploys a contract with parameters, changes and reads its state", async () => {
      const code = `// SPDX-License-Identifier: MIT
// compiler version must be greater than or equal to 0.8.24 and less than 0.9.0
pragma solidity ^0.8.24;

contract AgeContract {
    uint256 public age;
    constructor(uint256 _age) { age = _age; }
    function setAge(uint256 _age) public { age = _age; }
    function getAge() public view returns (uint256) { return age; }
}`;

      const receipt = await provider.deploy({ code, parameters: [30] }, "8120f6b018e852dd4f8db58be93e04f951d00cff399741824fce5167d63665d0");

      expect(receipt).to.have.keys("address", "txHash", "gasUsed");

      expect(await provider.call({ code, address: receipt.address, entrypoint: "getAge" })).to.equal("0x000000000000000000000000000000000000000000000000000000000000001e"); // 30, 32-bytes hex encoded
      expect(await provider.send({ code, address: receipt.address, entrypoint: "setAge", parameters: [60] }, "8120f6b018e852dd4f8db58be93e04f951d00cff399741824fce5167d63665d0")).to.have.keys("txHash", "gasUsed");
      expect(await provider.call({ code, address: receipt.address, entrypoint: "getAge" })).to.equal("0x000000000000000000000000000000000000000000000000000000000000003c"); // 60, 32-bytes hex encoded
    });
  });

  describe("Tezos", () => {
    const provider = new TezosProvider({
      blockchain: "tezos",
      url: "http://localhost:8732",
    });

    it("gets the balance of 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb'", async () => {
      // 2000000 XTZ on a fresh node
      expect(await provider.getBalance("tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb")).to.deep.equal({
        balance: "2000000000000",
        unit: "µꜩ",
      });
    });

    it("deploys a smart contract with an empty initial storage", async () => {
      expect(await provider.deploy({ code: `parameter (pair (string %firstname) (string %lastname));
storage string;
code {
       CAR;
       DUP;
       PUSH string " ";
       SWAP;
       CAR;
       CONCAT;
       DIP { CDR };
       CONCAT;
       NIL operation; PAIR;
     };`, parameters: [""] }, "edsk3RFfvaFaxbHx8BMtEW1rKQcPtDML3LXjNqMNLCzC3wLC1bWbAt")).to.have.keys("address", "txHash", "gasUsed");
    });

    it("deploys a smart contract with a non empty initial storage", async () => {
      expect(await provider.deploy({ code: `parameter (pair (string %firstname) (string %lastname));
storage string;
code {
       CAR;
       DUP;
       PUSH string " ";
       SWAP;
       CAR;
       CONCAT;
       DIP { CDR };
       CONCAT;
       NIL operation; PAIR;
     };`, parameters: ["Jean John"] }, "edsk3RFfvaFaxbHx8BMtEW1rKQcPtDML3LXjNqMNLCzC3wLC1bWbAt")).to.have.keys("address", "txHash", "gasUsed");
    });
  });
});

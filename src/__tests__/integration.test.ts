import { expect } from "chai";
import { EthereumProvider, TezosProvider } from "../services/blockchain.service.js";

// These tests must not run outside of a local environment
describe.skip("Integration Tests", () => {
  describe("Ethereum", () => {
    const provider = new EthereumProvider({
      blockchain: "ethereum",
      url: "http://localhost:8545",
    });

    it("gets the balance of '0xc797A0025a36f70654adAAC16af1751cC06EFcaD'", async () => {
      // 1000 ETH on fresh node
      expect(await provider.getBalance("0xc797A0025a36f70654adAAC16af1751cC06EFcaD")).to.equal("1000000000000000000000");
    });
  });

  describe("Tezos", () => {
    const provider = new TezosProvider({
      blockchain: "tezos",
      url: "http://localhost:8732",
    });

    it("gets the balance of 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb'", async () => {
      // 2000000 XTZ on a fresh node
      expect(await provider.getBalance("tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb")).to.equal("2000000000000");
    });
  });
});

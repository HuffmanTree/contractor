import { expect } from "chai";
import type { TezosProfile } from "../../models/profile.model.js";
import { BlockchainProviderFactory, EthereumProvider, TezosProvider } from "../../services/blockchain.service.js";

describe("Blockchain Provider Factory", () => {
  it("fails to create a provider from an unrecognized profile", () => {
    expect(() => BlockchainProviderFactory.fromProfile({} as unknown as TezosProfile)).to.throw("Unrecognized profile");
  });

  it("creates a provider for the Ethereum Blockchain", () => {
    expect(BlockchainProviderFactory.fromProfile({
      blockchain: "ethereum",
      url: "http://eth.url",
    })).to.be.instanceOf(EthereumProvider);
  });

  it("creates a provider for the Tezos Blockchain", () => {
    expect(BlockchainProviderFactory.fromProfile({
      blockchain: "tezos",
      url: "http://xtz.url",
    })).to.be.instanceOf(TezosProvider);
  });
});

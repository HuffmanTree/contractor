import { RpcClient } from "@taquito/rpc";
import { BigNumber } from "bignumber.js";
import { expect } from "chai";
import { stub } from "sinon";
import { Web3Eth } from "web3";
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

describe("Ethereum Provider", () => {
  const provider = new EthereumProvider({
    blockchain: "ethereum",
    url: "http://eth.url",
  });

  it("gets the balance of an account", async () => {
    const getBalance = stub(Web3Eth.prototype, "getBalance").resolves(30n);

    expect(await provider.getBalance("address")).to.equal("30");
    expect(getBalance.calledOnceWithExactly("address")).to.be.true;

    getBalance.restore();
  });
});

describe("Tezos Provider", () => {
  const provider = new TezosProvider({
    blockchain: "tezos",
    url: "http://xrz.url",
  });

  it("gets the balance of an account", async () => {
    const getBalance = stub(RpcClient.prototype, "getBalance").resolves(BigNumber(30));

    expect(await provider.getBalance("address")).to.equal("30");
    expect(getBalance.calledOnceWithExactly("address")).to.be.true;

    getBalance.restore();
  });
});

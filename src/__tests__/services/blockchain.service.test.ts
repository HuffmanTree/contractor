import { RpcClient } from "@taquito/rpc";
import { BigNumber } from "bignumber.js";
import { expect } from "chai";
import { stub } from "sinon";
import { Web3Eth, Contract } from "web3";
import { Net } from "web3-net";
import type { TezosProfile } from "../../models/profile.model.js";
import { BlockchainProviderFactory } from "../../services/blockchain.service.js";
import { EthereumProvider } from "../../services/ethereum.service.js";
import { TezosProvider } from "../../services/tezos.service.js";

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

  it("deploys a smart contract", async () => {
    const deploy = stub(Contract.prototype, "deploy").returns({
      encodeABI: () => "0xcafe",
      estimateGas: () => Promise.resolve(60000n),
    } as any);
    const getGasPrice = stub(Web3Eth.prototype, "getGasPrice").resolves(3);
    const getTransactionCount = stub(Web3Eth.prototype, "getTransactionCount").resolves(2);
    const getChainId = stub(Web3Eth.prototype, "getChainId").resolves(1);
    const getId = stub(Net.prototype, "getId").resolves(42);
    const sendSignedTransaction = stub(Web3Eth.prototype, "sendSignedTransaction").resolves({
      transactionHash: "0x6b095c21a0c07b578490abe70e80603dc83071fcec836e83d8ce9701bbd8a949",
      contractAddress: "contract-address",
      gasUsed: 59233,
    } as any);

    expect(await provider.deploy(`// SPDX-License-Identifier: MIT
// compiler version must be greater than or equal to 0.8.24 and less than 0.9.0
pragma solidity ^0.8.24;

contract HelloWorld {
    string public greet = "Hello World!";
}`, undefined, Buffer.from("6d3172932aa1f837073971506a15cfcc7b76c427b651a8d3c5a974abec79165f", "hex"))).to.deep.equal({
      address: "contract-address",
      txHash: "0x6b095c21a0c07b578490abe70e80603dc83071fcec836e83d8ce9701bbd8a949",
      gasUsed: "59233",
    });

    deploy.restore();
    getGasPrice.restore();
    getTransactionCount.restore();
    getChainId.restore();
    getId.restore();
    sendSignedTransaction.restore();
  });

  it("sends a transaction to a contract", async () => {
    const send = stub(Contract.prototype, "methods").get(() => ({
      setGreet: () => ({
        encodeABI: () => "0xcafe",
        estimateGas: () => Promise.resolve(60000n),
      }),
    }));
    const getGasPrice = stub(Web3Eth.prototype, "getGasPrice").resolves(3);
    const getTransactionCount = stub(Web3Eth.prototype, "getTransactionCount").resolves(2);
    const getChainId = stub(Web3Eth.prototype, "getChainId").resolves(1);
    const getId = stub(Net.prototype, "getId").resolves(42);
    const sendSignedTransaction = stub(Web3Eth.prototype, "sendSignedTransaction").resolves({
      transactionHash: "0x77ac4ad660b882d9c9333a1986efe137a070121ced6f0c4247d72c21c994217b",
      gasUsed: 59233,
    } as any);

    expect(await provider.send(`// SPDX-License-Identifier: MIT
// compiler version must be greater than or equal to 0.8.24 and less than 0.9.0
pragma solidity ^0.8.24;

contract HelloWorld {
    string public greet = "Hello World!";
    function setGreet(string memory _greet) public { greet = _greet; }
}`, "0x76155e5B8c79713b2964b147149547E36973d805", "setGreet", ["Hello Ethereum!"], Buffer.from("6d3172932aa1f837073971506a15cfcc7b76c427b651a8d3c5a974abec79165f", "hex"))).to.deep.equal({
      txHash: "0x77ac4ad660b882d9c9333a1986efe137a070121ced6f0c4247d72c21c994217b",
      gasUsed: "59233",
    });

    send.restore();
    getGasPrice.restore();
    getTransactionCount.restore();
    getChainId.restore();
    getId.restore();
    sendSignedTransaction.restore();
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

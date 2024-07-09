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

  it("compiles the only contract of the Solidity code", () => {
    expect((EthereumProvider as any)._getAbiAndBytecode(`
// SPDX-License-Identifier: MIT
// compiler version must be greater than or equal to 0.8.24 and less than 0.9.0
pragma solidity ^0.8.24;

contract A {
  uint256 public a = 30;
}`).abi).to.deep.equal([{
      inputs: [],
      name: "a",
      outputs: [{
        internalType: "uint256",
        name: "",
        type: "uint256",
      }],
      stateMutability: "view",
      type: "function",
    }]);
  });

  it("compiles the selected contract of the Solidity code", () => {
    const code = `
// SPDX-License-Identifier: MIT
// compiler version must be greater than or equal to 0.8.24 and less than 0.9.0
pragma solidity ^0.8.24;

contract A {
  uint256 public a = 30;
}

contract B {
  uint256 public b = 30;
}`;

    expect((EthereumProvider as any)._getAbiAndBytecode(code, "A").abi).to.deep.equal([{
      inputs: [],
      name: "a",
      outputs: [{
        internalType: "uint256",
        name: "",
        type: "uint256",
      }],
      stateMutability: "view",
      type: "function",
    }]);

    expect((EthereumProvider as any)._getAbiAndBytecode(code, "B").abi).to.deep.equal([{
      inputs: [],
      name: "b",
      outputs: [{
        internalType: "uint256",
        name: "",
        type: "uint256",
      }],
      stateMutability: "view",
      type: "function",
    }]);
  });

  it("fails to compile if the Solidity code contains multiple contracts and none has been selected", () => {
    expect(() => (EthereumProvider as any)._getAbiAndBytecode(`
// SPDX-License-Identifier: MIT
// compiler version must be greater than or equal to 0.8.24 and less than 0.9.0
pragma solidity ^0.8.24;

contract A {
  uint256 public a = 30;
}

contract B {
  uint256 public b = 30;
}`)).to.throw("One contract must be selected among 2");
  });

  it("fails to compile a contract that is not found", () => {
    expect(() => (EthereumProvider as any)._getAbiAndBytecode(`
// SPDX-License-Identifier: MIT
// compiler version must be greater than or equal to 0.8.24 and less than 0.9.0
pragma solidity ^0.8.24;

contract A {
  uint256 public a = 30;
}`, "B")).to.throw("Contract 'B' not found");
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

    expect(await provider.deploy({ code: `// SPDX-License-Identifier: MIT
// compiler version must be greater than or equal to 0.8.24 and less than 0.9.0
pragma solidity ^0.8.24;

contract HelloWorld {
    string public greet = "Hello World!";
}` }, Buffer.from("6d3172932aa1f837073971506a15cfcc7b76c427b651a8d3c5a974abec79165f", "hex"))).to.deep.equal({
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

    expect(await provider.send({ code: `// SPDX-License-Identifier: MIT
// compiler version must be greater than or equal to 0.8.24 and less than 0.9.0
pragma solidity ^0.8.24;

contract HelloWorld {
    string public greet = "Hello World!";
    function setGreet(string memory _greet) public { greet = _greet; }
}`, address: "0x76155e5B8c79713b2964b147149547E36973d805", entrypoint: "setGreet", parameters: ["Hello Ethereum!"] }, Buffer.from("6d3172932aa1f837073971506a15cfcc7b76c427b651a8d3c5a974abec79165f", "hex"))).to.deep.equal({
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

  it("calls a contract", async () => {
    const send = stub(Contract.prototype, "methods").get(() => ({
      getGreet: () => ({
        encodeABI: () => "0xcafe",
      }),
    }));
    const call = stub(Web3Eth.prototype, "call").resolves("0x48656c6c6f20576f726c6421"); // "Hello World!" hex-encoded

    expect(await provider.call({ code: `// SPDX-License-Identifier: MIT
// compiler version must be greater than or equal to 0.8.24 and less than 0.9.0
pragma solidity ^0.8.24;

contract HelloWorld {
    string public greet = "Hello World!";
    function getGreet() public view returns (string memory) { return greet; }
}`, address: "0x76155e5B8c79713b2964b147149547E36973d805", entrypoint: "getGreet" })).to.equal("0x48656c6c6f20576f726c6421");

    send.restore();
    call.restore();
  });

  [
    ["contract EmptyContract {}", { constructor: { input: [] }, functions: [], events: [] }],
    ["contract OnlyStateContract { uint256 public a; bool public b; uint8[4] public ip = [127, 0, 0, 1]; address public me; mapping(address => uint256) public m; mapping(address => mapping(uint256 => bool)) public mm; }", {
      constructor: { input: [] },
      functions: [
        { name: "a", input: [], output: ["uint256"] },
        { name: "b", input: [], output: ["bool"] },
        { name: "ip", input: [{ name: "", type: "uint256" }], output: ["uint8"] },
        { name: "m", input: [{ name: "", type: "address" }], output: ["uint256"] },
        { name: "me", input: [], output: ["address"] },
        { name: "mm", input: [{ name: "", type: "address" }, { name: "", type: "uint256" }], output: ["bool"] },
      ],
      events: [],
    }],
    ["contract CounterContract { uint256 private c; constructor(uint256 _c) { c = _c; } function increment() public { c++; } function decrement() public { c--; } function counter() public view returns (uint256) { return c; } }", {
      constructor: { input: ["uint256"] },
      functions: [
        { name: "counter", input: [], output: ["uint256"] },
        { name: "decrement", input: [], output: [] },
        { name: "increment", input: [], output: [] },
      ],
      events: [],
    }],
    ["contract BalanceContract { mapping(address => uint256) public balances; event Add(address indexed _address, uint256 _value); }", {
      constructor: { input: [] },
      functions: [{ name: "balances", input: [{ name: "", type: "address" }], output: ["uint256"] }],
      events: [{ name: "Add", input: [{ name: "_address", indexed: true, type: "address" }, { name: "_value", indexed: false, type: "uint256" }] }],
    }],
  ].forEach(([code, expectedInfo], i, arr) => {
    it(`get info on the contract (${i + 1}/${arr.length})`, () => {
      expect(EthereumProvider.getInfo({ code: `// SPDX-License-Identifier: MIT
// compiler version must be greater than or equal to 0.8.24 and less than 0.9.0
pragma solidity ^0.8.24;

${code}` })).to.deep.equal(expectedInfo);
    });
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

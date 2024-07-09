import type { ContractAbi } from "web3";
import { Web3 } from "web3";
import { isEthereumAbiConstructorFragment, isEthereumAbiEventFragment, isEthereumAbiFunctionFragment, type BlockchainProvider, type EthereumContractInfo } from "../models/blockchain.model.js";
import type { EthereumProfile } from "../models/profile.model.js";
import solc from "solc";

export class EthereumProvider implements BlockchainProvider {
  private readonly _client: Web3;

  constructor(profile: EthereumProfile) {
    this._client = new Web3(profile.url);
  }

  async getBalance(address: string): Promise<string> {
    const balance = await this._client.eth.getBalance(address);
    return balance.toString();
  }

  public static getInfo({ code, contract }: { code: string, contract?: string }): EthereumContractInfo {
    const { abi } = EthereumProvider._getAbiAndBytecode(code, contract);
    const constructor = { input: abi.find(isEthereumAbiConstructorFragment)?.inputs?.map(v => v.type) || [] };
    const functions = abi.filter(isEthereumAbiFunctionFragment).map(v => ({
      name: v.name,
      input: v.inputs?.map(v => ({ type: v.type, name: v.name })) || [],
      output: v.outputs?.map(v => v.type) || [],
    }));
    const events = abi.filter(isEthereumAbiEventFragment).map(v => ({
      name: v.name,
      input: v.inputs?.map(v => ({ type: v.type, name: v.name, indexed: !!v.indexed })) || [],
    }));
    return { constructor, functions, events };
  }

  private static _getAbiAndBytecode(code: string, contract?: string): { abi: ContractAbi, bytecode: string } {
    const input = {
      language: "Solidity",
      sources: {
        "contract.sol": {
          content: code,
        },
      },
      settings: {
        outputSelection: {
          "*": {
            "*": ["*"],
          },
        },
      },
    };
    const output: {
      contracts: {
        "contract.sol": Record<string, {
          abi: ContractAbi,
          evm: {
            bytecode: {
              object: string,
              opcodes: string,
            },
          },
        }>,
      },
    } = JSON.parse(solc.compile(JSON.stringify(input)));
    let result: {
          abi: ContractAbi,
          evm: {
            bytecode: {
              object: string,
              opcodes: string,
            },
          },
    } | undefined;
    const nbOfContracts = Object.keys(output.contracts["contract.sol"]).length;
    if (contract) {
      result = output.contracts["contract.sol"][contract];
      if (!result) throw new Error(`Contract '${contract}' not found`);
    }
    else if (nbOfContracts === 1) [result] = Object.values(output.contracts["contract.sol"]);
    else {
      throw new Error(`One contract must be selected among ${nbOfContracts}`);
    }

    const { abi, evm: { bytecode: { object: bytecode } } } = result;
    return { abi, bytecode };
  }

  async send({
    code,
    contract,
    address,
    entrypoint,
    parameters,
  }: {
    code: string,
    contract?: string,
    address: string,
    entrypoint: string,
    parameters?: Array<unknown>,
  }, privateKey: Buffer): Promise<{ txHash: string, gasUsed: string }> {
    const { abi } = EthereumProvider._getAbiAndBytecode(code, contract);
    const instance = new this._client.eth.Contract(abi, address);
    const sender = instance.methods[entrypoint](...(parameters || []));
    const { rawTransaction, transactionHash } = await this._client.eth.accounts.signTransaction({
      to: address,
      data: sender.encodeABI(),
      gas: await sender.estimateGas(),
      gasPrice: await this._client.eth.getGasPrice(),
      nonce: await this._client.eth.getTransactionCount(this._client.eth.accounts.privateKeyToAddress(privateKey)),
      chainId: await this._client.eth.getChainId(),
      networkId: await this._client.eth.net.getId(),
    }, privateKey);
    const receipt = await this._client.eth.sendSignedTransaction(rawTransaction);
    if (transactionHash !== receipt.transactionHash) throw new Error("Transaction hash mismatch");
    return { txHash: transactionHash, gasUsed: receipt.gasUsed.toString() };
  }

  async call({
    code,
    contract,
    address,
    entrypoint,
    parameters,
  }: {
    code: string,
    contract?: string,
    address: string,
    entrypoint: string,
    parameters?: Array<unknown>,
  }): Promise<string> {
    const { abi } = EthereumProvider._getAbiAndBytecode(code, contract);
    const instance = new this._client.eth.Contract(abi, address);
    const caller = instance.methods[entrypoint](...(parameters || []));
    const result = await this._client.eth.call({
      to: address,
      data: caller.encodeABI(),
    });
    return result;
  }

  async deploy({
    code,
    contract,
    parameters,
  }: {
    code: string,
    contract?: string,
    parameters?: Array<unknown>,
  }, privateKey: Buffer): Promise<{ address: string, txHash: string, gasUsed: string }> {
    const { abi, bytecode } = EthereumProvider._getAbiAndBytecode(code, contract);
    const instance = new this._client.eth.Contract(abi);
    const deployer = instance.deploy({ data: `0x${bytecode}`, arguments: parameters });
    const { rawTransaction, transactionHash } = await this._client.eth.accounts.signTransaction({
      data: deployer.encodeABI(),
      gas: await deployer.estimateGas(),
      gasPrice: await this._client.eth.getGasPrice(),
      nonce: await this._client.eth.getTransactionCount(this._client.eth.accounts.privateKeyToAddress(privateKey)),
      chainId: await this._client.eth.getChainId(),
      networkId: await this._client.eth.net.getId(),
    }, privateKey);
    const receipt = await this._client.eth.sendSignedTransaction(rawTransaction);
    if (!receipt.contractAddress) throw new Error("Missing 'contractAddress'");
    if (transactionHash !== receipt.transactionHash) throw new Error("Transaction hash mismatch");
    return { address: receipt.contractAddress, txHash: transactionHash, gasUsed: receipt.gasUsed.toString() };
  }
}

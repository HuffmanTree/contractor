import type { ContractAbi } from "web3";
import { Web3 } from "web3";
import type { BlockchainProvider } from "../models/blockchain.model.js";
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

  async deploy(code: string, parameters: unknown[] = [], privateKey: Buffer): Promise<{ address: string, txHash: string, gasUsed: string }> {
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
    if (Object.keys(output.contracts["contract.sol"]).length > 1) throw new Error("Deploying multiple contracts is not supported");
    const [{ abi, evm: { bytecode: { object: bytecode } } }] = Object.values(output.contracts["contract.sol"]);
    const contract = new this._client.eth.Contract(abi);
    const deployer = contract.deploy({ data: `0x${bytecode}`, arguments: parameters });
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

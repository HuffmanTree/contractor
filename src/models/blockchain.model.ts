export interface BlockchainProvider {
  getBalance(address: string): Promise<string>;
}

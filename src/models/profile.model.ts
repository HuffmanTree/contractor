export interface EthereumProfile {
  blockchain: "ethereum",
  url: string
}

export interface TezosProfile {
  blockchain: "tezos",
  url: string
}

export type BlockchainProfile = EthereumProfile | TezosProfile;

export function isEthereumProfile(profile: unknown): profile is EthereumProfile {
  return !!profile
    && typeof profile === "object"
    && "blockchain" in profile
    && profile.blockchain === "ethereum"
    && "url" in profile
    && typeof profile.url === "string";
}

export function isTezosProfile(profile: unknown): profile is TezosProfile {
  return !!profile
    && typeof profile === "object"
    && "blockchain" in profile
    && profile.blockchain === "tezos"
    && "url" in profile
    && typeof profile.url === "string";
}

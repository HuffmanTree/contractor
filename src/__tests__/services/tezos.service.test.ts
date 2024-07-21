import { RpcClient } from "@taquito/rpc";
import { BigNumber } from "bignumber.js";
import { expect } from "chai";
import { stub } from "sinon";
import { TezosProvider } from "../../services/tezos.service.js";

describe("Tezos Provider", () => {
  const provider = new TezosProvider({
    blockchain: "tezos",
    url: "http://xrz.url",
  });

  it("gets the balance of an account", async () => {
    const getBalance = stub(RpcClient.prototype, "getBalance").resolves(BigNumber(30));

    expect(await provider.getBalance("address")).to.deep.equal({ balance: "30", unit: "µꜩ" });
    expect(getBalance.calledOnceWithExactly("address")).to.be.true;

    getBalance.restore();
  });
});

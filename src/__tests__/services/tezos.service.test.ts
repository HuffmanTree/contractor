import { RpcClient } from "@taquito/rpc";
import { OpKind } from "@taquito/taquito";
import { BigNumber } from "bignumber.js";
import { expect } from "chai";
import { stub } from "sinon";
import { TezosProvider } from "../../services/tezos.service.js";

describe("Tezos Provider", () => {
  const provider = new TezosProvider({
    blockchain: "tezos",
    url: "http://xtz.url",
  });

  it("gets the balance of an account", async () => {
    const getBalance = stub(RpcClient.prototype, "getBalance").resolves(BigNumber(30));

    expect(await provider.getBalance("address")).to.deep.equal({ balance: "30", unit: "µꜩ" });
    expect(getBalance.calledOnceWithExactly("address")).to.be.true;

    getBalance.restore();
  });

  it("deploys a smart contract", async () => {
    const getConstants = stub(RpcClient.prototype, "getConstants").resolves({
      hard_gas_limit_per_operation: BigNumber(50),
      hard_storage_limit_per_operation: BigNumber(30),
      cost_per_byte: BigNumber(4),
    } as any);
    const getProtocols = stub(RpcClient.prototype, "getProtocols").resolves({} as any);
    const getManagerKey = stub(RpcClient.prototype, "getManagerKey").resolves({ key: "edpkvGfYw3LyB1UcCahKQk4rF2tvbMUk8GFiTuMjL75uGXrpvKXhjn" });
    const getBlockHeader = stub(RpcClient.prototype, "getBlockHeader").resolves({
      hash: "BLhfKQFR5WHG7pU3Ryv1ZDEkXmBTzJ8pSjLLSFNJohoGqQf62hu",
    } as any);
    const getContract = stub(RpcClient.prototype, "getContract").resolves({
      balance: BigNumber(0),
      script: {
        storage: {
          prim: "",
        },
        code: [{
          prim: "parameter",
          args: [
            { prim: "pair", args: [ { prim: "string", annots: [ "%firstname" ] }, { prim: "string", annots: [ "%lastname" ] } ] } ],
        }, {
          prim: "storage",
          args: [ { prim: "string" } ],
        }, {
          prim: "code",
          args: [
            [
              { prim: "CAR" },
              { prim: "DUP" },
              { prim: "PUSH", args: [ { prim: "string" }, { string: " " } ] },
              { prim: "SWAP" },
              { prim: "CAR" },
              { prim: "CONCAT" },
              { prim: "DIP", args: [ [ { prim: "CDR" } ] ] },
              { prim: "CONCAT" },
              { prim: "NIL", args: [ { prim: "operation" } ] },
              { prim: "PAIR" },
            ],
          ],
        }],
      },
    });
    const getChainId = stub(RpcClient.prototype, "getChainId").resolves("NetXdQprcVkpaWU");
    const simulateOperation = stub(RpcClient.prototype, "simulateOperation").resolves({
      contents: [{
        kind: OpKind.ORIGINATION,
      }],
    } as any);
    const preapplyOperations = stub(RpcClient.prototype, "preapplyOperations").resolves([{
      contents: [{
        kind: OpKind.ORIGINATION,
        metadata: {
          operation_result: {
            originated_contracts: ["KT1HRUjufJWHNPTYrTAdJggW3hoQi3YnTzXM"],
            consumed_milligas: "17000",
          },
        },
      }],
    }] as any);
    const injectOperation = stub(RpcClient.prototype, "injectOperation").resolves("ootSK7QUa5hKmz9yRMS8KbuMZh6Xr2NzSkzKYj8ZW2GVadj23YF");
    const getHead = stub(RpcClient.prototype, "getBlock").resolves({
      header: {
        level: 5,
      },
      operations: [[{}], [{}], [{}], [{ hash: "ootSK7QUa5hKmz9yRMS8KbuMZh6Xr2NzSkzKYj8ZW2GVadj23YF" }]],
    } as any);
    const getEntrypoints = stub(RpcClient.prototype, "getEntrypoints").resolves({
      entrypoints: {
        default: {
          prim: "parameter",
          args: [{
            prim: "pair",
            args: [{
              prim: "string",
              annots: ["%firstname"],
            }, {
              prim: "string",
              annots: ["%lastname"],
            }],
          }],
        },
      },
    } as any);

    expect(await provider.deploy({ code: `parameter (pair (string %firstname) (string %lastname));
storage string;
code {
       CAR;
       DUP;
       PUSH string " ";
       SWAP;
       CAR;
       CONCAT;
       DIP { CDR };
       CONCAT;
       NIL operation; PAIR;
     };`, parameters: [""] }, "edsk3QoqBuvdamxouPhin7swCvkQNgq4jP5KZPbwWNnwdZpSpJiEbq")).to.deep.equal({
      address: "KT1HRUjufJWHNPTYrTAdJggW3hoQi3YnTzXM",
      txHash: "ootSK7QUa5hKmz9yRMS8KbuMZh6Xr2NzSkzKYj8ZW2GVadj23YF",
      gasUsed: "17",
    });

    getConstants.restore();
    getProtocols.restore();
    getManagerKey.restore();
    getBlockHeader.restore();
    getContract.restore();
    getChainId.restore();
    simulateOperation.restore();
    preapplyOperations.restore();
    injectOperation.restore();
    getHead.restore();
    getEntrypoints.restore();
  });
});

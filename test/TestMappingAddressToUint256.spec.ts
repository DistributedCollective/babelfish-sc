/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { expectRevert } from "@openzeppelin/test-helpers";
import { StandardAccounts } from "@utils/standardAccounts";
import envSetup from "@utils/env_setup";
import { MappingAddressToUint256Instance } from "types/generated";

const { expect } = envSetup.configure();

const ADDRESS_1 = '0x0000000000000000000000000000000000000001';
const ADDRESS_2 = '0x0000000000000000000000000000000000000002';
const ADDRESS_3 = '0x0000000000000000000000000000000000000003';

const MappingAddressToUint256 = artifacts.require("MappingAddressToUint256");

contract("BasketManager", async (accounts) => {
    const sa = new StandardAccounts(accounts);

    let mapping: MappingAddressToUint256Instance;

    before("before all", async () => {
        mapping = await MappingAddressToUint256.new();
    });

    describe("constructor", async () => {
        it("owner should be default address", async () => {
            expect(await mapping.owner()).to.eq(sa.default);
        });
    });

    describe("set", async () => {

        const expectedKeys = [ ADDRESS_1, ADDRESS_2, ADDRESS_3 ];
        const expectedValues = [ 10, 20, 30 ];

        context("positive", () => {

            before(async () => {
                for(let i = 0; i < expectedKeys.length; i++) {
                    await mapping.set(expectedKeys[i], expectedValues[i]);
                }
            });

            it("set values keeps the values", async () => {
    
                for(let i = 0; i < expectedKeys.length; i++) {
                    const v = (await mapping.get(expectedKeys[i])).toNumber();
                    expect(v).to.eq(expectedValues[i]);
                    const f = await mapping.exists(expectedKeys[i]);
                    expect(f).to.eq(true);
                }
            });

            it("adds keys and values in array", async () => {

                const keys = await mapping.getKeys();
                const values = (await mapping.getValues()).map(v => v.toNumber());
    
                testArrayNoOrder(keys, expectedKeys);
                testArrayNoOrder(values, expectedValues);
            });    

            it("zero value still exists", async () => {

                await mapping.set(ADDRESS_2, 0);

                const keys = await mapping.getKeys();
                expect(!!keys.find(k => ADDRESS_2)).to.eq(true);
                const f = await mapping.exists(ADDRESS_2);
                expect(f).to.eq(true);
            });    
        });

        it("set should only work for owner", async () => {

            await expectRevert.unspecified(mapping.set(ADDRESS_1, 0, { from: sa.dummy1 }));
        });
    });
});

function testArrayNoOrder(actual: any[], expected: any[]) {
    expect(actual.length).to.eq(expected.length);
    for(let i = 0; i < expected.length; i++) {
        const f = !!actual.find(k => expected[i]);
        expect(f).to.eq(true);
    }
}

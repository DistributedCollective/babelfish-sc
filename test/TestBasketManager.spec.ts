/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { ZERO_ADDRESS } from "@utils/constants";
import { StandardAccounts } from "@utils/standardAccounts";
import { expectRevert, expectEvent, time } from "@openzeppelin/test-helpers";
import envSetup from "@utils/env_setup";

const { expect } = envSetup.configure();

const BasketManager = artifacts.require("BasketManager");
const Masset = artifacts.require("Masset");
const MockERC20 = artifacts.require("MockERC20");

contract("BasketManager", async (accounts) => {
    const sa = new StandardAccounts(accounts);

    let masset;
    let mockToken1; let mockToken2; let mockToken3; let mockToken4;

    before("before all", async () => {
        masset = await Masset.new();
        mockToken1 = await MockERC20.new("", "", 18, sa.dummy1, 1);
        mockToken2 = await MockERC20.new("", "", 18, sa.dummy1, 1);
        mockToken3 = await MockERC20.new("", "", 18, sa.dummy1, 1);
        mockToken4 = await MockERC20.new("", "", 18, sa.dummy1, 1);
    });

    describe("initialize", async () => {
        let bassets; let bridges; let digits;
        before(async () => {
            bassets = [mockToken1.address, mockToken2.address, mockToken3.address];
            bridges = [ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS];
            digits = [18, 18, 18];
        });
        context("should succeed", async () => {
            it("when given all the params", async () => {
                const inst = await BasketManager.new(bassets, digits, bridges);
            });
        });
        context("should fail", async () => {
            it("when bassets missing", async () => {
                await expectRevert.unspecified(BasketManager.new([], digits, bridges));
            });
            it("when digits missing", async () => {
                await expectRevert.unspecified(BasketManager.new(bassets, [], bridges));
            });
        });
        context("checking if bassets are valid", () => {
            let inst;
            beforeEach(async () => {
                inst = await BasketManager.new(bassets, digits, bridges);
            });
            context("isValidBasset", () => {
                it("should return false if basset is in the basket", async () => {
                    expect(await inst.isValidBasset(mockToken1.address)).to.equal(true);
                    expect(await inst.isValidBasset(mockToken2.address)).to.equal(true);
                    expect(await inst.isValidBasset(mockToken3.address)).to.equal(true);
                });
                it("should return true if basset is not in the basket", async () => {
                    expect(await inst.isValidBasset(ZERO_ADDRESS)).to.equal(false);
                    expect(await inst.isValidBasset(mockToken4.address)).to.equal(false);
                });
            });
            context("checkBasketBalanceForDeposit", () => {
                it("should return false if basset is in the basket", async () => {
                    expect(await inst.isValidBasset(mockToken1.address)).to.equal(true);
                    expect(await inst.isValidBasset(mockToken2.address)).to.equal(true);
                    expect(await inst.isValidBasset(mockToken3.address)).to.equal(true);
                });
                it("should return true if basset is not in the basket", async () => {
                    expect(await inst.isValidBasset(ZERO_ADDRESS)).to.equal(false);
                    expect(await inst.isValidBasset(mockToken4.address)).to.equal(false);
                });
            });
            context("checkBasketBalanceForWithdrawal", () => {
                it("should return false if basset is in the basket", async () => {
                    expect(await inst.isValidBasset(mockToken1.address)).to.equal(true);
                    expect(await inst.isValidBasset(mockToken2.address)).to.equal(true);
                    expect(await inst.isValidBasset(mockToken3.address)).to.equal(true);
                });
                it("should return true if basset is not in the basket", async () => {
                    expect(await inst.isValidBasset(ZERO_ADDRESS)).to.equal(false);
                    expect(await inst.isValidBasset(mockToken4.address)).to.equal(false);
                });
            });
        });
    });

    describe("modifiers", async () => {
        let inst;
        beforeEach(async () => {
            inst = await BasketManager.new([], [], []);
        });

        context("addBasset", () => {
            it("should work and emit as expected", async () => {
                expect(await inst.isValidBasset(mockToken1.address)).to.eq(false);
                const tx = await inst.addBasset(mockToken1.address, 18, ZERO_ADDRESS);
                await expectEvent(tx.receipt, 'onBassetAdded', {
                    sender: sa.default,
                    basset: mockToken1.address,
                    digits: '18',
                    bridge: ZERO_ADDRESS
                });
                expect(await inst.isValidBasset(mockToken1.address)).to.eq(true);
            });

            it("should revert if not owner", async () => {
                await expectRevert.unspecified(inst.addBasset(mockToken1.address, 18, ZERO_ADDRESS, { from: sa.dummy4 }));
            });
        });

        context("removeBasset", () => {
            it("should work and emit as expected", async () => {
                await inst.addBasset(mockToken2.address, 18, ZERO_ADDRESS);
                await inst.addBasset(mockToken1.address, 18, ZERO_ADDRESS);
                expect(await inst.isValidBasset(mockToken1.address)).to.eq(true);
                const tx = await inst.removeBasset(mockToken1.address);
                await expectEvent(tx.receipt, 'onBassetRemoved', {
                    sender: sa.default,
                    basset: mockToken1.address
                });
                expect(await inst.isValidBasset(mockToken1.address)).to.eq(false);
                const bassets = await inst.getBassets();
                expect(bassets).to.eql([mockToken2.address]);
            });

            it("should revert if not owner", async () => {
                await expectRevert.unspecified(inst.removeBasset(mockToken1.address, { from: sa.dummy4 }));
            });
        });

    });
});

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { expectRevert } from "@openzeppelin/test-helpers";
import { DEAD_ADDRESS, ZERO_ADDRESS } from "@utils/constants";
import { StandardAccounts } from "@utils/standardAccounts";
import envSetup from "@utils/env_setup";
import { MassetInstance, MockERC20Instance, PauseManagerInstance } from "types/generated";

const { expect } = envSetup.configure();

const PauseManager = artifacts.require("PauseManager");
const Masset = artifacts.require("Masset");
const MockERC20 = artifacts.require("MockERC20");
const BasketManager = artifacts.require("BasketManager");
const Token = artifacts.require("Token");

contract("PauseManager", async (accounts) => {
    const sa = new StandardAccounts(accounts);

    before("before all", async () => {});

    describe("constructor", async () => {
        it("should succeed", async () => {
            const inst = await PauseManager.new();
        });
    });

    describe("pausers", async () => {
        let pauseManager: PauseManagerInstance;
        beforeEach(async () => {
            pauseManager = await PauseManager.new();
        });
        context("adding a pauser", async () => {
            it("should fail for zero address", async () => {
                await expectRevert.unspecified(pauseManager.addPauser(ZERO_ADDRESS));
            });
            it("should fail if not owner", async () => {
                await pauseManager.transferOwnership(sa.dummy4);
                await expectRevert.unspecified(pauseManager.addPauser(sa.dummy1));
            });
            it("should fail if already added", async () => {
                await pauseManager.addPauser(sa.dummy1);
                await expectRevert.unspecified(pauseManager.addPauser(sa.dummy1));
            });
            it("should succeed", async () => {
                await pauseManager.addPauser(sa.dummy1);
                const pausers = await pauseManager.getPausers();
                expect(pausers).to.eql([sa.dummy1]);
                const isPauser = await pauseManager.isPauser(sa.dummy1);
                expect(isPauser).to.equal(true);    
            });
        });
        context("removing a pauser", async () => {
            it("should fail for zero address", async () => {
                await expectRevert.unspecified(pauseManager.removePauser(ZERO_ADDRESS));
            });
            it("should fail if not owner", async () => {
                await pauseManager.transferOwnership(sa.dummy4);
                await expectRevert.unspecified(pauseManager.removePauser(sa.dummy1));
            });
            it("should fail if not added", async () => {
                await expectRevert.unspecified(pauseManager.removePauser(sa.dummy1));
            });
            it("should succeed", async () => {
                await pauseManager.addPauser(sa.dummy1);
                let isPauser = await pauseManager.isPauser(sa.dummy1);
                expect(isPauser).to.equal(true);

                await pauseManager.removePauser(sa.dummy1);
                const pausers = await pauseManager.getPausers();
                expect(pausers).to.eql([]);
                isPauser = await pauseManager.isPauser(sa.dummy1);
                expect(isPauser).to.equal(false);
            });
        });
    });

    describe("tokens", async () => {
        let pauseManager: PauseManagerInstance;
        beforeEach(async () => {
            pauseManager = await PauseManager.new();
        });
        context("pausing a token", async () => {
            it("should fail for zero address", async () => {
                await expectRevert.unspecified(pauseManager.pause(ZERO_ADDRESS));
            });
            it("should fail if not owner or pauser", async () => {
                await pauseManager.transferOwnership(sa.dummy4);
                await expectRevert.unspecified(pauseManager.pause(sa.dummy1));
            });
            it("should fail if already paused", async () => {
                await pauseManager.pause(sa.dummy1);
                await expectRevert.unspecified(pauseManager.pause(sa.dummy1));
            });
            it("should succeed if owner", async () => {
                await pauseManager.pause(sa.dummy1);
                const tokens = await pauseManager.getTokens();
                expect(tokens).to.eql([sa.dummy1]);
                const isPaused = await pauseManager.isPaused(sa.dummy1);
                expect(isPaused).to.equal(true);    
            });
            it("should succeed if pauser, not owner", async () => {
                await pauseManager.addPauser(sa.default);
                await pauseManager.transferOwnership(sa.dummy4);
                await pauseManager.pause(sa.dummy1);
                const tokens = await pauseManager.getTokens();
                expect(tokens).to.eql([sa.dummy1]);
                const isPaused = await pauseManager.isPaused(sa.dummy1);
                expect(isPaused).to.equal(true);    
            });
        });
        context("unpausing a token", async () => {
            it("should fail for zero address", async () => {
                await expectRevert.unspecified(pauseManager.unpause(ZERO_ADDRESS));
            });
            it("should fail if not owner", async () => {
                await pauseManager.pause(sa.dummy1);
                await pauseManager.transferOwnership(sa.dummy4);
                await expectRevert.unspecified(pauseManager.unpause(sa.dummy1));
            });
            it("should fail if not paused", async () => {
                await expectRevert.unspecified(pauseManager.unpause(sa.dummy1));
            });
            it("should succeed", async () => {
                await pauseManager.pause(sa.dummy1);
                let isPaused = await pauseManager.isPaused(sa.dummy1);
                expect(isPaused).to.equal(true);

                await pauseManager.unpause(sa.dummy1);
                const tokens = await pauseManager.getTokens();
                expect(tokens).to.eql([]);
                isPaused = await pauseManager.isPaused(sa.dummy1);
                expect(isPaused).to.equal(false);
            });
        });
    });

    describe("Masset integration", async () => {
        let pauseManager: PauseManagerInstance;
        let masset: MassetInstance;
        let basketManagerObj; let token;
        const tokenHolder = sa.dummy1;
        const sum = '100000000000000000';

        beforeEach(async () => {
            pauseManager = await PauseManager.new();
            masset = await Masset.new();
            basketManagerObj = await createBasketManager(masset, tokenHolder);
            token = await createToken(masset);
            await masset.initialize(basketManagerObj.basketManager.address, token.address, false);            
        });
        context("set pause manager", async () => {
            it("should fail for zero address", async () => {
                await expectRevert.unspecified(masset.setPauseManager(ZERO_ADDRESS));
            });
            it("should fail if not owner", async () => {
                await masset.transferOwnership(sa.dummy4);
                await expectRevert.unspecified(masset.setPauseManager(pauseManager.address));
            });
            it("should succeed", async () => {
                await masset.setPauseManager(pauseManager.address);
                const pm = await masset.getPauseManager();
                expect(pm).to.equal(pauseManager.address);
            });
        });
        context("pausing a token", async () => {
            beforeEach(async () => {
                masset.setPauseManager(pauseManager.address);
            });
            it("should not prevent minting of unpaused token", async () => {
                await testMint(masset, basketManagerObj.mockToken1, tokenHolder, sum);
            });
            it("should prevent minting of paused token", async () => {
                await pauseManager.pause(basketManagerObj.mockToken1.address);
                await expectRevert.unspecified(
                    testMint(masset, basketManagerObj.mockToken1, tokenHolder, sum)
                );
            });
        });
    });
});

async function testMint(masset: MassetInstance, mockToken: MockERC20Instance, tokenHolder: string, sum: string) {
    await mockToken.approve(masset.address, sum, {
        from: tokenHolder,
    });
    await masset.mint(mockToken.address, sum, {
        from: tokenHolder,
    });
}

async function createBasketManager(masset: MassetInstance, initial: string): Promise<any> {
    const mockToken1 = await MockERC20.new("", "", 18, initial, 100);
    const mockToken2 = await MockERC20.new("", "", 18, initial, 100);
    const bassets = [mockToken1.address, mockToken2.address];
    const basketManager = await BasketManager.new(bassets, [1, 1], [ZERO_ADDRESS, ZERO_ADDRESS]);
    return {
        mockToken1,
        mockToken2,
        bassets,
        basketManager,
    };
}

async function createToken(masset: MassetInstance): Promise<any> {
    const token = await Token.new();
    await token.initialize('MASSET', 'MASSET', 18);
    await token.transferOwnership(masset.address);
    return token;
}

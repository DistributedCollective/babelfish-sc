/* eslint-disable @typescript-eslint/triple-slash-reference,spaced-comment */
/// <reference path="../../types/generated/index.d.ts" />
/// <reference path="../../types/generated/types.d.ts" />

import state from "../state";

export default async (
    {
        artifacts,
    }: {
        artifacts: Truffle.Artifacts;
    },
    deployer,
): Promise<void> => {
    process.env.NETWORK = deployer.network;
    await state.setNetwork(deployer.network);
    const cMigrations = artifacts.require("Migrations");
    await state.conditionalDeploy(cMigrations, 'Migrations', () => deployer.deploy(cMigrations));
};

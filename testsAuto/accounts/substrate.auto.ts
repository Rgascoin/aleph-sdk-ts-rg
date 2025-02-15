import * as bip39 from "bip39";
import assert from "assert";
import { mnemonicToMiniSecret } from "@polkadot/util-crypto";

import { testsFunc } from "../index";
import { accounts, messages } from "../../src";
import { DEFAULT_API_V2 } from "../../src/global";
import { Chain, ItemType } from "../../src/messages/message";

/**
 * This is the first test of the test bach for substrate.
 * It should create a new substrate account and check if it worked.
 *
 * For the assertion comparison, the `assert` standard library is used.
 * If the assertion failed, you must catch the error message and display it while returning false.
 */
async function createAccountTest(): Promise<boolean> {
    const { account, mnemonic } = await accounts.substrate.NewAccount();
    const accountFromMnemonic = await accounts.substrate.ImportAccountFromMnemonic(mnemonic);

    try {
        assert.strictEqual(account.address, accountFromMnemonic.address);
        assert.strictEqual(account.GetChain(), Chain.DOT);
    } catch (e: unknown) {
        console.error(`createAccountTest: ${e}`);
        return false;
    }
    return true;
}

async function importAccountFromPrivateKeyTest(): Promise<boolean> {
    const mnemonic = bip39.generateMnemonic();
    const account = await accounts.substrate.ImportAccountFromMnemonic(mnemonic);
    const secretKey = `0x${Buffer.from(mnemonicToMiniSecret(mnemonic)).toString("hex")}`;
    const importedAccount = await accounts.substrate.ImportAccountFromPrivateKey(secretKey);

    try {
        assert.strictEqual(account.address, importedAccount.address);
    } catch (e: unknown) {
        console.error(`importAccountFromPrivateKeyTest: ${e}`);
        return false;
    }
    return true;
}

async function PublishAggregate(): Promise<boolean> {
    const { account } = await accounts.substrate.NewAccount();
    const key = "cheer";
    const content: { body: string } = {
        body: "Typescript sdk",
    };

    await messages.aggregate.Publish({
        account: account,
        key: key,
        content: content,
        channel: "TEST",
        storageEngine: ItemType.ipfs,
        inlineRequested: true,
        APIServer: DEFAULT_API_V2,
    });

    type exceptedType = {
        cheer: {
            body: string;
        };
    };
    const amends = await messages.aggregate.Get<exceptedType>({
        APIServer: DEFAULT_API_V2,
        address: account.address,
        keys: [key],
    });

    try {
        assert.strictEqual(amends.cheer.body, content.body);
    } catch (e: unknown) {
        console.error(`PublishPostMessage: ${e}`);
        return false;
    }
    return true;
}

async function encryptNDecrypt(): Promise<boolean> {
    const account = await accounts.substrate.ImportAccountFromMnemonic(
        "immune orbit beyond retire marble clog shiver ice illegal tomorrow antenna tennis",
    );
    const msg = Buffer.from("Innovation");

    try {
        const c = account.encrypt(msg);
        const d = account.decrypt(c);
        assert.notStrictEqual(c, msg);
        assert.deepEqual(d, msg);
    } catch (e: unknown) {
        console.error(`importAccountFromMnemonicTest: ${e}`);
        return false;
    }
    return true;
}

/**
 * SubstrateTests controls the flow of your custom tests for substrate protocol.
 * Every test is represented by a function related to the `testsFunc` Type.
 * The array `testBatch` Contains all the customs tests functions in a predefined order.
 *
 * Every test will be executed in order, then a boolean according to the failure or success of your batch
 * will be returned.
 *
 * In order to produce a new test bach you have to copy this function in a new file with
 * an appropriate name, import `assert` library and `testsFunc` type.
 */
export default async function substrateTests(): Promise<boolean> {
    let passed = true;
    let res: boolean;
    const testBatch: testsFunc[] = [
        createAccountTest,
        importAccountFromPrivateKeyTest,
        PublishAggregate,
        encryptNDecrypt,
    ];

    for (let i = 0; i < testBatch.length; i++) {
        res = await testBatch[i]();
        console.log(`Test [${i + 1}-${res ? "Success" : "Failure"}]\t${testBatch[i].name}`);
        passed = res ? passed : false;
    }
    return passed;
}

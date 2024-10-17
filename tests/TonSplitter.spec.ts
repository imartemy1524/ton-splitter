import { Blockchain, printTransactionFees, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, Dictionary, toNano } from '@ton/core';
import { TonSplitter } from '../wrappers/TonSplitter';
import '@ton/test-utils';
import { randomAddress } from '@ton/test-utils';

describe('TonSplitter', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let tonSplitter: SandboxContract<TonSplitter>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');

        tonSplitter = blockchain.openContract(await TonSplitter.fromInit(deployer.address, 0n));

        const deployResult = await tonSplitter.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            },
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: tonSplitter.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        const addresses = Array.from({ length: 20 }, () => randomAddress());
        const amounts = Array.from({ length: 20 }, () => BigInt(Math.floor(Number(toNano('10')) * Math.random())));
        const map: Dictionary<bigint, Address> = Dictionary.empty();
        for (let i = 0; i < addresses.length; i++) {
            map.set(amounts[i], addresses[i]);
        }
        const { transactions } = await tonSplitter.send(
            deployer.getSender(),
            {
                value: amounts.reduce((a, b) => a + b, 0n) + toNano('0.01') * BigInt(amounts.length) + toNano('0.01'),
            },
            {
                $$type: 'SplitTons',
                to: map,
            },
        );
        printTransactionFees(transactions);
        expect(transactions).toHaveTransaction({
            from: deployer.address,
            to: tonSplitter.address,
            success: true,
        });
        for (let i = 0; i < addresses.length; i++) {
            expect(transactions).toHaveTransaction({
                to: addresses[i],
                from: tonSplitter.address,
                value: e=>e!-amounts[i]< 10000n,
            });
        }
    });
    it('should not send if not enough funds', async () => {
        const addresses = Array.from({ length: 20 }, () => randomAddress());
        const amounts = Array.from({ length: 20 }, () => BigInt(Math.floor(Number(toNano('10')) * Math.random())));
        const map: Dictionary<bigint, Address> = Dictionary.empty();
        for (let i = 0; i < addresses.length; i++) {
            map.set(amounts[i], addresses[i]);
        }
        const { transactions } = await tonSplitter.send(
            deployer.getSender(),
            {
                value: amounts.reduce((a, b) => a + b, 0n) - toNano('0.01'),
            },
            {
                $$type: 'SplitTons',
                to: map,
            },
        );
        expect(transactions).toHaveTransaction({
            from: deployer.address,
            to: tonSplitter.address,
            success: false,
        });
    })
});

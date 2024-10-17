import { Blockchain, printTransactionFees, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, beginCell, Cell, Dictionary, Slice, toNano } from '@ton/core';
import { TonSplitter } from '../wrappers/TonSplitter';
import '@ton/test-utils';
import { randomAddress } from '@ton/test-utils';
import { JettonSplitter, storeForwardPayload } from '../build/JettonSplitter/tact_JettonSplitter';
import { JettonMaster } from '../build/Jettons/tact_JettonMaster';
import { JettonDefaultWallet } from '../build/Jettons/tact_JettonDefaultWallet';

async function deployJetton(blockchain: Blockchain, owner: SandboxContract<TreasuryContract>) {
    let jettonMaster = blockchain.openContract(await JettonMaster.fromInit(owner.address, Cell.EMPTY, toNano('10000000')));

    // Mint
    await jettonMaster.send(
        owner.getSender(),
        { value: toNano('1') },
        {
            $$type: 'Mint',
            amount: toNano('10000000'),
            receiver: owner.address,
        },
    );

    expect(await jettonMaster.getOwner()).toEqualAddress(owner.address);
    expect(await jettonMaster.getGetJettonData().then(e=>e.totalSupply)).toEqual(toNano('10000000'));
    return jettonMaster;
}

describe('JettonSplitter', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let tonSplitter: SandboxContract<JettonSplitter>;
    let masterJetton: SandboxContract<JettonMaster>;
    let deployerJetton: SandboxContract<JettonDefaultWallet>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');

        tonSplitter = blockchain.openContract(await JettonSplitter.fromInit(deployer.address, 0n));

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
        masterJetton = await deployJetton(blockchain, deployer);
        deployerJetton = blockchain.openContract(
            JettonDefaultWallet.fromAddress(await masterJetton.getGetWalletAddress(deployer.address)),
        );
    });

    it('should deploy', async () => {
        const addresses = Array.from({ length: 20 }, () => randomAddress());
        const amounts = Array.from({ length: 20 }, () => BigInt(Math.floor(Number(toNano('10')) * Math.random())));
        const map: Dictionary<bigint, Address> = Dictionary.empty();
        for (let i = 0; i < addresses.length; i++) {
            map.set(amounts[i], addresses[i]);
        }
        const { transactions } = await deployerJetton.send(
            deployer.getSender(),
            {
                value: toNano('0.2') * BigInt(amounts.length) + toNano('0.01'),
            },
            {
                $$type: 'TokenTransfer',
                queryId: 0n,
                amount: amounts.reduce((a, b) => a + b, 0n),
                destination: tonSplitter.address,
                response_destination: deployer.address,
                custom_payload: null,
                forward_ton_amount: toNano('0.19') * BigInt(amounts.length),
                forward_payload: beginCell()
                    .store(
                        storeForwardPayload({
                            $$type: 'ForwardPayload',
                            to: map,
                        }),
                    )
                    .endCell()
                    .asSlice(),
            },
        );
        printTransactionFees(transactions);
        for (let i = 0; i < addresses.length; i++) {
            const wallet = blockchain.openContract(JettonDefaultWallet.fromAddress(
                await masterJetton.getGetWalletAddress(addresses[i])
            ));
            const { balance } = await wallet.getGetWalletData();
            expect(balance).toEqual(amounts[i]);
        }
    });
});

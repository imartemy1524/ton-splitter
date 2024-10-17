import { toNano } from '@ton/core';
import { TonSplitter } from '../wrappers/TonSplitter';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const tonSplitter = provider.open(await TonSplitter.fromInit(BigInt(Math.floor(Math.random() * 10000))));

    await tonSplitter.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(tonSplitter.address);

    console.log('ID', await tonSplitter.getId());
}

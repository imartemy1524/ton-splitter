import { toNano } from '@ton/core';
import { TonSplitter } from '../wrappers/TonSplitter';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const tonSplitter = provider.open(await TonSplitter.fromInit(provider.sender().address!, 0n));

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

    console.log('Deployed at', tonSplitter.address);
}

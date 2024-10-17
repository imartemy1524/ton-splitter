import { toNano } from '@ton/core';
import { TonSplitter } from '../wrappers/TonSplitter';
import { NetworkProvider } from '@ton/blueprint';
import { JettonSplitter } from '../build/JettonSplitter/tact_JettonSplitter';

export async function run(provider: NetworkProvider) {
    const tonSplitter = provider.open(await JettonSplitter.fromInit(provider.sender().address!, 0n));

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

    console.log('TON Jettons deployed at', tonSplitter.address);
}

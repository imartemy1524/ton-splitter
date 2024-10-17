import { NetworkProvider } from '@ton/blueprint';
import { TonSplitter } from '../build/TonSplitter/tact_TonSplitter';
import { Address, Dictionary, toNano } from '@ton/core';
import { randomAddress } from '@ton/test-utils';
import { TonSplitterAddr } from './__config';

export async function run(provider: NetworkProvider) {
    const contract = provider.open(TonSplitter.fromAddress(TonSplitterAddr));
    const to = Dictionary.empty<bigint, Address>();
    to.set(toNano('0.1'), provider.sender()!.address!);
    to.set(toNano('0.05'), randomAddress());
    to.set(toNano('0.01'), randomAddress());
    await contract.send(
        provider.sender(),
        {
            value: toNano('0.2'),
        },
        {
            $$type: 'SplitTons',
            to,
        },
    );
}

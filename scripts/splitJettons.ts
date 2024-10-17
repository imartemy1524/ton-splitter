import { NetworkProvider } from '@ton/blueprint';
import { JettonMaster } from '../build/Jettons/tact_JettonMaster';
import { Address, beginCell, Dictionary, toNano } from '@ton/core';
import { storeForwardPayload } from '../build/JettonSplitter/tact_JettonSplitter';
import { storeTokenTransfer } from '../build/Jettons/tact_SampleJetton';
import { randomAddress } from '@ton/test-utils';
import { JettonsSplitterAddr } from './__config';

const JettonAddr = 'kQC6cYfMFYFur2IgJroc3wBxg-q4hOxsqGQwEYSEARxtOmZf';

export async function run(provider: NetworkProvider) {
    const master = provider.open(JettonMaster.fromAddress(Address.parse(JettonAddr)));
    const childAddress = await master.getGetWalletAddress(provider.sender().address!);

    const addresses = Array.from({ length: 10 }, () => randomAddress());
    addresses[0] = provider.sender().address!;
    const amounts = Array.from({ length: 10 }, () => BigInt(Math.floor(Number(toNano('0.003')) * Math.random())));
    const map: Dictionary<bigint, Address> = Dictionary.empty();
    for (let i = 0; i < addresses.length; i++) {
        map.set(amounts[i], addresses[i]);
    }

    await provider.sender().send({
        to: childAddress,
        body: beginCell()
            .store(
                storeTokenTransfer({
                    $$type: 'TokenTransfer',
                    amount: amounts.reduce((a, b) => a + b, 0n),
                    queryId: 0n,
                    custom_payload: null,
                    destination: JettonsSplitterAddr,
                    forward_ton_amount: toNano('0.16') * BigInt(amounts.length),
                    forward_payload: beginCell()
                        .store(
                            storeForwardPayload({
                                $$type: 'ForwardPayload',
                                to: map,
                            }),
                        )
                        .endCell()
                        .asSlice(),
                    response_destination: provider.sender().address!,
                }),
            )
            .endCell(),
        value: toNano('0.16') * BigInt(amounts.length) + toNano('0.2'),
    });
}

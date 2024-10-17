import "@stdlib/deploy";
import "@stdlib/ownable";

message(0x7362d09c) TokenNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    from: Address;
    forward_payload: Slice as remaining; // Comment Text message when Transfer the jetton
}

struct ForwardPayload{
    to: map<Int, Address>;
}

message(0xf8a7ea5) TokenTransfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
    response_destination: Address;
    custom_payload: Cell?;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining; // Comment Text message when Transfer the jetton
}

contract JettonSplitter with Deployable, Ownable {
    override const storageReserve: Int = ton("0.01");
    owner: Address;
    init(owner: Address, randomId: Int) {
        self.owner = owner;
    }
    receive(m: TokenNotification){
        let value = m.amount;
        let minimumInputTons = 0;
        let mmm: ForwardPayload = ForwardPayload.fromSlice(m.forward_payload);
        foreach(amount, address in mmm.to){
            value -= amount;
            minimumInputTons += ton("0.15") + ton("0.01");
            let forward_payload = "spliter".asComment().asSlice();
            let custom_payload = beginCell().endCell();
            send(SendParameters{
                to: sender(),
                value: ton("0.15"),
                bounce: false,
                mode: SendIgnoreErrors,
                body: TokenTransfer{
                    queryId: m.queryId,
                    amount,
                    destination: address,
                    response_destination: m.from,
                    custom_payload,
                    forward_ton_amount: 1,
                    forward_payload
                }.toCell()
            });
        }
        require(value >= 0, "Not enough jettons sent");
        require(context().value >= minimumInputTons, "Not enough tons sent");
    }

    receive("withdraw"){
        self.requireOwner();
        send(SendParameters{
            to: self.owner,
            value: myBalance() - ton("0.01"),
            bounce: false
        })
    }
}

import "@stdlib/deploy";
import "@stdlib/ownable";

message SplitTons{
    to: map<Int, Address>;
}

contract TonSplitter with Deployable, Ownable {
    override const storageReserve: Int = ton("0.01");
    owner: Address;
    init(owner: Address, randomId: Int) {
        self.owner = owner;
    }

    receive(messages: SplitTons) {
        let totalAmount = ton("0.01");
        foreach(amount, address in messages.to){
            totalAmount +=( amount + ton("0.01"));
            send(SendParameters{
                to: address,
                value: amount,
                bounce: false,
                mode: SendIgnoreErrors
            });
        }

        require(totalAmount <= context().value, "Not enough balance");
        // exit without saving
        commit();
        throw(0);
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

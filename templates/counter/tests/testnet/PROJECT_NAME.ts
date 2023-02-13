import { PROJECT_NAME } from '../../src/contracts/PROJECT_NAME'
import {
    fetchUtxos,
    inputIndex,
    outputIndex,
    testnetDefaultSigner,
    sleep,
} from './util/txHelper'
import { bsv } from 'scrypt-ts'

async function main() {
    await PROJECT_NAME.compile()

    // create a genesis instance
    const counter = new PROJECT_NAME(0n).markAsGenesis()

    // connect to a signer
    counter.connect(await testnetDefaultSigner)

    // contract deployment
    const deployTx = await counter.deploy(1000)
    console.log('Counter deploy tx:', deployTx.id)

    const changeAddress = await (await testnetDefaultSigner).getDefaultAddress()
    let prevTx = deployTx
    let prevInstance = counter
    // calling contract multiple times
    for (let i = 0; i < 3; i++) {
        // avoid mempool conflicts, sleep to allow previous tx "sink-into" the network
        await sleep(5)

        // 1. build a new contract instance
        const newCounter = prevInstance.next()
        // 2. apply the updates on the new instance.
        newCounter.count++
        // 3. construct a transaction for contract call
        const unsignedCallTx: bsv.Transaction = await new bsv.Transaction()
            .addInputFromPrevTx(prevTx)
            .from(await fetchUtxos())
            .setOutput(outputIndex, (tx: bsv.Transaction) => {
                newCounter.from = { tx, outputIndex }
                return new bsv.Transaction.Output({
                    script: newCounter.lockingScript,
                    satoshis: tx.getInputAmount(inputIndex),
                })
            })
            .change(changeAddress)
            .setInputScriptAsync(
                {
                    inputIndex,
                    sigtype: bsv.crypto.Signature.ANYONECANPAY_SINGLE,
                },
                (tx: bsv.Transaction) => {
                    // bind contract & tx unlocking relation
                    prevInstance.to = { tx, inputIndex }

                    // use the cloned version because this callback may be executed multiple times during tx building process,
                    // and calling contract method may have side effects on its properties.
                    return prevInstance.getUnlockingScript(async (cloned) => {
                        cloned.increment()
                    })
                }
            )
        const callTx = await (
            await testnetDefaultSigner
        ).signAndsendTransaction(unsignedCallTx)
        console.log(
            'Counter call tx: ',
            callTx.id,
            ', count updated to: ',
            newCounter.count
        )

        // prepare for the next iteration
        prevTx = callTx
        prevInstance = newCounter
    }
}

describe('Test SmartContract `Counter` on testnet', () => {
    it('should succeed', async () => {
        await main()
    })
})

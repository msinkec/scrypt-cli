import { PROJECT_NAME } from '../../src/contracts/PROJECT_NAME'
import { getDefaultSigner, inputSatoshis } from './util/txHelper'

async function main() {
    await PROJECT_NAME.compile()
    const demo = new PROJECT_NAME(1n, 2n)

    // connect to a signer
    await demo.connect(await getDefaultSigner())

    // contract deployment
    const deployTx = await demo.deploy(inputSatoshis)
    console.log('Demo contract deployed: ', deployTx.id)

    // contract call
    const { tx: callTx } = await demo.methods.add(3n)
    console.log('Demo contract `add` called: ', callTx.id)
}

describe('Test SmartContract `Demo` on testnet', () => {
    it('should succeed', async () => {
        await main()
    })
})

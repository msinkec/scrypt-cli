import { PROJECT_NAME } from './src/contracts/PROJECT_NAME'
import { bsv, TestWallet, DefaultProvider } from 'scrypt-ts'

import * as dotenv from 'dotenv'

// Load the .env file
dotenv.config()

// Read the private key from the .env file.
// The default private key inside the .env file is meant to be used for the Bitcoin testnet.
// See https://scrypt.io/docs/bitcoin-basics/bsv/#private-keys
const privateKey = bsv.PrivateKey.fromWIF(process.env.PRIVATE_KEY || '')

// Prepare signer.
// See https://scrypt.io/docs/how-to-deploy-and-call-a-contract/#prepare-a-signer-and-provider
const signer = new TestWallet(
    privateKey,
    new DefaultProvider({
        network: bsv.Networks.testnet,
    })
)

async function main() {
    await PROJECT_NAME.compile()

    // TODO: Adjust the amount of satoshis locked in the smart contract:
    const amount = 1

    const instance = new PROJECT_NAME(
        // TODO: Adjust constructor parameter values:
        0n
    )

    // Connect to a signer.
    await instance.connect(signer)

    // Contract deployment.
    const deployTx = await instance.deploy(amount)
    console.log(`PROJECT_NAME contract deployed: ${deployTx.id}`)
}

main()

const API_PATH = 'http://localhost:9984/api/v1/'
const driver = require('bigchaindb-driver')
const conn = new driver.Connection(API_PATH)
console.log(conn)
const bdb = require('easy-bigchain')
const key = new driver.Ed25519Keypair()
async function createAsset() {
    const assetdata = {
    'bicycle': {
            'serial_number': 'h1',
            'manufacturer': 'Bicycle Inc.',
        }
    }
    const metadata = {'planet': 'earth'}

    const txCreateAliceSimple = driver.Transaction.makeCreateTransaction(
        assetdata,
        metadata,

        // A transaction needs an output
        [ driver.Transaction.makeOutput(
                driver.Transaction.makeEd25519Condition(key.publicKey))
        ],
        key.publicKey
    )
    txCreateAliceSimpleSigned = driver.Transaction.signTransaction(txCreateAliceSimple, key.privateKey)
    tx = await conn.postTransactionCommit(txCreateAliceSimpleSigned)
    console.log(tx.id)
    return tx

}

async function recreateAsset(){
    let tx = await createAsset()
    console.log(tx)
    transaction = await conn.getTransaction(tx.id)
    const assetdata = {
        'bicycle': {
                'serial_number': '123456789',
                'manufacturer': 'Bicycle Inc.',
            }
        }
    transaction.asset = assetdata
    console.log(transaction)
    const txTransferBob = driver.Transaction.makeTransferTransaction(
        // signedTx to transfer and output index
        [{ tx: transaction, output_index: 0 }],

        [driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(key.publicKey))],
    );
    transfer = driver.Transaction.signTransaction(txTransferBob, key.privateKey);
    tx = await conn.postTransactionCommit(transfer)
    return tx
}

(async() => {
   asset = await createAsset()
   console.log(asset)
})();


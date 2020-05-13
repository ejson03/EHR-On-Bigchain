const API_PATH = process.env.BIGCHAIN_URL || 'http://192.168.33.160:9984/api/v1/'
const driver = require('bigchaindb-driver')
const conn = new driver.Connection(API_PATH)
const bdb = require('easy-bigchain')

const createBigchainKeys = (email) =>{
    return bdb.generateKeypair(email)
}

const createAsset = async (asset=null, metadata=null, publicKey=null, privateKey=null) =>{
    const txCreateAliceSimple = driver.Transaction.makeCreateTransaction(
        asset,
        metadata,
        [driver.Transaction.makeOutput(
            driver.Transaction.makeEd25519Condition(publicKey))],
        publicKey
    );
    const txCreateAliceSimpleSigned = driver.Transaction.signTransaction(txCreateAliceSimple, privateKey);
    tx = await conn.postTransactionCommit(txCreateAliceSimpleSigned);
    return tx;
}

const transferAsset = async (transaction, metadata, publicKey, privateKey) => {
    let txTransferBob = driver.Transaction.makeTransferTransaction(

        [{ tx: transaction, output_index: 0 }], [driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(publicKey))],
        metadata
    )
    let txTransferBobSigned = driver.Transaction.signTransaction(txTransferBob, privateKey)
    transfer = await conn.postTransactionCommit(txTransferBobSigned)
    return transfer
}

const getAsset = async (query) =>{
    return await conn.searchAssets(query)
}

const getMetadata = async (query) => {
    return await conn.searchMetadata(query)
}

const getTransactions = async (query) => {
    return await conn.getTransactions(query)
}

const listTransactions = async (query) => {
    return await conn.listTransactions(query)
}

module.exports = {
    createAsset,
    transferAsset,
    getAsset,
    getMetadata,
    getTransactions,
    listTransactions,
    createBigchainKeys
}
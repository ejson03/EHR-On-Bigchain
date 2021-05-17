const API_PATH = 'http://192.168.33.160:9984/api/v1/'
const driver = require('bigchaindb-driver')
const conn = new driver.Connection(API_PATH)


const admin1 = new driver.Ed25519Keypair()
const user1 = new driver.Ed25519Keypair()
const user2 = new driver.Ed25519Keypair()
const user3 = new driver.Ed25519Keypair()

const nameSpace = 'rbac-bdb-demo'

async function createApp() {

    // create admin user type - this is the asset representing the group of admins
    const adminGroupAsset = {
        ns: `${nameSpace}.admin`,
        name: 'admin'
    }

    const adminGroupMetadata = {
        can_link: [admin1.publicKey]
    }

    const adminGroupId = (await createNewAsset(admin1, adminGroupAsset, adminGroupMetadata)).id
    console.log('AdminGroup: ' + adminGroupId)

    // create admin user instance - this is a single user with admin role represented by an asset
    const adminUserMetadata = {
        event: 'User Assigned',
        date: new Date(),
        timestamp: Date.now(),
        publicKey: admin1.publicKey,
        eventData: {
            userType: 'admin'
        }
    }

    const adminUserId = (await createUser(admin1, adminGroupId, 'admin', admin1.publicKey, adminUserMetadata)).id
    console.log('AdminUser1: ' + adminUserId)

    // create app - the umbrella asset for representing the app
    const appAsset = {
        ns: nameSpace,
        name: nameSpace
    }

    const appMetadata = {
        can_link: adminGroupId
    }

    const appId = (await createNewAsset(admin1, appAsset, appMetadata)).id
    console.log('App: ' + appId)

    // create types

    // user types

    // tribes - user groups
    const tribe1Id = (await createType('tribe1', appId, adminGroupId)).id
    console.log('Tribe 1: ' + tribe1Id)

    const tribe2Id = (await createType('tribe2', appId, adminGroupId)).id
    console.log('Tribe 2: ' + tribe2Id)

    // create user instances
    const userMetadata = {
        event: 'User Assigned',
        date: new Date(),
        timestamp: Date.now(),
        publicKey: admin1.publicKey,
        eventData: {
            userType: 'tribe1'
        }
    }

    // user 1 added to tribe 1
    const userAssetId = (await createUser(admin1, tribe1Id, 'tribe1', user1.publicKey, userMetadata)).id
    console.log('User1: ' + userAssetId)

    // create user instances
    const user2Metadata = {
        event: 'User Assigned',
        date: new Date(),
        timestamp: Date.now(),
        publicKey: admin1.publicKey,
        eventData: {
            userType: 'tribe2'
        }
    }

    // user 2 added to tribe 2
    const user2AssetId = (await createUser(admin1, tribe2Id, 'tribe2', user2.publicKey, user2Metadata)).id
    console.log('User2: ' + user2AssetId)

    // create user instances
    const user3Metadata = {
        event: 'User Assigned',
        date: new Date(),
        timestamp: Date.now(),
        publicKey: admin1.publicKey,
        eventData: {
            userType: 'tribe1'
        }
    }

    // user 3 added to tribe 1
    const user3AssetId = (await createUser(admin1, tribe1Id, 'tribe1', user3.publicKey, user3Metadata)).id
    console.log('User3: ' + user3AssetId)

    // non users

    // proposal - only tribe 1 users can create proposal
    const proposalGroupId = (await createType('proposal', appId, tribe1Id)).id
    console.log('ProposalGroup: ' + proposalGroupId)

    // vote - only tribe 2 users can create vote
    const voteGroupId = (await createType('vote', appId, tribe2Id)).id
    console.log('VoteGroup: ' + voteGroupId)

    // Test cases

    // create proposal by user 1 - should pass
    const proposal1 = await createTypeInstance(user1, 'proposal', proposalGroupId, { name: 'new proposal by user 1', timestamp: Date.now() })
    console.log('Proposal 1: ' + proposal1.id)

    // create vote by user 2 - should pass
    const vote1 = await createTypeInstance(user2, 'vote', voteGroupId, { name: 'new vote by user 2', timestamp: Date.now() })
    console.log('Vote 1: ' + vote1.id)

    // create proposal by user 3 - should pass
    const proposal2 = await createTypeInstance(user3, 'proposal', proposalGroupId, { name: 'new proposal by user 3', timestamp: Date.now() })
    console.log('Proposal 2: ' + proposal2.id)

    // create vote by user 1 - should fail
    const vote2 = await createTypeInstance(user1, 'vote', voteGroupId, { name: 'new vote by user 1', timestamp: Date.now() })
    console.log('Vote 2: ' + vote2.id)
}

async function createUser(adminKeyPair, userTypeId, userTypeName, userPublicKey, userMetadata) {
    const asset = {
        ns: `${nameSpace}.${userTypeName}`,
        link: userTypeId,
        createdBy: adminKeyPair.publicKey,
        type: userTypeName,
        keyword: 'UserAsset'
    }

    const metadata = {
        event: 'User Added',
        date: new Date(),
        timestamp: Date.now(),
        publicKey: adminKeyPair.publicKey,
        eventData: {
            userType: userTypeName
        }
    }

    const instanceTx = await createNewAsset(adminKeyPair, asset, metadata)
    await transferAsset(instanceTx, adminKeyPair, userPublicKey, userMetadata)
    return instanceTx
}

async function createType(typeName, appId, canLinkAssetId) {
    const asset = {
        ns: `${nameSpace}.${typeName}`,
        link: appId,
        name: typeName
    }

    const metadata = {
        can_link: canLinkAssetId
    }

    return await createNewAsset(admin1, asset, metadata)
}

async function createTypeInstance(keypair, typeName, typeId, metadata) {
    const asset = {
        ns: `${nameSpace}.${typeName}`,
        link: typeId
    }

    return await createNewAsset(keypair, asset, metadata)
}

async function createNewAsset(keypair, asset, metadata) {

    let condition = driver.Transaction.makeEd25519Condition(keypair.publicKey, true)

    let output = driver.Transaction.makeOutput(condition)
    output.public_keys = [keypair.publicKey]

    const transaction = driver.Transaction.makeCreateTransaction(
        asset,
        metadata,
        [ driver.Transaction.makeOutput(
               driver.Transaction.makeEd25519Condition(keypair.publicKey))
       ],
        keypair.publicKey
    )

    const txSigned = driver.Transaction.signTransaction(transaction, keypair.privateKey)
    return await conn.postTransactionCommit(txSigned)
}

async function transferAsset(tx, fromKeyPair, toPublicKey, metadata) {

    let condition = driver.Transaction.makeEd25519Condition(toPublicKey)

    let output = driver.Transaction.makeOutput(condition)
    output.public_keys = [toPublicKey]

    const txTransfer = driver.Transaction.makeTransferTransaction(
        [{tx: tx,output_index:0}],
        [output],
        metadata
    )

    const txSigned = driver.Transaction.signTransaction(txTransfer, fromKeyPair.privateKey)
    return await conn.postTransactionCommit(txSigned)
}

(async() => {
   asset = await createApp()
   process.exit()

})();
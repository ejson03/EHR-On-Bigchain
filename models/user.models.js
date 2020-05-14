const {createBigchainKeys, getAsset, createAsset} = require("../utils/bigchain.js")
const {login, signUp, read, write} = require("../utils/vault.js")
const {generateRSAKeys, encrypt, createSecretKey } = require("../utils/crypto")
class User {

    constructor(username, schema, password) {
        this.registered = null;
        this.records = null;
        this.user = this.getBio(username, schema, password);
        console.log("User is ", this.user)
        if (this.records === null && this.registered){
            this.records = this.getRecords(username)
            console.log("Records", this.records)
        }

    }
    getBio(username, schema, password){
        try{
            let records = getAsset(username);
            records = records.filter(function (data) {
                return data.schema == schema 
            });
            this.registered = true
            login(password, username)
            this.read_keys()
            return records[0]['data'] 
        }catch{
            this.registered = false
            return
        }
    }

    writeKeys(username){
        this.secretKey = createSecretKey()
        this.bigchainKeys = createBigchainKeys(encrypt(username, this.secretKey))
        this.rsaKeys = generateRSAKeys()
        let value = [this.bigchainKeys.privateKey, 
                this.bigchainKeys.publicKey,
                this.rsaKeys.privateKey,
                this.rsaKeys.publicKey, 
                this.secretKey]
        let keys = ['bigchainPrivateKey', 'bigchainPublicKey', 'rsaPrivateKey', 'rsaPublicKey', 'secretKey']
        keys.forEach((key, index) =>{
            write(key, value[index])
        });
    }

    readKeys(){
        this.bigchainKeys.privateKey = read('bigchainPrivateKey')
        this.bigchainKeys.publicKey = read('bigchainPublicKey')
        this.rsaKeys.privateKey =read('rsaPrivateKey')
        this.rsaKeys.publicKey = read('rsaPublicKey')
        this.secretKey = read('secretKey')
    }


    async createUser(asset, password, username){
        await signUp(password, username)
        this.writeKeys(username)
        let data = {...asset,
            'date' : new Date().toString(),
            'bigchainKey' : this.bigchainKeys.publicKey.toString(),
            'rsaKey' : this.rsaKeys.publicKey.toString()
        }
        let tx = await createAsset(data, null, this.bigchainKeys.publicKey, this.bigchainKeys.privateKey)
        this.user = tx.asset.data
        //this.records = this.getRecords(username)
        this.registered = true
        return tx
    }
    
    getRecords(username){
        let records = []
        if (this.records === null){
            try{
                records = getAsset(username)
            } catch {
                return []
            }
            records.filter(function (record){
                return record.data.schema == 'record' && record.data.user.bigchainKey == this.user.bigchainKey
            } );
            return records;
        }
    } 
}

module.exports = {
    User
}

//  write_record(this, ipfs_hash, form){}
//     console.log(this.bigchainKeys['public_key'])
//     id = uuid.uuid4()
//     data = {
//         'schema'{} 'record',
//         'form'{} form,
//         'user'{} this.user,
//         'file'{} ipfs_hash,
//         'file_hash'{} hash(ipfs_hash),
//         'id' {} str(id),
//         'date'{} datetime.now().strftime("%s")
//     }
//     metadata = {
//         'doclist'{} [],
//         'id'{} str(id),
//         'date'{} datetime.now().strftime("%s")
//     }
    
//     tx = bdb.transactions.prepare(
//         operation='CREATE',
//         signers=this.bigchainKeys['public_key'],
//         asset={'data'{} data},
//         metadata=metadata
//     )
//     signed_tx = bdb.transactions.fulfill(
//         tx,
//         private_keys=this.bigchainKeys['private_key']
//     )
//     sent = bdb.transactions.send_commit(signed_tx)
//     return sent 

//  get_transfer_details(this, tx){}
//     output = tx['outputs'][0]
//     transfer_input = {
//         'fulfillment'{} output['condition']['details'],
//         'fulfills'{} {
//             'output_index'{} 0,
//             'transaction_id'{} tx['id'],},
//         'owners_before'{} output['public_keys'],}
//     if tx['operation'] == 'TRANSFER'{}
//         asset_id = tx['asset']['id']
//     else{}
//         asset_id = tx['id']

//     transfer_asset = {
//         'id'{}asset_id,
//     }
//     return transfer_asset, transfer_input

//  get_doctor_key(this, dname){}
//     asset = this.get_assets(dname)
//     rsaKey = list(filter(lambda record {} check(record), asset))[0]
//     return rsaKey

//  get_meta_details(this, tx, doclist){}
//     metadata = tx['metadata']
//     doc = metadata['doclist']
//     for doctor in doclist{}
//         key = RSA.importKey(this.get_doctor_key(doctor))
//         doc.append({
//             'username'{} doctor,
//             'key'{} encrypt_rsa(this.secretKey.encode(), key).decode()
//         })
//     metadata['doclist'] = doc
//     metadata['date'] = datetime.now().strftime("%s")
//     return metadata

//  transfer_record(this, asset=null, doclist=[]){}
//     asset = this.get_assets(asset)
//     tx = this.get_transactions(asset[0]['id'])[-1]
//     transfer_asset, transfer_input = this.get_transfer_details(tx)
    
//     metadata = this.get_meta_details(tx, doclist)
//     prepared_tx = bdb.transactions.prepare(
//         operation='TRANSFER',
//         asset=transfer_asset,
//         inputs=transfer_input,
//         recipients=this.bigchainKeys['public_key'],
//         metadata=metadata
//     )

//     signed = bdb.transactions.fulfill(
//         prepared_tx,
//         private_keys=this.bigchainKeys['private_key']
//     )

//     tx = bdb.transactions.send_commit(signed)
//     return tx
  


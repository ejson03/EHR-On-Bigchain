const {createBigchainKeys, getAsset, createAsset} = require("../utils/bigchain.js")
const {login, signUp, read, write} = require("../utils/vault.js")
const {generateRSAKeys, encrypt, createSecretKey } = require("../utils/crypto")
class User {

    constructor(email, schema, password) {
        this.registered = null;
        this.records = null;
        this.bigchain_keys = {};
        this.rsa_keys = {};
        this.user = this.getBio(email, schema, password);
        console.log("User is ", this.user)
        // if (! this.registered){
        //     this.user = this.create_user(email, schema, password)
        //     console.log("User is ", this.user)
        // }
        if (this.records == null){
            this.records = this.getRecords()
            console.log("Records", this.records)
        }

    }
    getBio(email, schema, password){
        try{
            let records = getAsset(email);
            records = records.filter(function (data) {
                return data.schema == schema 
            });
            this.registered = true
            login(password, email)
            this.read_keys()
            return records[0]['data'] 
        }catch{
            this.registered = false
            return
        }
    }

    writeKeys(email){
        this.secret_key = createSecretKey()
        this.bigchain_keys = createBigchainKeys(encrypt(email, this.secret_key))
        [this.rsa_keys.privateKey, this.rsa_keys.publicKey] = generateRSAKeys()
        value = [this.bigchain_keys.privateKey, 
                this.bigchain_keys.publicKey,
                this.rsa_keys.privateKey,
                this.rsa_keys.publicKey, 
                this.secret_key]
        keys = ['bigchain_private_key', 'bigchain_public_key', 'rsa_private_key', 'rsa_public_key', 'secret_key']
        keys.forEach((key, index) =>{
            write(key, value[index])
        });
    }

    readKeys(){
        this.bigchain_keys['privateKey'] = read('bigchain_private_key')
        this.bigchain_keys['publicKey'] = read('bigchain_public_key')
        this.rsa_keys['privateKey'] =read('rsa_private_key')
        this.rsa_keys['publicKey'] = read('rsa_public_key')
        this.secret_key = read('secret_key')
    }


    async createUser(asset, password, email){
        signUp(password, email)
        this.writeKeys(email)
        data = {...asset,
            'date' : new Date().toString(),
            'bigchain_key' : this.bigchain_keys.publicKey,
            'rsa_key' : this.rsa_keys.publicKey
        }
        let tx = await createAsset(data, this.bigchain_keys.publicKey, this.bigchain_keys.privateKey)
        this.user = asset['asset']['data']
        this.registered = true
        return tx
    }
    
    getRecords(){
        let records = []
        if (this.records === null){
            try{
                records = getAsset(this.user['email'])
            } catch {
                return []
            }
            records.filter(function (data){
                return data['data']['schema'] == 'record' && data['data']['user']['bigchain_key'] == this.user['bigchain_key']
            } );
            return records;
        }
    } 
}

module.exports = {
    User
}

//  write_record(this, ipfs_hash, form){}
//     console.log(this.bigchain_keys['public_key'])
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
//         signers=this.bigchain_keys['public_key'],
//         asset={'data'{} data},
//         metadata=metadata
//     )
//     signed_tx = bdb.transactions.fulfill(
//         tx,
//         private_keys=this.bigchain_keys['private_key']
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
//     rsa_key = list(filter(lambda record {} check(record), asset))[0]
//     return rsa_key

//  get_meta_details(this, tx, doclist){}
//     metadata = tx['metadata']
//     doc = metadata['doclist']
//     for doctor in doclist{}
//         key = RSA.importKey(this.get_doctor_key(doctor))
//         doc.append({
//             'email'{} doctor,
//             'key'{} encrypt_rsa(this.secret_key.encode(), key).decode()
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
//         recipients=this.bigchain_keys['public_key'],
//         metadata=metadata
//     )

//     signed = bdb.transactions.fulfill(
//         prepared_tx,
//         private_keys=this.bigchain_keys['private_key']
//     )

//     tx = bdb.transactions.send_commit(signed)
//     return tx
  


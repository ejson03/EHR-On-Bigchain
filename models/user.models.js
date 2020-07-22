const { cryptoService, bigchainService, vaultService } = require("../services");

class User {
  constructor(username, schema, password) {
    this.registered = null;
    this.records = null;
    this.user = this.getBio(username, schema, password);
    console.log("User is ", this.user);
    if (this.records == null && this.registered) {
      this.getRecords(username)
        .then(record => {
          this.records = record;
          console.log("Records", this.records);
        });
    }
  }
  async getBio(username, schema, password) {
    try {
      let records = await bigchainService.getAsset(username);
      records = records.filter(function (data) {
        return data.schema == schema;
      });
      this.registered = true;
      await vaultService.login(password, username);
      await this.readKeys();
      return records[0]["data"];
    } catch {
      this.registered = false;
    }
    return null;
  }

  writeKeys(username) {
    try {
      this.secretKey = cryptoService.createSecretKey();
      this.bigchainKeys = bigchainService.createBigchainKeys(
        cryptoService.encrypt(username, this.secretKey)
      );
      this.rsaKeys = cryptoService.generateRSAKeys();
      let value = [
        this.bigchainKeys.privateKey,
        this.bigchainKeys.publicKey,
        this.rsaKeys.privateKey,
        this.rsaKeys.publicKey,
        this.secretKey,
      ];
      const keys = [
        "bigchainPrivateKey",
        "bigchainPublicKey",
        "rsaPrivateKey",
        "rsaPublicKey",
        "secretKey",
      ];
      keys.forEach((key, index) => {
        vaultService.write(key, value[index]);
      });
    } catch (error) {
      console.log(error);
    }
  }

  async readKeys() {
    this.bigchainKeys.privateKey = await vaultService.read("bigchainPrivateKey");
    this.bigchainKeys.publicKey = await vaultService.read("bigchainPublicKey");
    this.rsaKeys.privateKey = await vaultService.read("rsaPrivateKey");
    this.rsaKeys.publicKey = await vaultService.read("rsaPublicKey");
    this.secretKey = await vaultService.read("secretKey");
  }

  async createUser(asset, password, username) {
    try {
      await vaultService.signUp(password, username);
      this.writeKeys(username);
      let data = {
        ...asset,
        date: new Date().toString(),
        bigchainKey: this.bigchainKeys.publicKey.toString(),
        rsaKey: this.rsaKeys.publicKey.toString(),
      };
      let tx = await bigchainService.createAsset(
        data,
        null,
        this.bigchainKeys.publicKey,
        this.bigchainKeys.privateKey
      );
      console.log(tx);
      this.user = tx.asset.data;
      //this.records = this.getRecords(username)
      this.registered = true;
      return tx;
    } catch (error) {
      console.log("Error is", error);
      return false;
    }
  }

  async getRecords(username) {
    try {
      if (this.records == null) {
        let records = [];
        records = await bigchainService.getAsset(username);
        records = records.filter(record => record.data.schema == "record" &&
          record.data.user.bigchainKey == this.user.bigchainKey
        );
        return records;
      }
    } catch (err) {
      console.log(err);
    }
    return [];
  }
}

module.exports = {
  User,
};

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
//             'key'{} cryptoService.encrypt_rsa(this.secretKey.encode(), key).decode()
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

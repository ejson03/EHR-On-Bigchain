const { VaultAccess } = require('node-vault-user-pass');
const { signUp } = require('../dist/services/vault');

const Vault = new VaultAccess({
   Authority: ['create', 'read', 'update', 'delete', 'list', 'sudo'],
   Path: 'path',
   Policy: 'auth_policy',
   EndPoint: 'http://128.199.30.7:8200',
   UserName: 'username',
   SecretMountPoint: 'secret_zone',
   Token: String('myroot'),
   CertificateMountPoint: 'certificate',
   AltToken: ''
});

Vault.Setup();

async function run() {
   // In Order to run Setup, the user needs Root Token
   const result = await signUp(Vault, 'password', 'user');
   console.log(result);
   // const sigin = await Vault.SignIn('1234', 'vortex');
   // const token = sigin.auth.client_token;
   // const id = (await Vault.TokenLookupSelf()).data.id;
   // try {
   //    const status = await Vault.TokenLookup({ token: id });
   //    console.log(status);
   // } catch (e) {
   //    console.log(e);
   // }

   //    console.log('Sign In Successfull');

   //    const value = {
   //       foo: '3',
   //       bar: '4'
   //    };
   //    const write = await Vault.Write('key', value);
   //    const val = await Vault.Read('key');
   //    console.log('Read value is ', val);

   // Unmount is an admin action
   // As such, the user needs Root Token
   // Or At least access to /sys/mount provided
   // await Vault.Unmount();
}

run().then(() => {
   console.log();
});

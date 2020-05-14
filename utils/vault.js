const { VaultAccess } = require("node-vault-user-pass");

const Vault = new VaultAccess({
	Authority: ["create", "read", "update", "delete", "list", "sudo"],
	Path: 'path',
	Policy: 'auth_policy',
	EndPoint: process.env.VAULT_URL,
	UserName: "username",
	SecretMountPoint: 'secret_zone',
	Token: process.env.VAULT_TOKEN,
	CertificateMountPoint: "certificate"
})
Vault.Setup()


const signUp = async(password, username) => {
    await Vault.SignUp(password, username);
};

const login = async(password, username) => {
    await Vault.SignIn(password, username);
};

const write = async(key, value) => {
    await Vault.Write(key, value);
};

const read = async(key) => {
    return await Vault.Read(key);
};

const getUsers = async() => {
    return await Vault.UsersGet();
}

module.exports = {
	signUp,
	login,
	write,
	read,
	getUsers
 }
 



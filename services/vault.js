const { VaultAccess } = require("node-vault-user-pass");
const config = require("../config");

const Vault = new VaultAccess({
  Authority: ["create", "read", "update", "delete", "list", "sudo"],
  Path: "path",
  Policy: "auth_policy",
  EndPoint: config.vault.url,
  UserName: "username",
  SecretMountPoint: "secret_zone",
  Token: config.vault.token,
  CertificateMountPoint: "certificate",
});
exports.setup = Vault.Setup();

const signUp = async (password, username) => {
  return await Vault.SignUp(password, username);
};

const login = async (password, username) => {
  return await Vault.SignIn(password, username);
};

const write = async (key, value) => {
  return await Vault.Write(key, value);
};

const read = async (key) => {
  return await Vault.Read(key);
};

const getUsers = async () => {
  return await Vault.UsersGet();
};

module.exports = {
  signUp,
  login,
  write,
  read,
  getUsers,
};

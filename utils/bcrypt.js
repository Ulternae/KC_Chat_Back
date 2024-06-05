import bcrypt from "bcryptjs";

const encryptedPassword = async ({ password }) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  return hashedPassword;
};

const validPassword = async ({ password, db_password }) => {
  return await bcrypt.compare(password, db_password);
};

export { encryptedPassword, validPassword };

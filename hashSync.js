const bcrypt = require("bcrypt");
const salt = bcrypt.genSaltSync(10); // generate a salt with work factor of 10
const password = "password"; // the password to hash
const hashedPassword = bcrypt.hashSync(password, salt);
console.log(hashedPassword); // print the hashed password

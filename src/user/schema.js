import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Schema } from "mongoose";

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  avatar: {
    type: String
  },
  phoneNumber: {
    type: String
  },
  admin: {
    type: Boolean,
    default: false
  }
});

// one way hashing
// don't store plain text password
function hashPassword(next) {
  let user = this;
  let modified = false;
  console.log(user._update);

  if (user._update) {
    modified = true;
    user = this._update;
  } else {
    modified = user.isModified("password");
  }
  // if no modification then return next middleware
  if (!modified) {
    return next();
  }

  // there are precalculated hash tables and users' passwords can match
  // so we add a salt to make sure no two password hashes will match
  bcrypt.genSalt(parseInt(process.env.SALT_ROUNDS, 10), (err, salt) => {
    if (err) {
      return next(err);
    }
    bcrypt.hash(user.password, salt, null, (err, hash) => {
      if (err) {
        return next(err);
      }

      user.password = hash;
      next();
    });
  });
}

userSchema.statics.authorize = function(req) {
  return this.findOne({
    username: req.user.username
  }).then(user => {
    console.log("findOne.then.user", user);
    if (
      user &&
      (req.params.id === undefined ||
        req.params.id === user._id.toString() ||
        user.admin)
    ) {
      return;
    } else {
      throw new Error();
    }
  });
};

userSchema
  .virtual("fullName")
  .get(function() {
    return `${this.firstName} ${this.lastName}`;
  })
  .set(function(value) {
    this.firstName = value.substring(0, value.indexOf(" "));
    this.lastName = value.substring(value.indexOf(" ") + 1);
  });

userSchema.statics.myStatic = () => {};

// salt is stored in this.password as well as the hash
userSchema.methods.comparePassword = function(candidatePassword) {
  return new Promise((resolve, reject) => {
    // bcrypt separates the two and combines the stored salt with the password
    // for comparison
    bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
      if (err) {
        return reject(err);
      }
      return resolve(isMatch);
    });
  });
};

userSchema.methods.generateJwtToken = function() {
  const user = this;
  return new Promise((resolve, reject) => {
    const { username } = user;
    const JWT_SECRET = process.env.JWT_SECRET;
    const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION;
    const now = Date.now();

    jwt.sign(
      {
        username,
        id: user._id,
        iat: now,
        exp: now + parseInt(TOKEN_EXPIRATION, 10)
      },
      JWT_SECRET,
      (err, token) => {
        if (err) {
          return reject(err);
        }
        return resolve(token);
      }
    );
  });
};

// Remove password in server response
userSchema.methods.toJSON = function() {
  var user = this.toObject();
  delete user.password;
  return user;
};

userSchema.pre("save", hashPassword);
userSchema.pre("findOneAndUpdate", hashPassword);
export default userSchema;

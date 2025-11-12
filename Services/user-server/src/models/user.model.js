const mongoose = require('mongoose');
const { v4: uuid } = require('uuid');

const userSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      default: () => uuid(),
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password_hash: {
      type: String,
      required: true,
    },
    first_name: {
      type: String,
      trim: true,
    },
    last_name: {
      type: String,
      trim: true,
    },
    phone_number: {
      type: String,
      trim: true,
    },
    push_tokens: {
      type: [String],
      default: [],
    },
    roles: {
      type: [String],
      default: ['user'],
      enum: ['user', 'admin'],
    },
    preferences: {
      email_notifications: {
        type: Boolean,
        default: true,
      },
      push_notifications: {
        type: Boolean,
        default: true,
      },
      quiet_hours_start: {
        type: String,
        default: null,
      },
      quiet_hours_end: {
        type: String,
        default: null,
      },
    },
    last_login_at: {
      type: Date,
      default: null,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        ret.created_at = ret.createdAt;
        ret.updated_at = ret.updatedAt;
        delete ret._id;
        delete ret.__v;
        delete ret.password_hash;
        delete ret.createdAt;
        delete ret.updatedAt;
        return ret;
      },
    },
  },
);

userSchema.methods.toSafeObject = function () {
  const userObject = this.toObject();
  delete userObject.password_hash;
  return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User;


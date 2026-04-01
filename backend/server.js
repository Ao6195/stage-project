require('dotenv').config();
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');

mongoose.set('bufferCommands', false);

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';
const REGISTRATION_CODE_LIFETIME_MS = 10 * 60 * 1000;
const LOGIN_CODE_LIFETIME_MS = 5 * 60 * 1000;
const RESET_CODE_LIFETIME_MS = 10 * 60 * 1000;
const LOCAL_DB_PATH = path.join(__dirname, 'database.json');
const GOOGLE_CLIENT_ID =
  typeof process.env.GOOGLE_CLIENT_ID === 'string' ? process.env.GOOGLE_CLIENT_ID.trim() : '';
const DEPARTMENT_OPTIONS = ['Exploitation', 'Data', 'Security'];
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'm4v', 'avi', 'mkv', 'mpeg']);
const TEXT_EXTENSIONS = new Set(['txt', 'md', 'json', 'csv', 'log', 'xml', 'html', 'css', 'js', 'jsx', 'ts', 'tsx']);
const DOCUMENT_EXTENSIONS = new Set(['pdf']);

let mongoConnected = false;
const mongoUri = typeof process.env.MONGO_URI === 'string' ? process.env.MONGO_URI.trim() : '';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

app.use(cors());
app.use(express.json());

if (mongoUri) {
  mongoose
    .connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
      mongoConnected = true;
      console.log('MongoDB Connected');
    })
    .catch((error) => {
      mongoConnected = false;
      console.error('MongoDB unavailable, using local database.json:', error.message);
    });
} else {
  console.warn('MongoDB unavailable, using local database.json: MONGO_URI is not configured.');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  tls: { rejectUnauthorized: false },
});

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, trim: true },
    usernameLower: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    email: { type: String, unique: true, lowercase: true, trim: true },
    password: { type: String },
    role: { type: String, default: 'user' },
    mfaCode: { type: String },
    mfaExpires: { type: Date },
    resetPasswordCode: { type: String },
    resetPasswordExpires: { type: Date },
    downloads: { type: Number, default: 0 },
    activity: { type: [Number], default: [0, 2, 5, 1, 4, 0, 0] },
  },
  { timestamps: true }
);

const PendingRegistrationSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    usernameLower: { type: String, required: true, trim: true, lowercase: true, unique: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true },
    verificationCode: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

const VoteSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    value: { type: Number, enum: [-1, 1], required: true },
  },
  { _id: false }
);

const CommentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const DocSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    department: String,
    fileUrl: String,
    originalName: String,
    mimeType: String,
    resourceType: String,
    publicId: String,
    fileCategory: String,
    ownerId: mongoose.Schema.Types.ObjectId,
    ownerName: String,
    approvalStatus: { type: String, enum: ['pending', 'approved'], default: 'approved' },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: String, default: '' },
    downloadCount: { type: Number, default: 0 },
    votes: { type: [VoteSchema], default: [] },
    comments: { type: [CommentSchema], default: [] },
    history: [{ version: Number, url: String, updatedBy: String, date: { type: Date, default: Date.now } }],
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const PendingRegistration =
  mongoose.models.PendingRegistration ||
  mongoose.model('PendingRegistration', PendingRegistrationSchema);
const Document = mongoose.models.Document || mongoose.model('Document', DocSchema);

const normalizeEmail = (email = '') => email.trim().toLowerCase();
const normalizeUsername = (username = '') => username.trim();
const getUsernameKey = (username = '') => normalizeUsername(username).toLowerCase();
const generateSixDigitCode = () => String(Math.floor(100000 + Math.random() * 900000));
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidUsername = (username) => /^[A-Za-z0-9._-]{3,24}$/.test(username);
const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isMongoReady = () => mongoConnected && mongoose.connection.readyState === 1;
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const ensureLocalDbShape = (data = {}) => ({
  users: Array.isArray(data.users) ? data.users : [],
  documents: Array.isArray(data.documents) ? data.documents : [],
  pendingRegistrations: Array.isArray(data.pendingRegistrations) ? data.pendingRegistrations : [],
});

const makeLocalId = () => `${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getFileExtension = (...values) => {
  for (const value of values) {
    if (!value || typeof value !== 'string') continue;
    const clean = value.split('?')[0].split('#')[0];
    const lastDot = clean.lastIndexOf('.');
    if (lastDot !== -1 && lastDot < clean.length - 1) {
      return clean.slice(lastDot + 1).toLowerCase();
    }
  }

  return '';
};

const normalizeDepartment = (value = '') => {
  const normalized = String(value).trim().toLowerCase();

  if (normalized.includes('data')) return 'Data';
  if (normalized.includes('security')) return 'Security';
  if (
    normalized.includes('exploit') ||
    normalized.includes('system') ||
    normalized.includes('development')
  ) {
    return 'Exploitation';
  }

  return 'Security';
};

const formatShortDateLabel = (value) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(value);

const inferFileCategory = (doc = {}) => {
  const mimeType = String(doc.mimeType || '').toLowerCase();
  const resourceType = String(doc.resourceType || '').toLowerCase();
  const extension = getFileExtension(doc.originalName, doc.fileUrl);

  if (mimeType.startsWith('image/') || resourceType === 'image' || IMAGE_EXTENSIONS.has(extension)) {
    return 'image';
  }

  if (mimeType.startsWith('video/') || resourceType === 'video' || VIDEO_EXTENSIONS.has(extension)) {
    return 'video';
  }

  if (
    mimeType.startsWith('text/') ||
    mimeType.includes('json') ||
    mimeType.includes('javascript') ||
    mimeType.includes('xml') ||
    TEXT_EXTENSIONS.has(extension)
  ) {
    return 'text';
  }

  if (mimeType === 'application/pdf' || DOCUMENT_EXTENSIONS.has(extension)) {
    return 'document';
  }

  return 'file';
};

const isEditableFileCategory = (category = '') => ['image', 'video', 'text'].includes(category);
const isPreviewableFileCategory = (category = '') =>
  ['image', 'video', 'text', 'document'].includes(category);

const normalizeVote = (vote) => {
  if (!vote || !vote.userId) return null;
  return {
    userId: String(vote.userId),
    value: Number(vote.value) === -1 ? -1 : 1,
  };
};

const normalizeComment = (comment) => {
  if (!comment || !comment.text) return null;

  const createdAt = parseDate(comment.createdAt) || new Date();
  return {
    id: String(comment.id || comment._id || `${createdAt.getTime()}`),
    userId: String(comment.userId || ''),
    userName: comment.userName || 'Member',
    text: String(comment.text),
    createdAt,
  };
};

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getStartOfWeek = (value = new Date()) => {
  const date = startOfDay(value);
  const day = date.getDay();
  const offset = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - offset);
  return date;
};

const normalizeLocalUser = (user) => {
  if (!user) return null;

  const id = String(user.id || user._id);
  return {
    ...user,
    id,
    _id: id,
    email: normalizeEmail(user.email),
    username: user.username || user.name || '',
    usernameLower: user.usernameLower || getUsernameKey(user.username || user.name || ''),
    downloads: Number(user.downloads || 0),
    activity: Array.isArray(user.activity) ? user.activity : [0, 2, 5, 1, 4, 0, 0],
    mfaExpires: parseDate(user.mfaExpires),
    resetPasswordExpires: parseDate(user.resetPasswordExpires),
  };
};

const normalizeLocalPendingRegistration = (entry) => {
  if (!entry) return null;

  const id = String(entry.id || entry._id);
  return {
    ...entry,
    id,
    _id: id,
    email: normalizeEmail(entry.email),
    usernameLower: entry.usernameLower || getUsernameKey(entry.username),
    expiresAt: parseDate(entry.expiresAt),
  };
};

const normalizeLocalDocument = (doc) => {
  if (!doc) return null;

  const id = String(doc.id || doc._id);
  const votes = Array.isArray(doc.votes) ? doc.votes.map(normalizeVote).filter(Boolean) : [];
  const comments = Array.isArray(doc.comments)
    ? doc.comments.map(normalizeComment).filter(Boolean)
    : [];

  return {
    ...doc,
    id,
    _id: id,
    department: normalizeDepartment(doc.department),
    ownerId: String(doc.ownerId),
    approvalStatus: doc.approvalStatus === 'pending' ? 'pending' : 'approved',
    approvedAt: parseDate(doc.approvedAt),
    approvedBy: doc.approvedBy || '',
    downloadCount: Number(doc.downloadCount || 0),
    originalName: doc.originalName || '',
    mimeType: doc.mimeType || '',
    resourceType: doc.resourceType || '',
    publicId: doc.publicId || '',
    fileCategory: doc.fileCategory || inferFileCategory(doc),
    votes,
    comments,
    history: Array.isArray(doc.history)
      ? doc.history.map((entry) => ({
          ...entry,
          date: parseDate(entry.date) || new Date(),
        }))
      : [],
    updatedAt: parseDate(doc.updatedAt) || new Date(0),
    createdAt: parseDate(doc.createdAt) || new Date(0),
  };
};

const readLocalDb = async () => {
  try {
    const raw = await fs.readFile(LOCAL_DB_PATH, 'utf8');
    return ensureLocalDbShape(JSON.parse(raw));
  } catch (error) {
    if (error.code === 'ENOENT') {
      const initial = ensureLocalDbShape();
      await fs.writeFile(LOCAL_DB_PATH, JSON.stringify(initial, null, 2));
      return initial;
    }

    throw error;
  }
};

const writeLocalDb = async (db) => {
  await fs.writeFile(LOCAL_DB_PATH, JSON.stringify(ensureLocalDbShape(db), null, 2));
};

const assignRole = (email) =>
  normalizeEmail(email) === 'adamouchkouk16@gmail.com' ? 'admin' : 'user';

const createToken = (user) =>
  jwt.sign(
    {
      id: user._id || user.id,
      role: user.role,
      name: user.name,
      username: user.username,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

const publicUser = (user) => ({
  id: user._id || user.id,
  name: user.name,
  username: user.username,
  role: user.role,
  email: user.email,
});

const maskEmail = (email = '') => {
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  if (name.length <= 2) return `${name[0] || ''}***@${domain}`;
  return `${name.slice(0, 2)}${'*'.repeat(Math.max(name.length - 2, 2))}@${domain}`;
};

const verifyGoogleCredential = async (credential) => {
  if (!googleClient || !GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_AUTH_NOT_CONFIGURED');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload?.email || payload.email_verified === false) {
    throw new Error('GOOGLE_EMAIL_NOT_VERIFIED');
  }

  return payload;
};

const sendMailOrThrow = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
  } catch (error) {
    throw new Error('MAIL_DELIVERY_FAILED');
  }
};

const sendRegistrationCode = async ({ email, username, code }) => {
  await sendMailOrThrow({
    to: email,
    subject: 'ITDOC verification code',
    html: `
      <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 32px;">
        <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 18px; padding: 32px; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 8px; color: #1d4ed8; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">ITDOC</p>
          <h1 style="margin: 0 0 16px; color: #0f172a; font-size: 28px;">Verification code</h1>
          <p style="margin: 0 0 20px; color: #475569; line-height: 1.7;">Hello ${username}, use this code to finish creating your account.</p>
          <div style="padding: 18px 24px; border-radius: 16px; background: #eff6ff; color: #1e3a8a; font-size: 34px; letter-spacing: 0.32em; font-weight: 800; text-align: center;">${code}</div>
          <p style="margin: 20px 0 0; color: #64748b; line-height: 1.7;">This code expires in 10 minutes.</p>
        </div>
      </div>
    `,
  });
};

const sendLoginCode = async ({ email, code }) => {
  await sendMailOrThrow({
    to: email,
    subject: 'ITDOC login verification code',
    html: `
      <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 32px;">
        <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 18px; padding: 32px; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 8px; color: #1d4ed8; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">ITDOC</p>
          <h1 style="margin: 0 0 16px; color: #0f172a; font-size: 28px;">Login code</h1>
          <p style="margin: 0 0 20px; color: #475569; line-height: 1.7;">Use this code to finish signing in.</p>
          <div style="padding: 18px 24px; border-radius: 16px; background: #eff6ff; color: #1e3a8a; font-size: 34px; letter-spacing: 0.32em; font-weight: 800; text-align: center;">${code}</div>
          <p style="margin: 20px 0 0; color: #64748b; line-height: 1.7;">This code expires in 5 minutes.</p>
        </div>
      </div>
    `,
  });
};

const sendResetCode = async ({ email, code }) => {
  await sendMailOrThrow({
    to: email,
    subject: 'ITDOC password reset code',
    html: `
      <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 32px;">
        <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 18px; padding: 32px; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 8px; color: #1d4ed8; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">ITDOC</p>
          <h1 style="margin: 0 0 16px; color: #0f172a; font-size: 28px;">Reset your password</h1>
          <p style="margin: 0 0 20px; color: #475569; line-height: 1.7;">Use the code below to choose a new password.</p>
          <div style="padding: 18px 24px; border-radius: 16px; background: #eff6ff; color: #1e3a8a; font-size: 34px; letter-spacing: 0.32em; font-weight: 800; text-align: center;">${code}</div>
          <p style="margin: 20px 0 0; color: #64748b; line-height: 1.7;">This code expires in 10 minutes.</p>
        </div>
      </div>
    `,
  });
};

const findUserByEmail = async (email) => {
  if (isMongoReady()) return User.findOne({ email });

  const db = await readLocalDb();
  return normalizeLocalUser(db.users.find((user) => normalizeEmail(user.email) === email));
};

const findUserById = async (userId) => {
  if (isMongoReady()) return User.findById(userId);

  const db = await readLocalDb();
  return normalizeLocalUser(db.users.find((user) => String(user.id || user._id) === String(userId)));
};

const findUserByUsernameLower = async (usernameLower) => {
  if (isMongoReady()) return User.findOne({ usernameLower });

  const db = await readLocalDb();
  return normalizeLocalUser(
    db.users.find(
      (user) => (user.usernameLower || getUsernameKey(user.username || user.name || '')) === usernameLower
    )
  );
};

const findUserByIdentifier = async (identifier) => {
  const normalizedEmail = normalizeEmail(identifier);
  const usernameLower = identifier.trim().toLowerCase();

  if (isMongoReady()) {
    return User.findOne({
      $or: [{ email: normalizedEmail }, { usernameLower }],
    });
  }

  const db = await readLocalDb();
  const match = db.users.find((user) => {
    const localUser = normalizeLocalUser(user);
    return (
      localUser.email === normalizedEmail ||
      localUser.usernameLower === usernameLower ||
      String(localUser.id) === String(identifier)
    );
  });

  return normalizeLocalUser(match);
};

const createUserRecord = async (payload) => {
  if (isMongoReady()) return User.create(payload);

  const db = await readLocalDb();
  const now = new Date().toISOString();
  const record = {
    id: makeLocalId(),
    name: payload.name,
    username: payload.username,
    usernameLower: payload.usernameLower,
    email: normalizeEmail(payload.email),
    password: payload.password || '',
    role: payload.role || 'user',
    mfaCode: null,
    mfaExpires: null,
    resetPasswordCode: null,
    resetPasswordExpires: null,
    downloads: 0,
    activity: [0, 2, 5, 1, 4, 0, 0],
    createdAt: now,
    updatedAt: now,
  };

  db.users.push(record);
  await writeLocalDb(db);
  return normalizeLocalUser(record);
};

const updateUserRecord = async (userId, updates) => {
  if (isMongoReady()) return User.findByIdAndUpdate(userId, updates, { new: true });

  const db = await readLocalDb();
  const index = db.users.findIndex((user) => String(user.id || user._id) === String(userId));

  if (index === -1) return null;

  db.users[index] = {
    ...db.users[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await writeLocalDb(db);
  return normalizeLocalUser(db.users[index]);
};

const searchUsers = async (query, viewer) => {
  if (isMongoReady()) {
    const safeQuery = escapeRegex(query);
    const users = await User.find(
      query
        ? {
            $or: [
              { name: new RegExp(safeQuery, 'i') },
              { email: new RegExp(safeQuery, 'i') },
              { username: new RegExp(safeQuery, 'i') },
            ],
          }
        : {}
    ).select('-password -mfaCode -mfaExpires -resetPasswordCode -resetPasswordExpires');

    const documents = await Document.find().select('ownerId createdAt updatedAt history approvalStatus');
    return attachWeeklySentStats(users, documents, viewer);
  }

  const db = await readLocalDb();
  const safeQuery = query.toLowerCase();

  const users = db.users
    .map(normalizeLocalUser)
    .filter(
      (user) =>
        !query ||
        user.name?.toLowerCase().includes(safeQuery) ||
        user.email?.toLowerCase().includes(safeQuery) ||
        user.username?.toLowerCase().includes(safeQuery)
    )
    .map(({ password, mfaCode, mfaExpires, resetPasswordCode, resetPasswordExpires, ...user }) => user);

  const documents = db.documents.map(normalizeLocalDocument);
  return attachWeeklySentStats(users, documents, viewer);
};

const promoteUserRecord = async (targetId) => {
  if (isMongoReady()) {
    await User.findByIdAndUpdate(targetId, { role: 'admin' });
    return;
  }

  await updateUserRecord(targetId, { role: 'admin' });
};

const deleteExpiredPendingRegistrations = async () => {
  if (isMongoReady()) {
    await PendingRegistration.deleteMany({ expiresAt: { $lte: new Date() } });
    return;
  }

  const db = await readLocalDb();
  db.pendingRegistrations = db.pendingRegistrations.filter((entry) => {
    const expiresAt = parseDate(entry.expiresAt);
    return expiresAt && expiresAt.getTime() > Date.now();
  });
  await writeLocalDb(db);
};

const findPendingRegistrationByEmail = async (email) => {
  if (isMongoReady()) return PendingRegistration.findOne({ email });

  const db = await readLocalDb();
  return normalizeLocalPendingRegistration(
    db.pendingRegistrations.find((entry) => normalizeEmail(entry.email) === email)
  );
};

const findPendingRegistrationByUsernameLower = async (usernameLower) => {
  if (isMongoReady()) return PendingRegistration.findOne({ usernameLower });

  const db = await readLocalDb();
  return normalizeLocalPendingRegistration(
    db.pendingRegistrations.find(
      (entry) => (entry.usernameLower || getUsernameKey(entry.username || '')) === usernameLower
    )
  );
};

const upsertPendingRegistration = async (payload) => {
  if (isMongoReady()) {
    return PendingRegistration.findOneAndUpdate(
      { email: payload.email },
      payload,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const db = await readLocalDb();
  const index = db.pendingRegistrations.findIndex(
    (entry) => normalizeEmail(entry.email) === normalizeEmail(payload.email)
  );
  const now = new Date().toISOString();
  const record = {
    id: index === -1 ? makeLocalId() : db.pendingRegistrations[index].id,
    username: payload.username,
    usernameLower: payload.usernameLower,
    email: normalizeEmail(payload.email),
    passwordHash: payload.passwordHash,
    verificationCode: payload.verificationCode,
    expiresAt: payload.expiresAt.toISOString(),
    updatedAt: now,
    createdAt: index === -1 ? now : db.pendingRegistrations[index].createdAt || now,
  };

  if (index === -1) {
    db.pendingRegistrations.push(record);
  } else {
    db.pendingRegistrations[index] = record;
  }

  await writeLocalDb(db);
  return normalizeLocalPendingRegistration(record);
};

const deletePendingRegistration = async (pendingId) => {
  if (isMongoReady()) {
    await PendingRegistration.deleteOne({ _id: pendingId });
    return;
  }

  const db = await readLocalDb();
  db.pendingRegistrations = db.pendingRegistrations.filter(
    (entry) => String(entry.id || entry._id) !== String(pendingId)
  );
  await writeLocalDb(db);
};

const listDocuments = async () => {
  if (isMongoReady()) {
    return Document.find().sort({ updatedAt: -1 });
  }

  const db = await readLocalDb();
  return db.documents
    .map(normalizeLocalDocument)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
};

const createDocumentRecord = async (payload) => {
  const normalizedPayload = {
    ...payload,
    department: normalizeDepartment(payload.department),
    fileCategory: payload.fileCategory || inferFileCategory(payload),
  };

  if (isMongoReady()) {
    return Document.create(normalizedPayload);
  }

  const db = await readLocalDb();
  const now = new Date().toISOString();
const record = {
    id: makeLocalId(),
    title: normalizedPayload.title,
    description: normalizedPayload.description,
    department: normalizedPayload.department,
    fileUrl: normalizedPayload.fileUrl,
    originalName: normalizedPayload.originalName || '',
    mimeType: normalizedPayload.mimeType || '',
    resourceType: normalizedPayload.resourceType || '',
    publicId: normalizedPayload.publicId || '',
    fileCategory: normalizedPayload.fileCategory,
    ownerId: String(normalizedPayload.ownerId),
    ownerName: normalizedPayload.ownerName,
    approvalStatus: normalizedPayload.approvalStatus === 'pending' ? 'pending' : 'approved',
    approvedAt: normalizedPayload.approvedAt || null,
    approvedBy: normalizedPayload.approvedBy || '',
    downloadCount: Number(normalizedPayload.downloadCount || 0),
    votes: Array.isArray(normalizedPayload.votes) ? normalizedPayload.votes : [],
    comments: Array.isArray(normalizedPayload.comments) ? normalizedPayload.comments : [],
    history: Array.isArray(normalizedPayload.history) ? normalizedPayload.history : [],
    createdAt: now,
    updatedAt: now,
  };

  db.documents.push(record);
  await writeLocalDb(db);
  return normalizeLocalDocument(record);
};

const findDocumentById = async (docId) => {
  if (isMongoReady()) return Document.findById(docId);

  const db = await readLocalDb();
  return normalizeLocalDocument(
    db.documents.find((doc) => String(doc.id || doc._id) === String(docId))
  );
};

const updateDocumentRecord = async (docId, updates) => {
  if (isMongoReady()) return Document.findByIdAndUpdate(docId, updates, { new: true });

  const db = await readLocalDb();
  const index = db.documents.findIndex((doc) => String(doc.id || doc._id) === String(docId));

  if (index === -1) return null;

  db.documents[index] = {
    ...db.documents[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await writeLocalDb(db);
  return normalizeLocalDocument(db.documents[index]);
};

const deleteDocumentRecord = async (docId) => {
  if (isMongoReady()) {
    await Document.findByIdAndDelete(docId);
    return;
  }

  const db = await readLocalDb();
  db.documents = db.documents.filter((doc) => String(doc.id || doc._id) !== String(docId));
  await writeLocalDb(db);
};

const buildWeeklySentSeries = (documents, ownerId) => {
  const weekStart = getStartOfWeek(new Date());
  const counts = Array(7).fill(0);

  documents.forEach((document) => {
    if (String(document.ownerId) !== String(ownerId)) return;

    const sentAt =
      parseDate(document.createdAt) ||
      parseDate(document.history?.[0]?.date) ||
      parseDate(document.updatedAt);

    if (!sentAt) return;

    const normalizedDate = startOfDay(sentAt);
    const diffInDays = Math.floor((normalizedDate.getTime() - weekStart.getTime()) / 86400000);

    if (diffInDays >= 0 && diffInDays < 7) {
      counts[diffInDays] += 1;
    }
  });

  return counts;
};

const buildRollingSentSeries = (documents, ownerId, days) => {
  const today = startOfDay(new Date());
  const firstDay = new Date(today);
  firstDay.setDate(today.getDate() - (days - 1));

  const labels = [];
  const counts = Array(days).fill(0);

  for (let index = 0; index < days; index += 1) {
    const day = new Date(firstDay);
    day.setDate(firstDay.getDate() + index);
    labels.push(formatShortDateLabel(day));
  }

  documents.forEach((document) => {
    if (String(document.ownerId) !== String(ownerId)) return;

    const sentAt =
      parseDate(document.createdAt) ||
      parseDate(document.history?.[0]?.date) ||
      parseDate(document.updatedAt);

    if (!sentAt) return;

    const normalizedDate = startOfDay(sentAt);
    const diffInDays = Math.floor((normalizedDate.getTime() - firstDay.getTime()) / 86400000);

    if (diffInDays >= 0 && diffInDays < days) {
      counts[diffInDays] += 1;
    }
  });

  return {
    labels,
    data: counts,
    total: counts.reduce((sum, value) => sum + value, 0),
  };
};

const buildContributionBreakdown = (documents, ownerId) => {
  const totals = Object.fromEntries(DEPARTMENT_OPTIONS.map((department) => [department, 0]));

  documents.forEach((document) => {
    if (String(document.ownerId) !== String(ownerId)) return;
    const department = normalizeDepartment(document.department);
    totals[department] += 1;
  });

  return {
    labels: DEPARTMENT_OPTIONS,
    data: DEPARTMENT_OPTIONS.map((department) => totals[department]),
  };
};

const buildUserDocumentSummaries = (documents, ownerId) =>
  documents
    .filter((document) => String(document.ownerId) === String(ownerId))
    .map((document) => serializeDocument(document, null, { includeComments: false }))
    .sort((a, b) => {
      const scoreDiff = Number(b.score || 0) - Number(a.score || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

const asDocumentRecord = (doc) =>
  normalizeLocalDocument(typeof doc?.toObject === 'function' ? doc.toObject() : doc);

const isDocumentApproved = (doc) => asDocumentRecord(doc)?.approvalStatus !== 'pending';

const isDocumentManager = (user, doc) =>
  Boolean(user) && (user.role === 'admin' || String(user.id || user._id) === String(doc.ownerId));

const canApproveDocument = (user, doc) =>
  Boolean(user) && user.role === 'admin' && asDocumentRecord(doc)?.approvalStatus === 'pending';

const canViewDocument = (user, doc) => isDocumentApproved(doc) || isDocumentManager(user, doc);

const attachWeeklySentStats = (users, documents, viewer) =>
  users.map((user) => {
    const ownerId = user._id || user.id;
    const visibleDocuments = documents.filter((document) => canViewDocument(viewer, document));
    const weeklySent = buildWeeklySentSeries(visibleDocuments, ownerId);

    return {
      ...(typeof user.toObject === 'function' ? user.toObject() : user),
      weeklySent,
      weeklySentLabels: WEEKDAY_LABELS,
      weeklySentTotal: weeklySent.reduce((sum, value) => sum + value, 0),
    };
  });

const buildUserActivityPayload = (user, documents, viewer) => {
  const ownerId = user._id || user.id;
  const visibleDocuments = documents.filter((document) => canViewDocument(viewer, document));
  const allDocuments = buildUserDocumentSummaries(visibleDocuments, ownerId);
  const contributions = buildContributionBreakdown(visibleDocuments, ownerId);

  return {
    user: publicUser(user),
    totals: {
      documents: allDocuments.length,
      score: allDocuments.reduce((sum, document) => sum + Number(document.score || 0), 0),
      comments: allDocuments.reduce((sum, document) => sum + Number(document.commentCount || 0), 0),
    },
    activity: {
      week: buildRollingSentSeries(visibleDocuments, ownerId, 7),
      twoWeeks: buildRollingSentSeries(visibleDocuments, ownerId, 14),
      month: buildRollingSentSeries(visibleDocuments, ownerId, 30),
    },
    contributions,
    documents: allDocuments,
  };
};

const getDocumentScore = (doc) =>
  (Array.isArray(doc.votes) ? doc.votes : []).reduce((sum, vote) => sum + Number(vote.value || 0), 0);

const getViewerVote = (doc, viewerId) => {
  if (!viewerId) return 0;
  const vote = (Array.isArray(doc.votes) ? doc.votes : []).find(
    (entry) => String(entry.userId) === String(viewerId)
  );
  return vote ? Number(vote.value || 0) : 0;
};

const serializeDocument = (doc, viewer, { includeComments = true } = {}) => {
  const normalized = normalizeLocalDocument(typeof doc?.toObject === 'function' ? doc.toObject() : doc);
  if (!normalized) return null;

  const serialized = {
    ...normalized,
    score: getDocumentScore(normalized),
    viewerVote: getViewerVote(normalized, viewer?.id || viewer?._id),
    commentCount: normalized.comments.length,
    isPending: normalized.approvalStatus === 'pending',
    canManage: isDocumentManager(viewer, normalized),
    canApprove: canApproveDocument(viewer, normalized),
    canPreview: isPreviewableFileCategory(normalized.fileCategory),
    canEditContent:
      isDocumentManager(viewer, normalized) && isEditableFileCategory(normalized.fileCategory),
  };

  delete serialized.votes;
  if (!includeComments) delete serialized.comments;

  return serialized;
};

const removeCloudinaryAsset = async (doc) => {
  if (!doc?.publicId) return;

  try {
    await cloudinary.uploader.destroy(doc.publicId, {
      resource_type: doc.resourceType || 'raw',
      invalidate: true,
    });
  } catch (error) {
    console.error('Cloudinary cleanup failed:', error.message);
  }
};

const uploadTextDocumentContent = async ({ content, originalName }) => {
  const extension = getFileExtension(originalName) || 'txt';
  const safeBaseName =
    path
      .basename(originalName || `document.${extension}`, path.extname(originalName || `document.${extension}`))
      .replace(/[^a-z0-9_-]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'document';
  const tempFilePath = path.join(os.tmpdir(), `itcore-${Date.now()}-${safeBaseName}.${extension}`);

  await fs.writeFile(tempFilePath, content, 'utf8');

  try {
    const result = await cloudinary.uploader.upload(tempFilePath, {
      folder: 'itcore',
      resource_type: 'raw',
    });

    return {
      fileUrl: result.secure_url || result.url,
      publicId: result.public_id || '',
      resourceType: result.resource_type || 'raw',
      mimeType: 'text/plain',
      originalName: originalName || `${safeBaseName}.${extension}`,
    };
  } finally {
    await fs.unlink(tempFilePath).catch(() => {});
  }
};

const buildUniqueUsername = async (seed) => {
  const raw = normalizeUsername(seed)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '.')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 20);

  const base = raw || 'member';
  let candidate = base;
  let suffix = 0;

  while ((await findUserByUsernameLower(candidate)) || (await findPendingRegistrationByUsernameLower(candidate))) {
    suffix += 1;
    const trimmedBase = base.slice(0, Math.max(3, 24 - String(suffix).length));
    candidate = `${trimmedBase}${suffix}`;
  }

  return candidate;
};

const protect = (req, res, next) => {
  try {
    const rawToken = req.headers.authorization || '';
    const token = rawToken.replace(/^Bearer\s+/i, '');
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

app.post('/api/auth/register/request-code', async (req, res) => {
  try {
    const username = normalizeUsername(req.body.username);
    const usernameLower = getUsernameKey(username);
    const email = normalizeEmail(req.body.email);
    const password = req.body.password || '';
    const confirmPassword = req.body.confirmPassword || '';

    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Please complete all register fields.' });
    }

    if (!isValidUsername(username)) {
      return res.status(400).json({
        message: 'Username must be 3 to 24 characters and use only letters, numbers, dots, underscores, or hyphens.',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    await deleteExpiredPendingRegistrations();

    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ message: 'This email is already used by another account.' });
    }

    const existingUsername = await findUserByUsernameLower(usernameLower);
    if (existingUsername) {
      return res.status(409).json({ message: 'This username is already taken.' });
    }

    const pendingUsername = await findPendingRegistrationByUsernameLower(usernameLower);
    if (pendingUsername && pendingUsername.email !== email) {
      return res.status(409).json({ message: 'This username is already waiting for verification.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationCode = generateSixDigitCode();
    const expiresAt = new Date(Date.now() + REGISTRATION_CODE_LIFETIME_MS);

    await upsertPendingRegistration({
      username,
      usernameLower,
      email,
      passwordHash,
      verificationCode,
      expiresAt,
    });

    await sendRegistrationCode({ email, username, code: verificationCode });

    res.json({
      message: `Verification code sent to ${maskEmail(email)}.`,
      email,
    });
  } catch (error) {
    const message =
      error.message === 'MAIL_DELIVERY_FAILED'
        ? 'We could not send the verification email right now. Please try again.'
        : 'Registration could not be started right now. Please try again.';

    res.status(500).json({ message });
  }
});

app.post('/api/auth/register/verify-code', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || '').trim();

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required.' });
    }

    const pending = await findPendingRegistrationByEmail(email);
    if (!pending) {
      return res.status(404).json({ message: 'No pending registration was found. Please register again.' });
    }

    if (!pending.expiresAt || pending.expiresAt.getTime() <= Date.now()) {
      await deletePendingRegistration(pending._id || pending.id);
      return res.status(400).json({ message: 'The verification code expired. Please request a new code.' });
    }

    if (pending.verificationCode !== code) {
      return res.status(400).json({ message: 'The verification code you entered is incorrect.' });
    }

    const accountExistsByEmail = await findUserByEmail(pending.email);
    const accountExistsByUsername = await findUserByUsernameLower(pending.usernameLower);
    if (accountExistsByEmail || accountExistsByUsername) {
      await deletePendingRegistration(pending._id || pending.id);
      return res.status(409).json({
        message: 'This username or email is already used. Please restart the registration with different details.',
      });
    }

    const user = await createUserRecord({
      name: pending.username,
      username: pending.username,
      usernameLower: pending.usernameLower,
      email: pending.email,
      password: pending.passwordHash,
      role: assignRole(pending.email),
    });

    await deletePendingRegistration(pending._id || pending.id);

    res.json({
      message: 'Account created successfully.',
      token: createToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: 'The account could not be created right now. Please try again.' });
  }
});

app.post('/api/auth/login-step1', async (req, res) => {
  try {
    const identifier = String(req.body.identifier || req.body.email || '').trim();
    const password = req.body.password || '';

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Enter your email or username and your password.' });
    }

    const user = await findUserByIdentifier(identifier);
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid email, username, or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email, username, or password.' });
    }

    const code = generateSixDigitCode();
    await updateUserRecord(user._id || user.id, {
      mfaCode: code,
      mfaExpires: new Date(Date.now() + LOGIN_CODE_LIFETIME_MS),
    });

    await sendLoginCode({ email: user.email, code });

    res.json({
      status: 'MFA_REQUIRED',
      email: user.email,
    });
  } catch (error) {
    const message =
      error.message === 'MAIL_DELIVERY_FAILED'
        ? 'We could not send the login verification code right now. Please try again.'
        : 'Login could not continue right now. Please try again.';

    res.status(500).json({ message });
  }
});

app.post('/api/auth/login-step2', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || '').trim();

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and security code are required.' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'This login session was not found. Please sign in again.' });
    }

    if (!user.mfaCode || !user.mfaExpires || user.mfaExpires.getTime() <= Date.now()) {
      await updateUserRecord(user._id || user.id, {
        mfaCode: null,
        mfaExpires: null,
      });
      return res.status(401).json({ message: 'Your login code expired. Please sign in again to get a new one.' });
    }

    if (user.mfaCode !== code) {
      return res.status(401).json({ message: 'The security code you entered is incorrect.' });
    }

    const updatedUser = await updateUserRecord(user._id || user.id, {
      mfaCode: null,
      mfaExpires: null,
    });

    res.json({
      token: createToken(updatedUser || user),
      user: publicUser(updatedUser || user),
    });
  } catch (error) {
    res.status(500).json({ message: 'The login code could not be verified right now. Please try again.' });
  }
});

app.post('/api/auth/forgot-password/request-code', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'No account was found with that email address.' });
    }

    const code = generateSixDigitCode();
    await updateUserRecord(user._id || user.id, {
      resetPasswordCode: code,
      resetPasswordExpires: new Date(Date.now() + RESET_CODE_LIFETIME_MS),
    });

    await sendResetCode({ email, code });

    res.json({ message: `Reset code sent to ${maskEmail(email)}.` });
  } catch (error) {
    const message =
      error.message === 'MAIL_DELIVERY_FAILED'
        ? 'We could not send the reset code right now. Please try again.'
        : 'Password reset could not be started right now. Please try again.';

    res.status(500).json({ message });
  }
});

app.post('/api/auth/forgot-password/reset', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || '').trim();
    const newPassword = req.body.newPassword || '';
    const confirmPassword = req.body.confirmPassword || '';

    if (!email || !code || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Please complete all reset fields.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'No account was found with that email address.' });
    }

    if (!user.resetPasswordCode || !user.resetPasswordExpires || user.resetPasswordExpires.getTime() <= Date.now()) {
      await updateUserRecord(user._id || user.id, {
        resetPasswordCode: null,
        resetPasswordExpires: null,
      });
      return res.status(400).json({ message: 'The reset code expired. Please request a new one.' });
    }

    if (user.resetPasswordCode !== code) {
      return res.status(400).json({ message: 'The reset code you entered is incorrect.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await updateUserRecord(user._id || user.id, {
      password: passwordHash,
      resetPasswordCode: null,
      resetPasswordExpires: null,
      mfaCode: null,
      mfaExpires: null,
    });

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'The password could not be updated right now. Please try again.' });
  }
});

app.post('/api/auth/google', async (req, res) => {
  try {
    const credential = String(req.body.credential || '').trim();

    if (!credential) {
      return res.status(400).json({ message: 'Google sign-in data is required.' });
    }

    const payload = await verifyGoogleCredential(credential);
    const email = normalizeEmail(payload.email);
    const name = normalizeUsername(payload.name || payload.given_name || email.split('@')[0] || 'Member');

    let user = await findUserByEmail(email);

    if (!user) {
      const username = await buildUniqueUsername(name);
      user = await createUserRecord({
        name,
        username,
        usernameLower: username.toLowerCase(),
        email,
        role: assignRole(email),
      });
    } else if (!user.usernameLower) {
      const username = await buildUniqueUsername(user.username || user.name || email.split('@')[0]);
      user = await updateUserRecord(user._id || user.id, {
        username,
        usernameLower: username.toLowerCase(),
        name: user.name || username,
      });
    }

    res.json({
      token: createToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    const message =
      error.message === 'GOOGLE_AUTH_NOT_CONFIGURED'
        ? 'Google sign-in is not configured yet.'
        : error.message === 'GOOGLE_EMAIL_NOT_VERIFIED'
          ? 'Your Google account email must be verified.'
          : 'Google sign-in failed.';

    const status = error.message === 'GOOGLE_AUTH_NOT_CONFIGURED' ? 503 : 401;
    res.status(status).json({ message });
  }
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'itcore', resource_type: 'auto' },
});

const upload = multer({ storage });
const DOCUMENT_TITLE_MAX_LENGTH = 15;

app.get('/api/documents', protect, async (req, res) => {
  const docs = await listDocuments();
  const visibleDocs = docs.filter((doc) => canViewDocument(req.user, doc));
  res.json(visibleDocs.map((doc) => serializeDocument(doc, req.user, { includeComments: false })));
});

app.get('/api/documents/:docId', protect, async (req, res) => {
  try {
    const doc = await findDocumentById(req.params.docId);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    if (!canViewDocument(req.user, doc)) {
      return res.status(403).json({ message: 'This document is still pending admin approval.' });
    }

    res.json(serializeDocument(doc, req.user));
  } catch (error) {
    res.status(500).json({ message: 'The document could not be loaded right now.' });
  }
});

app.get('/api/documents/:docId/text', protect, async (req, res) => {
  try {
    const doc = await findDocumentById(req.params.docId);
    const normalizedDoc = normalizeLocalDocument(typeof doc?.toObject === 'function' ? doc.toObject() : doc);

    if (!normalizedDoc) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    if (!canViewDocument(req.user, normalizedDoc)) {
      return res.status(403).json({ message: 'This document is still pending admin approval.' });
    }

    if (normalizedDoc.fileCategory !== 'text') {
      return res.status(400).json({ message: 'This file cannot be opened as editable text.' });
    }

    const response = await fetch(normalizedDoc.fileUrl);
    if (!response.ok) {
      return res.status(502).json({ message: 'The text content could not be loaded right now.' });
    }

    const content = await response.text();
    res.json({ content });
  } catch (error) {
    res.status(500).json({ message: 'The text content could not be loaded right now.' });
  }
});

app.post('/api/upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please choose a file to upload.' });
    }

    const title = String(req.body.title || '').trim();
    if (!title) {
      return res.status(400).json({ message: 'Title is required.' });
    }

    if (title.length > DOCUMENT_TITLE_MAX_LENGTH) {
      return res
        .status(400)
        .json({ message: `Title must be ${DOCUMENT_TITLE_MAX_LENGTH} characters or less.` });
    }

    const authorName = req.user.name || req.user.username || 'Unknown user';
    const resourceType = req.file.resource_type || req.file.resourceType || 'raw';
    const mimeType = req.file.mimetype || '';
    const originalName = req.file.originalname || req.file.display_name || req.body.title;
    const newDoc = await createDocumentRecord({
      ...req.body,
      fileUrl: req.file.path,
      originalName,
      mimeType,
      resourceType,
      publicId: req.file.filename || req.file.public_id || '',
      fileCategory: inferFileCategory({
        mimeType,
        resourceType,
        originalName,
        fileUrl: req.file.path,
      }),
      ownerId: req.user.id,
      ownerName: authorName,
      approvalStatus: 'pending',
      approvedAt: null,
      approvedBy: '',
      votes: [],
      comments: [],
      history: [
        {
          version: 1,
          url: req.file.path,
          updatedBy: authorName,
          date: new Date(),
        },
      ],
    });

    res.json(serializeDocument(newDoc, req.user));
  } catch (error) {
    res.status(500).json({ message: 'The document could not be uploaded right now.' });
  }
});

app.post('/api/documents/:docId/approve', protect, async (req, res) => {
  try {
    const doc = await findDocumentById(req.params.docId);
    const normalizedDoc = normalizeLocalDocument(typeof doc?.toObject === 'function' ? doc.toObject() : doc);

    if (!normalizedDoc) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    if (!canApproveDocument(req.user, normalizedDoc)) {
      return res.status(403).json({ message: 'Only an admin can approve this pending document.' });
    }

    const updatedDoc = await updateDocumentRecord(normalizedDoc._id || normalizedDoc.id, {
      approvalStatus: 'approved',
      approvedAt: new Date(),
      approvedBy: req.user.name || req.user.username || 'Admin',
    });

    res.json(serializeDocument(updatedDoc, req.user));
  } catch (error) {
    res.status(500).json({ message: 'The document could not be approved right now.' });
  }
});

app.patch('/api/documents/:docId', protect, async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    const description = String(req.body.description || '').trim();

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are both required.' });
    }

    if (title.length > DOCUMENT_TITLE_MAX_LENGTH) {
      return res
        .status(400)
        .json({ message: `Title must be ${DOCUMENT_TITLE_MAX_LENGTH} characters or less.` });
    }

    const doc = await findDocumentById(req.params.docId);
    const normalizedDoc = normalizeLocalDocument(typeof doc?.toObject === 'function' ? doc.toObject() : doc);

    if (!normalizedDoc) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    if (!isDocumentManager(req.user, normalizedDoc)) {
      return res.status(403).json({ message: 'Only the sender or an admin can modify this document.' });
    }

    const updatedDoc = await updateDocumentRecord(normalizedDoc._id || normalizedDoc.id, {
      title,
      description,
    });

    res.json(serializeDocument(updatedDoc, req.user));
  } catch (error) {
    res.status(500).json({ message: 'The document could not be updated right now.' });
  }
});

app.put('/api/documents/:docId/file', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please choose a replacement file first.' });
    }

    const doc = await findDocumentById(req.params.docId);
    const normalizedDoc = normalizeLocalDocument(typeof doc?.toObject === 'function' ? doc.toObject() : doc);

    if (!normalizedDoc) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    if (!isDocumentManager(req.user, normalizedDoc)) {
      return res.status(403).json({ message: 'Only the sender or an admin can edit this file.' });
    }

    const updatedBy = req.user.name || req.user.username || 'Unknown user';
    const resourceType = req.file.resource_type || req.file.resourceType || 'raw';
    const mimeType = req.file.mimetype || '';
    const originalName = req.file.originalname || req.file.display_name || normalizedDoc.originalName;
    const nextVersion =
      normalizedDoc.history.reduce((max, entry) => Math.max(max, Number(entry.version || 0)), 0) + 1;

    const updatedDoc = await updateDocumentRecord(normalizedDoc._id || normalizedDoc.id, {
      fileUrl: req.file.path,
      originalName,
      mimeType,
      resourceType,
      publicId: req.file.filename || req.file.public_id || '',
      fileCategory: inferFileCategory({
        mimeType,
        resourceType,
        originalName,
        fileUrl: req.file.path,
      }),
      history: [
        ...normalizedDoc.history,
        {
          version: nextVersion,
          url: req.file.path,
          updatedBy,
          date: new Date(),
        },
      ],
    });

    await removeCloudinaryAsset(normalizedDoc);
    res.json(serializeDocument(updatedDoc, req.user));
  } catch (error) {
    res.status(500).json({ message: 'The file could not be replaced right now.' });
  }
});

app.put('/api/documents/:docId/text', protect, async (req, res) => {
  try {
    const content = String(req.body.content || '');
    if (!content.trim()) {
      return res.status(400).json({ message: 'Text content cannot be empty.' });
    }

    const doc = await findDocumentById(req.params.docId);
    const normalizedDoc = normalizeLocalDocument(typeof doc?.toObject === 'function' ? doc.toObject() : doc);

    if (!normalizedDoc) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    if (!isDocumentManager(req.user, normalizedDoc)) {
      return res.status(403).json({ message: 'Only the sender or an admin can edit this text file.' });
    }

    if (normalizedDoc.fileCategory !== 'text') {
      return res.status(400).json({ message: 'Only readable text documents can be edited here.' });
    }

    const uploadedText = await uploadTextDocumentContent({
      content,
      originalName: normalizedDoc.originalName || `${normalizedDoc.title || 'document'}.txt`,
    });
    const updatedBy = req.user.name || req.user.username || 'Unknown user';
    const nextVersion =
      normalizedDoc.history.reduce((max, entry) => Math.max(max, Number(entry.version || 0)), 0) + 1;

    const updatedDoc = await updateDocumentRecord(normalizedDoc._id || normalizedDoc.id, {
      fileUrl: uploadedText.fileUrl,
      originalName: uploadedText.originalName,
      mimeType: uploadedText.mimeType,
      resourceType: uploadedText.resourceType,
      publicId: uploadedText.publicId,
      fileCategory: 'text',
      history: [
        ...normalizedDoc.history,
        {
          version: nextVersion,
          url: uploadedText.fileUrl,
          updatedBy,
          date: new Date(),
        },
      ],
    });

    await removeCloudinaryAsset(normalizedDoc);
    res.json(serializeDocument(updatedDoc, req.user));
  } catch (error) {
    res.status(500).json({ message: 'The text document could not be saved right now.' });
  }
});

app.delete('/api/documents/:docId', protect, async (req, res) => {
  try {
    const doc = await findDocumentById(req.params.docId);
    const normalizedDoc = normalizeLocalDocument(typeof doc?.toObject === 'function' ? doc.toObject() : doc);

    if (!normalizedDoc) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    if (!isDocumentManager(req.user, normalizedDoc)) {
      return res.status(403).json({ message: 'Only the sender or an admin can delete this document.' });
    }

    await deleteDocumentRecord(normalizedDoc._id || normalizedDoc.id);
    await removeCloudinaryAsset(normalizedDoc);
    res.json({ message: 'Document deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'The document could not be deleted right now.' });
  }
});

app.post('/api/documents/:docId/vote', protect, async (req, res) => {
  try {
    const value = Number(req.body.value);
    if (![1, -1].includes(value)) {
      return res.status(400).json({ message: 'Vote must be either like or dislike.' });
    }

    const doc = await findDocumentById(req.params.docId);
    const normalizedDoc = normalizeLocalDocument(typeof doc?.toObject === 'function' ? doc.toObject() : doc);

    if (!normalizedDoc) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    if (!canViewDocument(req.user, normalizedDoc)) {
      return res.status(403).json({ message: 'This document is still pending admin approval.' });
    }

    const nextVotes = normalizedDoc.votes.filter(
      (entry) => String(entry.userId) !== String(req.user.id)
    );
    nextVotes.push({ userId: String(req.user.id), value });

    const updatedDoc = await updateDocumentRecord(normalizedDoc._id || normalizedDoc.id, {
      votes: nextVotes,
    });

    res.json(serializeDocument(updatedDoc, req.user));
  } catch (error) {
    res.status(500).json({ message: 'Your vote could not be saved right now.' });
  }
});

app.post('/api/documents/:docId/comments', protect, async (req, res) => {
  try {
    const text = String(req.body.text || '').trim();
    if (!text) {
      return res.status(400).json({ message: 'Please write a comment before posting it.' });
    }

    const doc = await findDocumentById(req.params.docId);
    const normalizedDoc = normalizeLocalDocument(typeof doc?.toObject === 'function' ? doc.toObject() : doc);

    if (!normalizedDoc) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    if (!canViewDocument(req.user, normalizedDoc)) {
      return res.status(403).json({ message: 'This document is still pending admin approval.' });
    }

    const comment = {
      id: makeLocalId(),
      userId: String(req.user.id),
      userName: req.user.name || req.user.username || 'Member',
      text,
      createdAt: new Date(),
    };

    const updatedDoc = await updateDocumentRecord(normalizedDoc._id || normalizedDoc.id, {
      comments: [...normalizedDoc.comments, comment],
    });

    res.json(serializeDocument(updatedDoc, req.user));
  } catch (error) {
    res.status(500).json({ message: 'Your comment could not be posted right now.' });
  }
});

app.get('/api/download/:docId', protect, async (req, res) => {
  try {
    const doc = await findDocumentById(req.params.docId);
    if (!doc) return res.status(404).json({ message: 'Document not found.' });

    if (!canViewDocument(req.user, doc)) {
      return res.status(403).json({ message: 'This document is still pending admin approval.' });
    }

    await updateDocumentRecord(doc._id || doc.id, {
      downloadCount: Number(doc.downloadCount || 0) + 1,
    });

    const owner = await findUserById(doc.ownerId);
    if (owner) {
      await updateUserRecord(owner._id || owner.id, {
        downloads: Number(owner.downloads || 0) + 1,
      });
    }

    res.json({ url: doc.fileUrl });
  } catch (error) {
    res.status(500).json({ message: 'The download could not be prepared right now.' });
  }
});

app.get('/api/users/:userId/activity', protect, async (req, res) => {
  try {
    const user = await findUserById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const documents = await listDocuments();
    res.json(buildUserActivityPayload(user, documents, req.user));
  } catch (error) {
    res.status(500).json({ message: 'The staff activity could not be loaded right now.' });
  }
});

app.get('/api/users/search', protect, async (req, res) => {
  const query = String(req.query.q || '').trim();
  const users = await searchUsers(query, req.user);
  res.json(users);
});

app.post('/api/admin/promote', protect, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  await promoteUserRecord(req.body.targetId);
  res.json({ message: 'Promoted' });
});

app.listen(PORT, () => console.log(`Titan Ultra Server Online on ${PORT}`));

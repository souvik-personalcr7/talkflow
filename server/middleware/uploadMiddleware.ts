import multer from 'multer';

// Use memory storage to process file as buffer
const storage = multer.memoryStorage();

const imageFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format. Please upload JPG, PNG, or WEBP.'));
  }
};

const anyFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow almost all files except dangerous executables
  const blockedMimes = ['application/x-msdownload', 'application/x-executable', 'application/x-sh'];
  if (blockedMimes.includes(file.mimetype)) {
    cb(new Error('Executables are not allowed.'));
  } else {
    cb(null, true);
  }
};

// Middleware for images only
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: imageFileFilter,
});

// Middleware for generic files
export const uploadFileMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for generic files
  },
  fileFilter: anyFileFilter,
});

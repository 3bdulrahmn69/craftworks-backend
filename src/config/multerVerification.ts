import multer from 'multer';

// Configure multer for verification document uploads
const storage = multer.memoryStorage();

// File filter for verification documents (images and PDFs)
const fileFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  // Check if file is an image or PDF
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype === 'application/pdf'
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Only image files (jpg, jpeg, png, gif, webp) and PDF files are allowed!'
      ),
      false
    );
  }
};

// Configure multer for verification documents
const uploadVerification = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for verification docs
    files: 10, // Maximum 10 files
  },
});

export default uploadVerification;

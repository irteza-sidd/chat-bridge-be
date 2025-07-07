import multer from "multer";
import { v2 as cloudinaryV2 } from "cloudinary";
import { PassThrough } from "stream";
import ErrorResponse from "../utils/errorResponse.js";

const storage = multer.memoryStorage();
const multerHandler = multer({ storage: storage }).array("files");

// Multer for handling the pic uploads and all other images.
const uploadToCloudinary = async (req, res, next) => {
  try {
    const uploadResults = [];

    if (!req.files || req.files.length === 0) {
      if (!req.headers["x-allow-no-images"]) {
        return next(new ErrorResponse("No files uploaded", 400));
      } else {
        req.cloudinaryUploads = [];
        return next();
      }
    }

    for (const file of req.files) {
      const fileName = file.originalname;
      const isImage = file.mimetype.startsWith("image");
      const isDocx =
        file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      const uploadStream = cloudinaryV2.uploader.upload_stream(
        {
          resource_type: isImage ? "image" : isDocx ? "raw" : "auto",
          use_filename: true,
          unique_filename: true,
          folder: "Project_Name",
          format: isDocx ? "docx" : undefined,
        },
        (error, result) => {
          if (error) {
            return next(error);
          }

          const fileUrl = result.secure_url || result.url;
          uploadResults.push({
            name: fileName,
            url: fileUrl,
            public_id: result.public_id,
          });

          if (uploadResults.length === req.files.length) {
            req.cloudinaryUploads = uploadResults;
            next();
          }
        }
      );

      // Create a stream from the buffer and pipe it to Cloudinary
      const bufferStream = new PassThrough();
      bufferStream.end(file.buffer);
      bufferStream.pipe(uploadStream);
    }
  } catch (error) {
    next(error);
  }
};

export { multerHandler, uploadToCloudinary };

import express from "express";
import upload from "../middleware/multer.js";
import { uploadFile,listFiles,renameFile,deleteFile, searchFiles, getTrashFiles, restoreFile, permanentDeleteFile, getFilesByFolder } from "../controller/fileController.js";
import auth from "../middleware/auth.js";
import { getSharedFiles, shareFile ,getFileUrl, updateShare, deleteShare, getFilesSharedWithMe, getSharedFileByLink, createShareLink} from "../controller/shareFile.js";

const router = express.Router();

router.post("/upload", upload.single("file"), auth, uploadFile);

router.get("/", auth,listFiles);
router.post('/share',auth,shareFile)
// emal share new:
router.post("/share/link/:fileId", auth, createShareLink);


router.get("/shared/:fileId",auth,getSharedFiles)
router.get('/shared-with-me',auth,getFilesSharedWithMe)
router.get('/folder/:folderId',auth,getFilesByFolder)
// emal share new:
router.get("/share/link/:shareId", getSharedFileByLink);


router.get("/url/:storage_key", auth, getFileUrl);
router.get('/search',auth,searchFiles)
router.get('/trash',auth,getTrashFiles)
router.put("/rename",auth, renameFile);
router.put('/shares/:id',updateShare)
router.put('/restore/:id',auth,restoreFile)
router.delete("/:id",auth, deleteFile);
router.delete('/shares/:id',deleteShare)
router.delete('/permanent/:id',auth,permanentDeleteFile)

export default router;
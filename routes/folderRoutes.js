import express from "express";
import { createFolder,renameFolder, deleteFolder, getFolders} from "../controller/folderController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, createFolder);
router.get('/',auth,getFolders)
router.put("/rename", auth, renameFolder);     // rename folder
router.delete("/:id", auth, deleteFolder);     // delete folder



export default router;
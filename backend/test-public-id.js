const fs = require("fs");
const path = require("path");
const axios = require("axios");

const backendPath = "C:\\Users\\Sravan Karapakula\\OneDrive\\Desktop\\New Folder\\NAYODA\\SkillSphere\\backend";
require("dotenv").config({ path: path.join(backendPath, ".env") });
const cloudinary = require(path.join(backendPath, "src/config/cloudinary"));

const pdfContent = "%PDF-1.7 ... dummy pdf content ... %%EOF";
const originalPath = path.join(__dirname, "test_ext.pdf");

async function main() {
    try {
        fs.writeFileSync(originalPath, pdfContent);
        
        console.log("Uploading with extension in public_id...");
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "skillsphere/test",
                    resource_type: "raw",
                    public_id: `test_file_${Date.now()}.pdf`
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            fs.createReadStream(originalPath).pipe(stream);
        });

        console.log("Upload Result:");
        console.log("  secure_url:", result.secure_url);
        console.log("  public_id:", result.public_id);
        console.log("  format:", result.format);

        console.log("\nChecking downloaded headers...");
        const headResponse = await axios.head(result.secure_url);
        console.log("Headers:");
        console.log("  content-type:", headResponse.headers["content-type"]);
        console.log("  content-disposition:", headResponse.headers["content-disposition"]);
        console.log("  content-length:", headResponse.headers["content-length"]);

    } catch (err) {
        console.error("Error:", err);
    }
}

main();

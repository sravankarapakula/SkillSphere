const fs = require("fs");
const path = require("path");
const axios = require("axios");

const backendPath = "C:\\Users\\Sravan Karapakula\\OneDrive\\Desktop\\New Folder\\NAYODA\\SkillSphere\\backend";
require("dotenv").config({ path: path.join(backendPath, ".env") });
const cloudinary = require(path.join(backendPath, "src/config/cloudinary"));

// Create a simple valid PDF content
const pdfContent = `%PDF-1.7
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 50 >>
stream
BT
/F1 24 Tf
100 700 Td
(Hello World from SkillSphere Test) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000213 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
310
%%EOF`;

const originalPath = path.join(__dirname, "test_image.pdf");

async function main() {
    try {
        fs.writeFileSync(originalPath, pdfContent);
        
        console.log("Uploading with resource_type: 'image'...");
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "skillsphere/test_image",
                    resource_type: "image",
                    format: "pdf" // specify format as pdf
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

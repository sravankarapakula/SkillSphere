const axios = require("axios");

const url = "https://res.cloudinary.com/dlx2vnjjm/image/upload/v1780484520/skillsphere/test_image/hya8idiyfupmsibilwwp.pdf";

async function main() {
    try {
        console.log(`GET request on: ${url}`);
        const response = await axios.get(url, { responseType: "arraybuffer" });
        console.log("Status:", response.status);
        console.log("Headers:");
        console.log("  content-type:", response.headers["content-type"]);
        console.log("  content-disposition:", response.headers["content-disposition"]);
        console.log("  content-length:", response.headers["content-length"]);
        console.log("Downloaded buffer length:", response.data.length);
        console.log("First 20 bytes of downloaded content:", response.data.slice(0, 20).toString("utf8"));
    } catch (err) {
        console.error("Error:", err.message);
        if (err.response) {
            console.log("Response status:", err.response.status);
            console.log("Response headers:", err.response.headers);
        }
    }
}

main();

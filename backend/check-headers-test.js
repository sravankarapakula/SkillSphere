const axios = require("axios");

const urlWithoutExt = "https://res.cloudinary.com/dlx2vnjjm/raw/upload/v1780483529/skillsphere/deliverables/nv2duova6wtrpfhcwjsl";
const urlWithExt = "https://res.cloudinary.com/dlx2vnjjm/raw/upload/v1780483529/skillsphere/deliverables/nv2duova6wtrpfhcwjsl.pdf";

async function checkUrl(url) {
    try {
        console.log(`Checking URL: ${url}`);
        const response = await axios.head(url);
        console.log("Headers:");
        console.log("  content-type:", response.headers["content-type"]);
        console.log("  content-disposition:", response.headers["content-disposition"]);
        console.log("  content-length:", response.headers["content-length"]);
    } catch (err) {
        console.log(`Error checking URL: ${err.message}`);
    }
}

async function main() {
    await checkUrl(urlWithoutExt);
    console.log();
    await checkUrl(urlWithExt);
}

main();

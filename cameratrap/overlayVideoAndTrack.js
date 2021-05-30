const path = require("path");
const fs = require("fs");

const dirpath = path.resolve(__dirname, "videos");

function stripExtension(file, extension) {
    const extLength = extension.length;
    const extLengthIncludingDot = extension.startsWith(".") ? extLength : extLength + 1
    return file.slice(0, file.length - extLengthIncludingDot ?? 0);
}

function getVideoHtml(video, track) {
    return `<!DOCTYPE html>
        <html>
            <body>
                <video controls autoplay src="${video}">
                    <track default src="${track}">
                </video>
            </body>
        </html>`
}

function getIndexHtml(files, indexFile) {
    const indexDir = path.dirname(indexFile);
    const listItems = files.map(file => {
        const relHtml = path.relative(indexDir, file);
        const relFile = path.basename(relHtml);
        const fileName = stripExtension(relFile, "html");
        return `<li><a href="${relHtml}">${fileName}</a></li>\n`
    });
    return `<!DOCTYPE html>
        <html>
            <body>
                <ul>
                    ${listItems.reduce((acc, cv) => acc.concat(cv), "")}
                </ul>
            </body>
        </html>`
}

fs.readdir(dirpath, (_err, files) => {
    const strippedFilenames = files
        .filter(el => path.extname(el) === '.mp4')
        .map(file => stripExtension(file, "mp4"))
        .sort()
        .reverse();
    const htmlFiles = [];
    const outDir = path.resolve(dirpath, "..", "html");
    for (const file of strippedFilenames) {
        const vFile = path.resolve(dirpath, file.concat(".mp4"));
        const tFile = path.resolve(dirpath, file.concat(".vtt"));
        const htmlFile = path.resolve(outDir, file.concat(".html"));
        fs.writeFile(
            htmlFile,
            getVideoHtml(path.relative(outDir, vFile), path.relative(outDir, tFile)),
            logError
        );
        htmlFiles.push(htmlFile);
    }

    const indexFile = path.resolve(dirpath, "../index.html");
    fs.writeFile(
        indexFile,
        getIndexHtml(htmlFiles, indexFile),
        logError
    )

});

function logError(err, result) {
    if (err) console.log("error", err);
}
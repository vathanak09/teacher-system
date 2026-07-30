const fs = require("fs");
const path = require("path");

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile() && filePath.endsWith("page.tsx")) {
            callback(filePath);
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}

walkSync("src/app/dashboard", function(filePath) {
    let content = fs.readFileSync(filePath, "utf8");
    let changed = false;

    // Pattern to match:
    // {isSomethingOpen && ( ... 
    // <div style={{ position: "fixed"... }}>
    //   <div className="glass-panel" ...>
    
    // We look for `{([a-zA-Z0-9_]+) && \(\s*<div([^>]*style=\{\{[^}]*position:\s*.(?:fixed|absolute).[^}]*\}\}[^>]*)>\s*<div([^>]*)>`
    const regex = /\{([a-zA-Z0-9_]+) && \(\s*<div([^>]*style=\{\{[^}]*position:\s*.(?:fixed|absolute).[^}]*\}\}[^>]*)>\s*<div([^>]*)>/g;
    
    content = content.replace(regex, (match, stateVar, div1Props, div2Props) => {
        // Skip if already has onClick
        if (div1Props.includes("onClick={") || div2Props.includes("onClick={")) {
            return match;
        }
        
        const setterName = "set" + stateVar.charAt(0).toUpperCase() + stateVar.slice(1);
        changed = true;
        
        return `{${stateVar} && (\n        <div onClick={() => ${setterName}(false)} ${div1Props}>\n          <div onClick={(e) => e.stopPropagation()} ${div2Props}>`;
    });

    if (changed) {
        fs.writeFileSync(filePath, content);
        console.log("Updated", filePath);
    }
});

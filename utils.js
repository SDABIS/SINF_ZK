function stringToAsciiFixed(str, len) {
    const arr = str.split("").map(c => c.charCodeAt(0));
    if (arr.length > len) throw new Error(`String demasiado largo (max ${len})`);

    // Padding con ceros
    while (arr.length < len) arr.push(0);
    return arr;
}

function asciiFixedToString(arr) {
    let str = "";
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] == 0) break; // Stop at padding
        str += String.fromCharCode(arr[i]);
    }
    return str;
}

module.exports = {
    stringToAsciiFixed,
    asciiFixedToString
};
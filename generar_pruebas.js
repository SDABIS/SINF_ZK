const { stringToAsciiFixed, asciiFixedToString } = require("./utils");

snarkjs = require("snarkjs");

// Ejercicio 1
async function generarPrueba_1(usuario, voto, merkleData) {

    const circuit_1_input = {
        r: usuario.r,
        nombre: usuario.nombre,
        siblings: merkleData.siblings.map(x => BigInt(x)).reverse(),
        leafIndex: merkleData.leafIndex
    };

    // Generar witness
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        circuit_1_input, 
        "circuitos/1_solo_pertenencia/circuit_js/circuit.wasm", 
        "circuitos/1_solo_pertenencia/circuit_0000.zkey");

    // En la opcion 1, el voto no es parte del zk-SNARK: Hay que anadirlo manualmente
    const parametros_publicos = {
        root: publicSignals[0],
        voto: voto
    };
    console.log("Prueba generada correctamente: ", proof);
    console.log("Parametros publicos: ", parametros_publicos);

    return { proof, parametros_publicos };
}

// Ejercicio 2
async function generarPrueba_2(usuario, voto, merkleData) {

    let encoded_voto = stringToAsciiFixed(voto, 10);
    const circuit_2_input = {
        r: usuario.r,
        nombre: usuario.nombre,
        voto: encoded_voto,
        siblings: merkleData.siblings.map(x => BigInt(x)).reverse(),
        leafIndex: merkleData.leafIndex
    };
    // Generar witness
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        circuit_2_input, 
        "circuitos/2_integridad_voto/circuit_js/circuit.wasm", 
        "circuitos/2_integridad_voto/circuit_0000.zkey");

    const parametros_publicos = {
        root: publicSignals[0],
        C: publicSignals[1],
        // "voto" son 10 ints, que representan el voto en ascii codificado
        // hay que pasarlo a string
        voto: asciiFixedToString(publicSignals.slice(2, 12))
    };

    console.log("Prueba generada correctamente: ", proof);
    console.log("Parametros publicos: ", parametros_publicos);

    return { proof, parametros_publicos };
}

// Ejercicio 3
async function generarPrueba_3(usuario, voto, merkleData) {

    let encoded_voto = stringToAsciiFixed(voto, 10);
    const circuit_3_input = {
        r: usuario.r,
        nombre: usuario.nombre,
        voto: encoded_voto,
        siblings: merkleData.siblings.map(x => BigInt(x)).reverse(),
        leafIndex: merkleData.leafIndex
    };
    // Generar witness
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        circuit_3_input, 
        "circuitos/3_voto_unico/circuit_js/circuit.wasm", 
        "circuitos/3_voto_unico/circuit_0000.zkey");


    const parametros_publicos = {
        root: publicSignals[0],
        C: publicSignals[1],
        N: publicSignals[2],
        // "voto" son 10 ints, que representan el voto en ascii codificado
        // hay que pasarlo a string
        voto: asciiFixedToString(publicSignals.slice(3, 13))

    };

    console.log("Prueba generada correctamente: ", proof);
    console.log("Parametros publicos: ", parametros_publicos);

    return { proof, parametros_publicos };
}

module.exports = {
    generarPrueba_1,
    generarPrueba_2,
    generarPrueba_3
};
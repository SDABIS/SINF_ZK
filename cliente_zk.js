
const crypto = require("crypto");
const axios = require("axios");
const circomlibjs = require("circomlibjs");
const readline = require('readline-sync');

const { generarPrueba_1, generarPrueba_2, generarPrueba_3 } = require("./generar_pruebas");
const {stringToAsciiFixed} = require("./utils")

const STR_LEN = 10;
const SERVER_URL = "http://localhost:3000";



async function registrarEnServidor(V) {
    const response = await axios.post(`${SERVER_URL}/register`, {
        userHash: V.toString()
    });
    return response.data; // {root, siblings, pathIndices, leafIndex}
}

async function crearUsuario(nombre) {

    // Nombre codificado y con padding hasta 10 caracteres
    const encoded_name = stringToAsciiFixed(nombre, STR_LEN);
    // Valor R aleatorio
    const r = BigInt("0x" + crypto.randomBytes(32).toString("hex"));

    // Funcion Hash
    const poseidon = await circomlibjs.buildPoseidon();
    const F = poseidon.F;

    // N = H(r)
    const N = F.toObject(poseidon([r]));
    // V = H(r, nombre)
    const V = F.toObject(poseidon([r, ...encoded_name.map(BigInt)]));

    return {
        r,
        nombre: encoded_name,
        N,
        V
    };
}

async function main() {

    // Seleccion de ejercicio a ejecutar
    const opcion = process.argv[2]; 
    if (!opcion) {
        console.error("Uso: node cliente_zk <ejercicio>");
        process.exit(1);
    }

    console.log(`Ejecutando ejercicio ${opcion}...`);
    // Solicitar nombre y voto al usuario
    const nombre = readline.question("Introduce el nombre del votante (max 10 caracteres):" );

    const usuario = await crearUsuario(nombre);
    const merkleData = await registrarEnServidor(usuario.V);
    console.log("Usuario registrado en el servidor.");

    const voto = readline.question("Introduce el voto (max 10 caracteres):" );

    // En funcion del ejercicio a ejecutar, generar la prueba correspondiente
    if (opcion == 1) {
        // Ejercicio 1

        // MODIFICA AQUI AL USUARIO: usuario.r = otro_valor
        var { proof, parametros_publicos } = await generarPrueba_1(usuario, voto, merkleData);
        endpoint = "prove_1";

        // MODIFICA AQUI EL VOTO: parametros_publicos.voto = "otro voto"

    }
    else if (opcion == 2) {
        // Ejercicio 2
        var { proof, parametros_publicos } = await generarPrueba_2(usuario, voto, merkleData);
        endpoint = "prove_2";

        // MODIFICA AQUI EL VOTO: parametros_publicos.voto = "otro voto"

    }
    else if (opcion == 3) {
        // Ejercicio 3
        var { proof, parametros_publicos } = await generarPrueba_3(usuario, voto, merkleData);
        endpoint = "prove_3";
    }
    else {
        console.error("Opcion invalida: debe ser 1, 2 o 3");
        return;
    }

    try {
        // Enviar prueba al servidor
        const resp = await axios.post(`http://localhost:3000/${endpoint}`, { proof, parametros_publicos });
        console.log('Respuesta:', resp.data);

        // REPITE AQUI LA PETICION PARA VOTAR 2 VECES CON EL MISMO USUARIO
        const resp2 = await axios.post(`http://localhost:3000/${endpoint}`, { proof, parametros_publicos });
        console.log('Respuesta:', resp2.data);

        // Solicitar estado actual de la votacion para comprobar si el voto se ha registrado
        const resp_votos = await axios.get(`http://localhost:3000/votacion`);
        console.log('Estado actual de la votacion:', resp_votos.data);
    } catch (error) {
        if (error.response) {
            console.log('Error:', error.response.data, error.response.statusText);
        } else if (error.request) {
            console.log('Error de solicitud:', error.request);
        } else { 
            console.log('Error desconocido:', error.message);
        }
    }
}

main();
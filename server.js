const express = require('express');
const snarkjs = require("snarkjs");
const fs = require("fs");
const circomlibjs = require("circomlibjs");
const merkle = require("./merkle.js");
const {stringToAsciiFixed} = require("./utils.js")

const port = 3000;
// Árbol Merkle  (altura 20 -> 2^20 = 1M posibles elementos)
const TREE_HEIGHT = 20;

const app = express();
// Para poder leer JSON en requests
app.use(express.json());

// Inicializar valores
(async () => {
    num_registered = 0;

    poseidon = await circomlibjs.buildPoseidon();
    tree = merkle.createMerkleTree(poseidon.F, poseidon, TREE_HEIGHT);
    console.log("Árbol Merkle inicializado");
    roots = [poseidon.F.toObject(merkle.merkleTreeRoot(tree, TREE_HEIGHT))];
    votos_realizados = [];

    votacion = {
        "Hades": 0,
        "Zeus": 0,
        "Poseidon": 0,
        "Ares": 0,
        "Afrodita": 0,
        "Apolo": 0,
        "Atenea": 0,
        "Artemisa": 0,
        "Hermes": 0,
        "Dionisio": 0,
        "Hefesto": 0,
        "Demeter": 0,
        "Hera": 0,
        "Hestia": 0,
        "Zagreo": 0,
        "Melinoe": 0,
    };
})();

const vKey_1 = JSON.parse(fs.readFileSync("circuitos/1_solo_pertenencia/verification_key.json"));
const vKey_2 = JSON.parse(fs.readFileSync("circuitos/2_integridad_voto/verification_key.json"));
const vKey_3 = JSON.parse(fs.readFileSync("circuitos/3_voto_unico/verification_key.json"));

function comprobaciones(parametros_publicos, nivel) {
    
    // Es necesario comprobar que la raiz proporcionada al usuario se corresponde con la del 
    // árbol Merkle actual o con alguna de sus versiones anteriores
    root = BigInt(parametros_publicos.root);
    //console.log("Raíz del árbol recibida:", root);
    if (!roots.includes(root)) {
        return [false, "No se ha podido demostrar que el usuario esté registrado"];
    }

    if (nivel === 3) {
        const N = BigInt(parametros_publicos.N);
        if (votos_realizados.includes(N)) {
            return [false, "El votante ya ha votado"];
        }
        votos_realizados.push(N);
    }

    return [true, "OK"];
}

// Endpoint: /register
app.post('/register', async (req, res) => {
    const { userHash } = req.body;
    if (!userHash) {
        return res.status(400).json({ error: "Falta userHash" });
    }


    let user_hash = poseidon.F.e(BigInt(userHash));
    merkle.insertElement(tree, poseidon, num_registered, user_hash, TREE_HEIGHT);

    // Obtener prueba de pertenencia
    const [proof, root] = await merkle.generateMerkleProof(tree, num_registered, TREE_HEIGHT);

    const leafIndex = num_registered;
    num_registered += 1;
    roots.push(poseidon.F.toObject(root));

    //console.log(roots)
    //console.log(`Usuario registrado. Índice de hoja: ${leafIndex}, arbol: ${tree}`);

    return res.json({
        message: "Usuario registrado",
        leafIndex,
        root: root.toString(),
        siblings: proof.map(n => poseidon.F.toObject(n).toString()),
    });
});

// EJERCICIO 1
app.post('/prove_1', async (req, res) => {
try {
    
        const { proof, parametros_publicos } = req.body;

        //console.log("Recibido: ", { proof, parametros_publicos });
        if (!proof || !parametros_publicos) {
            console.error("Faltan proof o parametros_publicos en la solicitud");
            return res.status(400).json({ error: "Faltan proof o parametros_publicos" });
        }

        // Comprobaciones comunes a los 3 ejercicios
        const [check, message] = comprobaciones(parametros_publicos, 1);
        if (!check) {
            console.error(message);
            return res.status(403).json({ error: message });
        }

        // Preparar entradas al circuito
        const publicSignals = [
            parametros_publicos.root
        ];
        // Validar la prueba usando snarkjs
        const valid = await snarkjs.groth16.verify(vKey_1, publicSignals, proof);

        if (valid) {
            const voto = parametros_publicos.voto;

            // Si el voto es valido, anadir a la votacion
            if (votacion.hasOwnProperty(voto)) {
                votacion[voto] += 1
            }

            return res.json({ valid: true, message: "Prueba zkSNARK válida" });
        } else {
            return res.status(403).json({ valid: false, message: "Prueba inválida" });
        }

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error validando la prueba", details: err.toString() });
    }
});

// EJERCICIO 2
app.post('/prove_2', async (req, res) => {
try {
    
        const { proof, parametros_publicos } = req.body;
        
        if (!proof || !parametros_publicos) {
            console.error("Faltan proof o parametros_publicos en la solicitud");
            return res.status(400).json({ error: "Faltan proof o parametros_publicos" });
        }

        
        const [check, message] = comprobaciones(parametros_publicos, 2);
        if (!check) {
            return res.status(403).json({ error: message });
        }

        // Preparar entradas al circuito
        const publicSignals = [
            parametros_publicos.root,
            parametros_publicos.C,
            ...stringToAsciiFixed(parametros_publicos.voto, 10)
        ];

        // Validar la prueba usando snarkjs
        const valid = await snarkjs.groth16.verify(vKey_2, publicSignals, proof);

        if (valid) {
            const voto = parametros_publicos.voto;

            // Si el voto es valido, anadir a la votacion
            if (votacion.hasOwnProperty(voto)) {
                votacion[voto] += 1
            }

            return res.json({ valid: true, message: "Prueba zkSNARK válida" });
        } else {
            return res.status(403).json({ valid: false, message: "Prueba inválida" });
        }

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error validando la prueba", details: err.toString() });
    }
});

// EJERCICIO 3
app.post('/prove_3', async (req, res) => {
try {
    
        const { proof, parametros_publicos } = req.body;

        if (!proof || !parametros_publicos) {
            console.error("Faltan proof o publicSignals en la solicitud");
            return res.status(403).json({ error: "Faltan proof o publicSignals" });
        }

        const [check, message] = comprobaciones(parametros_publicos, 3);
        if (!check) {
            return res.status(403).json({ error: message });
        }

        // Preparar entradas al circuito
        const publicSignals = [
            parametros_publicos.root,
            parametros_publicos.C,
            parametros_publicos.N,
            ...stringToAsciiFixed(parametros_publicos.voto, 10)
        ];

        // Validar la prueba usando snarkjs
        const valid = await snarkjs.groth16.verify(vKey_3, publicSignals, proof);

        if (valid) {
            return res.json({ valid: true, message: "Prueba zkSNARK válida" });
        } else {
            return res.status(403).json({ valid: false, message: "Prueba inválida" });
        }

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error validando la prueba", details: err.toString() });
    }
});

app.get('/votacion', async (req, res) => {
    return res.json(votacion)
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
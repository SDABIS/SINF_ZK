circom .\circuit.circom --r1cs --wasm --sym
snarkjs groth16 setup .\circuit.r1cs .\pot14_final.ptau .\circuit_0000.zkey
snarkjs zkey export verificationkey .\circuit_0000.zkey verification_key.json

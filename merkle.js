function createMerkleTree(F, hash, nLevels) {
    const extendedLen = 1 << nLevels;
    let first_level = [];
    for (let i = 0; i < extendedLen; i++) {
        first_level.push(F.zero);
    }

    let tree = [first_level];
    for (let i = 1; i < nLevels + 1; i++) {
        let level = [];
        previous_level = tree[tree.length - 1];
        const levelLen = 1 << (nLevels - i);
        //console.log(`levelLen for ${i}`, levelLen);
        for (let j = 0; j < levelLen; j++) {
            level.push(hash([previous_level[2 * j], previous_level[2 * j + 1]]));
        }
        tree.push(level);
    }
    return tree;
}

// Funcion para anadir un nuevo elemento al árbol
function insertElement(m, hash, index, value, nLevels) {
  m[0][index] = value;
  _update_parents(m, hash, index, nLevels);
}

function _update_parents(m, hash, index, nLevels) {
    for (let level = 0; level < nLevels; level++) {
        const parentIndex = index >> (level + 1);
        const leftChildIndex = 2 * parentIndex;
        const rightChildIndex = 2 * parentIndex + 1;
        //console.log(`Updating level ${level + 1}, parentIndex ${parentIndex}: leftChildIndex ${leftChildIndex}, rightChildIndex ${rightChildIndex}`);
        m[level + 1][parentIndex] = hash([m[level][leftChildIndex], m[level][rightChildIndex]]);
    }

    return m;
}

function generateMerkleProof(m, key, nLevels) {

    let mp = [];
    for (let level = 0; level < nLevels; level++) {
        const siblingIndex = key ^ 1;
        mp.push(m[level][siblingIndex]);
        key = key >> 1;
    }
    return [mp, m[nLevels][0]]; // Devuelve la raiz también
}

function validateMerkleProof(F, hash, key, value, root, mp) {
  let h = hash([value]);
  for (let i = mp.length - 1; i >= 0; i--) {
    if ((1 << (mp.length - 1 - i)) & key) {
      h = hash([mp[i], h]);
    } else {
      h = hash([h, mp[i]]);
    }
  }
  return F.eq(root, h);
}

function merkleTreeRoot(m, nLevels) {
  return m[nLevels][0];
}

module.exports = {
  createMerkleTree,
  insertElement,
  generateMerkleProof,
  validateMerkleProof,
  merkleTreeRoot
};
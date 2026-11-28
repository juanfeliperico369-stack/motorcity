import assert from 'node:assert/strict';
import {chocaHuella} from '../src/fisica/huellas.js';
const pol=[[0,0],[10,0],[10,10],[0,10]];
assert.equal(chocaHuella([-2,5],[12,5],pol,.36),true);
assert.equal(chocaHuella([-2,-.2],[12,-.2],pol,.36),true);
assert.equal(chocaHuella([-2,-1],[12,-1],pol,.36),false);
assert.equal(chocaHuella([5,5],[5,6],pol,.36),true);
assert.equal(chocaHuella([-2,-2],[-1,-1],pol,.36),false);
console.log('OK: colisión barrida contra huella, esquinas y margen');

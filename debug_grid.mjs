import * as Hex from './src/pages/game/modules/Hex.mjs';

console.log("Grid pixelWidth:", Hex.Grid.pixelWidth);
console.log("Grid pixelHeight:", Hex.Grid.pixelHeight);
console.log("Grid size:", Hex.Grid.size);

const hex1 = Hex.Grid.toArray()[0];
const hex2 = Hex.Grid.toArray()[0];
console.log("Are hexes identical?", hex1 === hex2);



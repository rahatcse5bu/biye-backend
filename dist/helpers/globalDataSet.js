"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_global_storage_1 = require("node-global-storage");
const globalDataSet = (tokenResult) => {
    (0, node_global_storage_1.set)("id_token", tokenResult.id_token);
};
exports.default = globalDataSet;

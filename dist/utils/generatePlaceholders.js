"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePlaceholders = void 0;
function generatePlaceholders(count) {
    const placeholders = [];
    for (let i = 0; i < count; i++) {
        placeholders.push("?");
    }
    return placeholders.join(", ");
}
exports.generatePlaceholders = generatePlaceholders;

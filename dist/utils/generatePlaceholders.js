"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePlaceholders = generatePlaceholders;
function generatePlaceholders(count) {
    const placeholders = [];
    for (let i = 0; i < count; i++) {
        placeholders.push("?");
    }
    return placeholders.join(", ");
}

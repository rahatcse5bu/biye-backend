"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentTime = void 0;
const getCurrentTime = () => {
    // Get the current date and time
    const now = new Date();
    // Get the components of the date and time
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0"); // Months are zero-based, so add 1
    const day = now.getDate().toString().padStart(2, "0");
    // Get the hours and determine AM or PM
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");
    const period = hours >= 12 ? "PM" : "AM";
    // Convert hours from 24-hour time to 12-hour time
    hours = hours % 12 || 12; // The hour '0' should be '12'
    const formattedHours = hours.toString().padStart(2, "0");
    // Format the date and time as a string
    const formattedDateTime = `${year}-${month}-${day} ${formattedHours}:${minutes}:${seconds} ${period}`;
    return formattedDateTime;
};
exports.getCurrentTime = getCurrentTime;
// console.log(getCurrentTime());

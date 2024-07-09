export const getCurrentTime = (): string => {
  // Get the current date and time
  const now = new Date();

  // Get the components of the date and time
  const year: number = now.getFullYear();
  const month: string = (now.getMonth() + 1).toString().padStart(2, "0"); // Months are zero-based, so add 1
  const day: string = now.getDate().toString().padStart(2, "0");

  // Get the hours and determine AM or PM
  let hours: number = now.getHours();
  const minutes: string = now.getMinutes().toString().padStart(2, "0");
  const seconds: string = now.getSeconds().toString().padStart(2, "0");
  const period: string = hours >= 12 ? "PM" : "AM";

  // Convert hours from 24-hour time to 12-hour time
  hours = hours % 12 || 12; // The hour '0' should be '12'
  const formattedHours: string = hours.toString().padStart(2, "0");

  // Format the date and time as a string
  const formattedDateTime: string = `${year}-${month}-${day} ${formattedHours}:${minutes}:${seconds} ${period}`;

  return formattedDateTime;
};

// console.log(getCurrentTime());

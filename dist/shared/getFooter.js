"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFooter = void 0;
const getFooter = () => {
    return `
   <footer style="background-color: #3730a3; padding: 20px; text-align: center; font-family: Arial, sans-serif; margin-top:20px; border-radius:10px">
   <a href="https://pnc-nikah.com/biodatas?page=1&limit=12&user_status=active"><img src="https://i.ibb.co.com/hMG0bbn/download.png" style="border-radius:5px;width:100px;height:50px;"/></a>
      <p style="color: #fff;font-weight:bold">&copy; ${new Date().getFullYear()} PNC-Nikah. All rights reserved.</p>
      <p style="color: #fff; font-size: 12px;">
   <address style="margin-bottom:5px;color:#fff">PNC-Nikah, Barishal,Bangladesh</address>
        <a href="mailto:pnc.nikah@gmail.com" style="color: #fff; text-decoration: none;">pnc.nikah@gmail.com</a> | 
        <a href="tel:+1234567890" style="color: #fff; text-decoration: none;">+880 1793-278360</a>
      </p>
      <p style="color: #888; font-size: 16px; color:#fff">
        <a href="https://pnc-nikah.com/privacy-policy" style="color:#fff; text-decoration: none;">Privacy Policy</a> | 
        <a href="https://pnc-nikah.com/about-us" style="color: #ffff; text-decoration: none;">About Us</a>
      </p>
    </footer>
  `;
};
exports.getFooter = getFooter;

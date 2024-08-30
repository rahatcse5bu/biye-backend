const generateEmailTemplate = (
  subject: string,
  body: string,
  website: string = "https://pnc-nikah.com/"
) => {
  const currentYear = new Date().getFullYear();

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                color: #333;
                margin: 0;
                padding: 0;
            }
            .container {
                width: 100%;
                max-width: 600px;
                margin: 20px auto;
                background-color: #fff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 20px;
            }
            .header h1 {
                font-size: 24px;
                margin: 0;
            }
            .body {
                font-size: 16px;
                line-height: 1.6;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 14px;
                color: #777;
            }
            .footer a {
                color: #007BFF;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${subject}</h1>
            </div>
            <div class="body">
                <p>${body}</p>
            </div>
            <div class="footer">
                <p>&copy; ${currentYear} PNC-Nikah. All rights reserved.</p>
                <p><a href="${website}" target="_blank">${website}</a></p>
            </div>
        </div>
    </body>
    </html>
  `;
};

export default generateEmailTemplate;

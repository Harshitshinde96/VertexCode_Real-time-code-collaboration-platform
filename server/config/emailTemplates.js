export const EMAIL_VERIFY_TEMPLATE = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Email Verification</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Outfit', sans-serif;
      background-color: #f4f4f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }
    .header {
      background-color: #171717;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      letter-spacing: 1px;
    }
    .content {
      padding: 40px 30px;
      color: #333333;
      text-align: center;
    }
    .welcome-text {
      font-size: 16px;
      line-height: 1.6;
      color: #525252;
      margin-bottom: 25px;
    }
    .email-highlight {
      color: #06b6d4;
      font-weight: 600;
    }
    .otp-box {
      background: #ecfeff;
      border: 1px solid #06b6d4;
      border-radius: 8px;
      padding: 15px;
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 5px;
      color: #06b6d4;
      display: inline-block;
      margin: 20px 0;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MERN Authentication SystemAuth</h1>
    </div>
    <div class="content">
      <h2 style="color: #171717; margin-bottom: 20px;">Verify Your Email Address</h2>
      <p class="welcome-text">
        Welcome! You're almost there. To complete your registration for <span class="email-highlight">{{email}}</span>, please use the verification code below.
      </p>
      
      <div class="otp-box">{{otp}}</div>

      <p class="welcome-text" style="font-size: 14px; margin-top: 20px;">
        This code expires in <strong>24 hours</strong>.<br>
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} MERN Auth System. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

export const PASSWORD_RESET_TEMPLATE = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Password Reset</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Outfit', sans-serif;
      background-color: #f4f4f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }
    .header {
      background-color: #171717;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      letter-spacing: 1px;
    }
    .content {
      padding: 40px 30px;
      color: #333333;
      text-align: center;
    }
    .welcome-text {
      font-size: 16px;
      line-height: 1.6;
      color: #525252;
      margin-bottom: 25px;
    }
    .email-highlight {
      color: #06b6d4;
      font-weight: 600;
    }
    .otp-box {
      background: #fef2f2; /* Light Red/Rose background for urgency */
      border: 1px solid #f43f5e;
      border-radius: 8px;
      padding: 15px;
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 5px;
      color: #f43f5e; /* Rose color for password reset */
      display: inline-block;
      margin: 20px 0;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MERN Authentication System</h1>
    </div>
    <div class="content">
      <h2 style="color: #171717; margin-bottom: 20px;">Reset Your Password</h2>
      <p class="welcome-text">
        We received a request to reset the password for <span class="email-highlight">{{email}}</span>.
      </p>
      
      <p class="welcome-text">Use the code below to proceed:</p>

      <div class="otp-box">{{otp}}</div>

      <p class="welcome-text" style="font-size: 14px; margin-top: 20px;">
        This code is valid for <strong>15 minutes</strong>.<br>
        If you didn't request a password reset, please ignore this email or contact support if you have concerns.
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} MERN Authentication System. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

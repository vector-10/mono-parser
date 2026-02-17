export const passwordResetEmailTemplate = (name: string, otp: string): string => {
  return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0055ba 0%, #0055ba 100%); padding: 40px 30px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Mono Parser</h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #000000; margin: 0 0 20px; font-size: 24px;">Reset Your Password</h2>
                    <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
                      Hello <strong>${name}</strong>,
                    </p>
                    <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 30px;">
                      We received a request to reset your password. Use the code below to proceed:
                    </p>

                    <!-- OTP Box -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 20px; background-color: #f8f9fa; border-radius: 8px; border: 2px dashed #0055ba;">
                          <span style="font-size: 36px; font-weight: bold; color: #0055ba; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                            ${otp}
                          </span>
                        </td>
                      </tr>
                    </table>

                    <p style="color: #999999; font-size: 14px; line-height: 1.5; margin: 30px 0 0;">
                       This code will expire in <strong>10 minutes</strong>.
                    </p>
                    <p style="color: #999999; font-size: 14px; line-height: 1.5; margin: 10px 0 0;">
                       If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="color: #999999; font-size: 14px; margin: 0 0 10px;">
                      Best regards,<br>
                      <strong style="color: #0055ba;">The Mono Parser Team</strong>
                    </p>
                    <p style="color: #999999; font-size: 12px; margin: 0;">
                      &copy; ${new Date().getFullYear()} Mono Parser. Powered by Mono Open Banking.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
};

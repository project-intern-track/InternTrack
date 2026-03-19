<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Supervisor Account Credentials - InternTrack</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
	<table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
		<tr>
			<td style="padding: 40px 20px;">
				<table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
					<tr>
						<td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #FF8800 0%, #FF6600 100%); border-radius: 8px 8px 0 0;">
							<h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Welcome to InternTrack</h1>
						</td>
					</tr>

					<tr>
						<td style="padding: 40px; color: #333333; line-height: 1.6;">
							<p style="margin: 0 0 20px; font-size: 16px;">Hello {{ $full_name }},</p>

							<p style="margin: 0 0 20px; font-size: 16px;">
								Your supervisor account has been successfully created in the InternTrack system.
							</p>

							<p style="margin: 0 0 10px; font-size: 16px; font-weight: 600;">Your login credentials:</p>

							<table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f8f8; border-radius: 6px; margin-bottom: 20px;">
								<tr>
									<td style="padding: 16px; font-size: 14px; color: #222222;">
										<p style="margin: 0 0 8px;"><strong>Email:</strong> {{ $email }}</p>
										<p style="margin: 0;"><strong>Password:</strong> {{ $password }}</p>
									</td>
								</tr>
							</table>

							<table role="presentation" style="margin: 10px 0 24px;">
								<tr>
									<td style="text-align: center;">
										<a href="{{ $login_url }}"
										   style="display: inline-block; padding: 14px 28px; background-color: #FF8800; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 600;">
											Login to InternTrack
										</a>
									</td>
								</tr>
							</table>

							<p style="margin: 0 0 12px; font-size: 14px; color: #666666;">
								For security, please change your password after your first login.
							</p>

							<p style="margin: 0; font-size: 14px; color: #666666;">
								If you have any questions, please contact your system administrator.
							</p>
						</td>
					</tr>

					<tr>
						<td style="padding: 30px 40px; background-color: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center; color: #888888; font-size: 13px; line-height: 1.5;">
							<p style="margin: 0; color: #aaaaaa;">© {{ date('Y') }} InternTrack. All rights reserved.</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>
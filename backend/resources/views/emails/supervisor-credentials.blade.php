@component('mail::message')
# Welcome to InternTrack! 🎉

Hello **{{ $full_name }}**,

Your supervisor account has been successfully created in the InternTrack system.

---

## Your Login Credentials

@component('mail::panel')
**Email Address:**  
{{ $email }}

**Password:**  
{{ $password }}

**Login URL:**  
[Click here to login]({{ $login_url }})
@endcomponent

---

## Important Notes ⚠️

1. **Change Your Password:** Please change your password immediately after your first login for security
2. **Keep It Secure:** Never share your credentials with anyone
3. **Password Recovery:** If you forget your password, use the "Forgot Password" link on the login page
4. **Account Activation:** Your account is already active and ready to use

---

## What's Next?

Once logged in, you can:
- View assigned interns and their OJT progress
- Submit feedback and evaluations
- Manage task assignments
- Track intern performance

---

If you have any questions or encounter any issues, please contact your system administrator.

Best regards,  
**InternTrack Team**

@slot('footer')
© {{ date('Y') }} InternTrack. All rights reserved.
@endslot

@endcomponent
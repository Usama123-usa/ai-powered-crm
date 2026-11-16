def generate_email(lead_name: str, company: str, source: str) -> dict:
    first_name = lead_name.split()[0]
    company_line = f" at {company}" if company else ""
    return {
        "subject": f"Great connecting with you, {first_name}!",
        "body": f"""Hi {first_name},

This is Jarrod Brown from Brown Capital. We just tried reaching you{company_line} — I'd love to connect!

We specialize in personalized financial advisory services and I believe we can add real value for you.

I'd like to invite you to a complimentary 20-minute discovery call where we can discuss your financial goals and how we can help you achieve them.

Looking forward to speaking with you soon!

Best regards,
Jarrod Brown
Brown Capital | Financial Advisory"""
    }

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReferenceEmailRequest {
  applicantName: string;
  applicantAddress: string;
  applicantPostcode: string;
  positionAppliedFor?: string;
  referenceEmail: string;
  referenceName: string;
  referenceCompany?: string;
  referenceAddress?: string;
  companyName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      applicantName,
      applicantAddress,
      applicantPostcode,
      positionAppliedFor,
      referenceEmail,
      referenceName,
      referenceCompany,
      referenceAddress,
      companyName,
    }: ReferenceEmailRequest = await req.json();

    // Derive site origin from request for building public URL
    const siteOrigin = req.headers.get("origin") || `${new URL(req.url).protocol}//${new URL(req.url).host}`;
    const referenceToken = crypto.randomUUID();
    const safeCompanyName = companyName && companyName.trim().length > 0 ? companyName : 'Your Company Name';
    const roleTitle = positionAppliedFor && positionAppliedFor.trim().length > 0 ? positionAppliedFor : 'Support Worker/Carer';
    const referenceLink = `${siteOrigin}/reference?token=${referenceToken}`;

    console.log("Sending reference email to:", referenceEmail, "for applicant:", applicantName);

    const emailHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reference Request – ${applicantName}</title>
    <style>
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:0}
      .container{max-width:640px;margin:0 auto;background:#fff}
      .content{padding:32px}
      .btn{display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600}
      .footer{background:#f3f4f6;padding:20px;text-align:center;color:#6b7280;font-size:12px}
    </style>
  </head>
  <body>
    <div class="container">
      <div class="content">
        <p style="margin:0 0 16px 0;">Dear ${referenceName},</p>
        <p style="margin:0 0 16px 0;">
          ${applicantName}, of ${applicantAddress}, ${applicantPostcode}, has applied for the position of ${roleTitle} at ${safeCompanyName}. They have listed you as a referee, and we would be grateful if you could provide a reference regarding their suitability for this role.
        </p>
        <p style="margin:0 0 16px 0;">Please complete your reference at the secure link below:</p>
        <p style="margin:0 0 24px 0;">
          <a href="${referenceLink}" class="btn">Provide Reference</a>
        </p>
        <p style="margin:0 0 8px 0; color:#6b7280; font-size:12px;">
          If the button does not work, copy and paste this URL into your browser:
        </p>
        <p style="word-break:break-all; color:#374151; font-size:12px;">${referenceLink}</p>
        <p style="margin:24px 0 0 0;">Kind regards,<br/>${safeCompanyName} Recruitment Team</p>
      </div>
      <div class="footer">
        <p style="margin:0;">This link is unique to you. Please do not share it.</p>
      </div>
    </div>
  </body>
</html>
`;


    const apiKey = Deno.env.get("BREVO_API_KEY");
    if (!apiKey) {
      throw new Error("BREVO_API_KEY environment variable is not set");
    }

    const payload = {
      sender: { name: "Document Signing System", email: "yuadm3@gmail.com" },
      replyTo: { name: "Document Signing System", email: "yuadm3@gmail.com" },
      to: [{ email: referenceEmail, name: referenceName }],
      subject: `Reference Request – ${applicantName}`,
      htmlContent: emailHtml,
    };

    const emailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Brevo API error response:", errorText);
      throw new Error(`Brevo API error: ${emailResponse.status} - ${errorText}`);
    }

    const result = await emailResponse.json();

    console.log("Reference email sent successfully:", result);

    return new Response(JSON.stringify({ 
      success: true,
      provider: "brevo",
      messageId: result?.messageId ?? null,
      referenceLink,
      referenceToken
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-reference-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
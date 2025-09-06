import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CompletionNotificationRequest {
  referenceEmail: string;
  referenceName: string;
  applicantName: string;
  referenceType: 'employer' | 'character';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      referenceEmail,
      referenceName,
      applicantName,
      referenceType
    }: CompletionNotificationRequest = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch company settings for logo and company name
    const { data: companySettingsData } = await supabase
      .from('company_settings')
      .select('*')
      .maybeSingle();

    const companyLogo = companySettingsData?.logo;
    const companyName = companySettingsData?.name || 'Your Company Name';

    console.log("Sending completion notification to:", referenceEmail, "for applicant:", applicantName);

    const emailSubject = `Thank You for Your Reference - ${applicantName}`;
    
    const emailHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${emailSubject}</title>
    <style>
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:0}
      .container{max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.1)}
      .header{background:linear-gradient(135deg, #10b981 0%, #059669 100%);padding:32px;text-align:center;color:#fff}
      .logo{max-width:120px;max-height:60px;margin:0 auto 16px;display:block}
      .content{padding:32px}
      .check-icon{width:48px;height:48px;background:#10b981;border-radius:50%;margin:0 auto 24px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px}
      .footer{background:#f3f4f6;padding:20px;text-align:center;color:#6b7280;font-size:12px}
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        ${companyLogo ? `<img src="${companyLogo}" alt="${companyName} Logo" class="logo" />` : ''}
        <h1 style="margin:0;font-size:24px;font-weight:700;">${companyName}</h1>
        <p style="margin:8px 0 0 0;opacity:0.9;">Reference Completed</p>
      </div>
      <div class="content">
        <div class="check-icon">✓</div>
        
        <h2 style="text-align:center;color:#111827;margin:0 0 24px 0;">Thank You for Your Reference!</h2>
        
        <p style="margin:0 0 16px 0;">Dear ${referenceName},</p>
        
        <p style="margin:0 0 16px 0;">
          Thank you for taking the time to complete the ${referenceType} reference for <strong>${applicantName}</strong>. 
          Your feedback is invaluable to our recruitment process and helps us make informed hiring decisions.
        </p>
        
        <p style="margin:0 0 16px 0;">
          We truly appreciate your time and the effort you put into providing this reference. 
          Your insights about ${applicantName}'s character and abilities will be treated with complete confidentiality.
        </p>
        
        <p style="margin:0 0 16px 0;">
          If you have any questions or need any further information, please don't hesitate to contact us.
        </p>
        
        <p style="margin:24px 0 0 0;">
          Once again, thank you for your valuable contribution to our recruitment process.
        </p>
        
        <p style="margin:16px 0 0 0;">
          Best regards,<br/>
          HR Team<br/>
          ${companyName}
        </p>
      </div>
      <div class="footer">
        <p style="margin:0;">This email was sent to confirm completion of your reference submission.</p>
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
      sender: { name: companyName, email: "yuadm3@gmail.com" },
      replyTo: { name: companyName, email: "yuadm3@gmail.com" },
      to: [{ email: referenceEmail, name: referenceName }],
      subject: emailSubject,
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
    console.log("Reference completion notification sent successfully:", result);

    return new Response(JSON.stringify({ 
      success: true,
      provider: "brevo",
      messageId: result?.messageId ?? null
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-reference-completion-notification function:", error);
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
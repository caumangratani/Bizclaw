// ============================================================
// WhatsApp Message Templates Tool
// Pre-written templates in Hindi, Gujarati, and English
// for common MSME scenarios
// ============================================================

interface TemplateInput {
  category:
    | "payment_reminder"
    | "gst_alert"
    | "order_confirmation"
    | "festival_greeting"
    | "follow_up"
    | "thank_you"
    | "meeting_request"
    | "quotation";
  language?: "english" | "hindi" | "gujarati";
  variables?: Record<string, string>; // e.g., { name: "Rajesh", amount: "50,000" }
}

interface Template {
  category: string;
  language: string;
  subject: string;
  message: string;
  tip: string;
}

interface TemplateResult {
  templates: Template[];
  note: string;
}

const TEMPLATES: Record<string, Record<string, Template>> = {
  // ---- PAYMENT REMINDER ----
  payment_reminder: {
    english: {
      category: "Payment Reminder",
      language: "English",
      subject: "Payment Reminder",
      message: `Dear {name},

Hope you're doing well! This is a friendly reminder regarding invoice #{invoice_number} for Rs.{amount}, which was due on {due_date}.

We'd appreciate if you could process the payment at your earliest convenience.

For easy payment:
UPI: {upi_id}
Bank: {bank_details}

Thank you for your continued business! 🙏`,
      tip: "Send between 10 AM - 12 PM on weekdays for best response rate.",
    },
    hindi: {
      category: "Payment Reminder",
      language: "Hindi",
      subject: "Payment Yaad Dilana",
      message: `{name} ji, Namaskar! 🙏

Aapka invoice #{invoice_number} Rs.{amount} ka payment {due_date} ko due tha.

Agar payment ho gaya hai to please ignore karein. Agar nahi hua hai to jaldi se process kar dijiye.

UPI se payment karein: {upi_id}

Dhanyavaad! Aapke saath kaam karna hamesha accha lagta hai. 😊`,
      tip: "Hindi reminders get 40% faster response than English for Gujarat/Rajasthan clients.",
    },
    gujarati: {
      category: "Payment Reminder",
      language: "Gujarati",
      subject: "Payment Reminder",
      message: `{name} bhai, Kem cho! 🙏

Tamaro invoice #{invoice_number} Rs.{amount} no payment {due_date} e due hato.

Jо payment thai gayo hoy to ignore karo. Nahi to tamari convenience mujab jaldi thi kari apo.

UPI thi payment karo: {upi_id}

Tamara sathe kaam karvu hamesha gamey chhe! Aabhar! 😊`,
      tip: "Gujarati templates work best for local Gujarat businesses and traders.",
    },
  },

  // ---- GST ALERT ----
  gst_alert: {
    english: {
      category: "GST Alert",
      language: "English",
      subject: "GST Filing Reminder",
      message: `⚡ GST Alert!

{name}, your {return_type} is due on {due_date}.

Checklist:
✅ Reconcile sales invoices
✅ Verify Input Tax Credit (ITC)
✅ Calculate net tax payable
✅ File on GST portal before deadline

Late fee: Rs.50/day + 18% interest on tax due.
Don't be late — har din ka Rs.50 waste mat karo! 💰

Need help? Just reply here.`,
      tip: "Send 3-5 days before the deadline for maximum effectiveness.",
    },
    hindi: {
      category: "GST Alert",
      language: "Hindi",
      subject: "GST Filing Yaad",
      message: `⚡ GST Alert!

{name} ji, aapki {return_type} ki last date {due_date} hai.

Ye kaam kar lo:
✅ Sales invoices match karo
✅ ITC (Input Tax Credit) verify karo
✅ Net tax calculate karo
✅ GST portal pe file karo

Late fee: Rs.50 per din + 18% interest!
Time pe file karo, penalty se bacho! 💪

Koi help chahiye to bolo.`,
      tip: "Hindi GST alerts get opened 60% faster on WhatsApp.",
    },
    gujarati: {
      category: "GST Alert",
      language: "Gujarati",
      subject: "GST Filing Reminder",
      message: `⚡ GST Alert!

{name} bhai, tamari {return_type} ni last date {due_date} chhe.

Aa kaam pura karo:
✅ Sales invoices match karo
✅ ITC verify karo
✅ Net tax calculate karo
✅ GST portal par file karo

Late fee: Rs.50 daily + 18% interest!
Time par file karo, penalty thi bacho! 💪

Help joiye to reply karo.`,
      tip: "Best sent on Monday morning for weekly compliance planning.",
    },
  },

  // ---- ORDER CONFIRMATION ----
  order_confirmation: {
    english: {
      category: "Order Confirmation",
      language: "English",
      subject: "Order Confirmed",
      message: `✅ Order Confirmed!

Dear {name},

Your order #{order_number} has been confirmed.

Details:
📦 Items: {items}
💰 Total: Rs.{amount}
🚚 Expected delivery: {delivery_date}

We'll update you when it ships.

Thank you for your order! 🙏`,
      tip: "Send immediately after order placement for best customer experience.",
    },
    hindi: {
      category: "Order Confirmation",
      language: "Hindi",
      subject: "Order Confirm",
      message: `✅ Order Confirm Ho Gaya!

{name} ji,

Aapka order #{order_number} confirm ho gaya hai.

Details:
📦 Items: {items}
💰 Total: Rs.{amount}
🚚 Delivery: {delivery_date} tak

Ship hone par update denge.

Order ke liye shukriya! 🙏`,
      tip: "Quick confirmation builds trust — send within 5 minutes of order.",
    },
    gujarati: {
      category: "Order Confirmation",
      language: "Gujarati",
      subject: "Order Confirm",
      message: `✅ Order Confirm Thai Gayo!

{name} bhai,

Tamaro order #{order_number} confirm thai gayo chhe.

Details:
📦 Items: {items}
💰 Total: Rs.{amount}
🚚 Delivery: {delivery_date} sudhi

Ship thase tyare update aapse.

Order mate aabhar! 🙏`,
      tip: "Gujarati confirmation adds personal touch for local traders.",
    },
  },

  // ---- FESTIVAL GREETING ----
  festival_greeting: {
    english: {
      category: "Festival Greeting",
      language: "English",
      subject: "Festival Wishes",
      message: `🎉 Happy {festival_name}!

Dear {name},

Wishing you and your family a wonderful {festival_name}! May this festive season bring prosperity to your business and joy to your family.

Thank you for being a valued business partner. Here's to another year of growth together! 🚀

Warm regards,
{sender_name}`,
      tip: "Send on the morning of the festival, before 10 AM.",
    },
    hindi: {
      category: "Festival Greeting",
      language: "Hindi",
      subject: "Tyohaar Ki Shubhkamnayein",
      message: `🎉 {festival_name} ki hardik shubhkamnayein!

{name} ji,

Aapko aur aapke poore parivaar ko {festival_name} ki bahut bahut badhaai!

Ye tyohaar aapke business mein tarakki aur ghar mein khushiyan laaye. 🙏

Aapke saath kaam karke hamesha accha lagta hai. Aane wale saal mein aur bhi growth karein saath mein! 🚀

Shubh {festival_name}! ✨
{sender_name}`,
      tip: "Hindi festival messages feel more personal and get more replies.",
    },
    gujarati: {
      category: "Festival Greeting",
      language: "Gujarati",
      subject: "Tuhevaar ni Shubhechha",
      message: `🎉 {festival_name} ni Khub Khub Shubhechha!

{name} bhai,

Tamne ane tamara aakha parivaar ne {festival_name} ni hardik shubhkamnao! 🙏

Aa tuhevaar tamara business ma pragati ane ghar ma khushi laave.

Tamari sathe kaam karvu hamesha gamey chhe. Aavta varsh ma vadhu growth karshu sathe! 🚀

Shubh {festival_name}! ✨
{sender_name}`,
      tip: "Gujarati festival greetings are essential for business relationships in Gujarat.",
    },
  },

  // ---- FOLLOW UP ----
  follow_up: {
    english: {
      category: "Follow Up",
      language: "English",
      subject: "Quick Follow Up",
      message: `Hi {name},

Just following up on our previous conversation about {topic}.

Have you had a chance to think it over? Happy to answer any questions or hop on a quick call.

Looking forward to hearing from you! 🙏`,
      tip: "Follow up within 48 hours of initial contact for best conversion.",
    },
    hindi: {
      category: "Follow Up",
      language: "Hindi",
      subject: "Follow Up",
      message: `{name} ji, Namaskar!

Humari pichli baat {topic} ke baare mein thi.

Kya aapne socha? Koi sawaal ho to bataiye, ya ek chhoti si call kar lete hain.

Aapka jawab ka intezaar hai! 🙏`,
      tip: "Hindi follow-ups feel less formal and get better response rates.",
    },
    gujarati: {
      category: "Follow Up",
      language: "Gujarati",
      subject: "Follow Up",
      message: `{name} bhai, Kem cho!

Aapni aagalni vaat {topic} vishe hati.

Tamey vicharyu? Koi sawal hoy to kaho, ke pachhi ek nani call kari lai.

Tamaro jawab ni rahu chhu! 🙏`,
      tip: "Gujarati follow-ups build stronger rapport with local businesses.",
    },
  },

  // ---- THANK YOU ----
  thank_you: {
    english: {
      category: "Thank You",
      language: "English",
      subject: "Thank You",
      message: `Thank you, {name}! 🙏

We really appreciate your {reason}. Your support means a lot to our business.

Looking forward to serving you again soon!

Best regards,
{sender_name}`,
      tip: "Send within 24 hours of the trigger event (payment, order, meeting).",
    },
    hindi: {
      category: "Thank You",
      language: "Hindi",
      subject: "Shukriya",
      message: `{name} ji, bahut bahut shukriya! 🙏

Aapke {reason} ke liye dil se dhanyavaad. Aapka support humare liye bahut important hai.

Jaldi phir milte hain! Accha kaam karte rahenge saath mein. 💪

{sender_name}`,
      tip: "Gratitude messages increase repeat business by 35%.",
    },
    gujarati: {
      category: "Thank You",
      language: "Gujarati",
      subject: "Aabhar",
      message: `{name} bhai, khub khub aabhar! 🙏

Tamara {reason} mate dil thi dhanyavaad. Tamaro support amara mate ghano important chhe.

Jaldi pachhi malishu! Sathe saaru kaam kariye! 💪

{sender_name}`,
      tip: "Gujarati thank-you notes strengthen long-term business bonds.",
    },
  },

  // ---- MEETING REQUEST ----
  meeting_request: {
    english: {
      category: "Meeting Request",
      language: "English",
      subject: "Meeting Request",
      message: `Hi {name},

Would you be available for a {duration} meeting to discuss {topic}?

Suggested times:
📅 {date_option_1}
📅 {date_option_2}

Happy to adjust to your schedule. Let me know what works!

Best,
{sender_name}`,
      tip: "Offer 2-3 time options to increase scheduling success rate.",
    },
    hindi: {
      category: "Meeting Request",
      language: "Hindi",
      subject: "Meeting Ka Request",
      message: `{name} ji, Namaskar!

Kya aap {topic} discuss karne ke liye {duration} ki meeting ke liye available hain?

Time options:
📅 {date_option_1}
📅 {date_option_2}

Aapki convenience ke hisaab se adjust kar lenge. Bataiye kab theek rahega!

{sender_name}`,
      tip: "Hindi meeting requests feel less corporate and more collaborative.",
    },
    gujarati: {
      category: "Meeting Request",
      language: "Gujarati",
      subject: "Meeting no Request",
      message: `{name} bhai, Kem cho!

{topic} discuss karva mate {duration} ni meeting thay sake?

Time options:
📅 {date_option_1}
📅 {date_option_2}

Tamari convenience mujab adjust kari laishu. Kyare thay sake te kaho!

{sender_name}`,
      tip: "Keep meeting requests casual for better acceptance rate.",
    },
  },

  // ---- QUOTATION ----
  quotation: {
    english: {
      category: "Quotation",
      language: "English",
      subject: "Price Quotation",
      message: `Dear {name},

Thank you for your inquiry! Here's our quotation:

📋 Items: {items}
💰 Price: Rs.{amount} (+ GST as applicable)
📅 Valid until: {valid_until}
🚚 Delivery: {delivery_timeline}

Payment terms: {payment_terms}

This is our best price for you. Let me know if you'd like to proceed!

Best regards,
{sender_name}`,
      tip: "Include a validity date to create urgency without being pushy.",
    },
    hindi: {
      category: "Quotation",
      language: "Hindi",
      subject: "Price Quotation",
      message: `{name} ji, Namaskar!

Aapki inquiry ke liye shukriya! Ye raha hamara quotation:

📋 Items: {items}
💰 Price: Rs.{amount} (+ GST)
📅 Valid: {valid_until} tak
🚚 Delivery: {delivery_timeline}

Payment terms: {payment_terms}

Ye aapke liye hamara best price hai. Aage badhna ho to bataiye!

{sender_name}`,
      tip: "Hindi quotations work great for local and regional businesses.",
    },
    gujarati: {
      category: "Quotation",
      language: "Gujarati",
      subject: "Price Quotation",
      message: `{name} bhai, Kem cho!

Tamari inquiry mate aabhar! Aa rahi amari quotation:

📋 Items: {items}
💰 Price: Rs.{amount} (+ GST)
📅 Valid: {valid_until} sudhi
🚚 Delivery: {delivery_timeline}

Payment terms: {payment_terms}

Aa tamara mate amaro best price chhe. Aage vadhvu hoy to kaho!

{sender_name}`,
      tip: "Gujarati quotations add trust for Gujarat-based business deals.",
    },
  },
};

export const whatsappTemplatesTool = {
  name: "whatsapp_templates",
  description:
    "Get pre-written WhatsApp message templates in Hindi, Gujarati, and English for common Indian MSME scenarios like payment reminders, GST alerts, order confirmations, festival greetings, follow-ups, thank-you notes, meeting requests, and quotations.",

  parameters: {
    type: "object" as const,
    properties: {
      category: {
        type: "string",
        enum: [
          "payment_reminder",
          "gst_alert",
          "order_confirmation",
          "festival_greeting",
          "follow_up",
          "thank_you",
          "meeting_request",
          "quotation",
        ],
        description: "The type of message template to retrieve",
      },
      language: {
        type: "string",
        enum: ["english", "hindi", "gujarati"],
        description:
          "Language for the template. Defaults to returning all 3 languages.",
      },
      variables: {
        type: "object",
        description:
          "Variables to fill in the template (e.g., { name: 'Rajesh', amount: '50,000' }). Use {variable_name} placeholders.",
      },
    },
    required: ["category"],
  },

  async execute(input: TemplateInput): Promise<TemplateResult> {
    const { category, language, variables } = input;

    const categoryTemplates = TEMPLATES[category];
    if (!categoryTemplates) {
      return {
        templates: [],
        note: `Category '${category}' not found. Available: ${Object.keys(TEMPLATES).join(", ")}`,
      };
    }

    // Get templates for requested language(s)
    let templates: Template[];
    if (language && categoryTemplates[language]) {
      templates = [categoryTemplates[language]];
    } else {
      templates = Object.values(categoryTemplates);
    }

    // Replace variables if provided
    if (variables) {
      templates = templates.map((t) => {
        let message = t.message;
        for (const [key, value] of Object.entries(variables)) {
          message = message.replace(new RegExp(`\\{${key}\\}`, "g"), value);
        }
        return { ...t, message };
      });
    }

    return {
      templates,
      note: "Replace {placeholder} values with actual data before sending. Templates are customizable — feel free to adjust the tone!",
    };
  },
};

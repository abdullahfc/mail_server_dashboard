const mockData = {
  totalBounces: 207,
  gmailBounces: 112,
  outlookBounces: 45,
  yahooBounces: 30,
  totalSent: 24655,
  totalDelivered: 24359,
  totalDeferred: 89,
  totalSpam: 12,
  totalInvalid: 195,
  totalUnsubscribes: 5,
  topBouncedDomainsGmail: [
    { domain: 'example.com', count: 32 },
    { domain: 'test.org', count: 18 },
    { domain: 'randommail.net', count: 12 },
    { domain: 'newsletter-bounce.com', count: 8 },
    { domain: 'campaign-err.com', count: 5 }
  ],
  topBouncedDomainsOutlook: [
    { domain: 'marketing.com', count: 21 },
    { domain: 'promo-updates.net', count: 14 },
    { domain: 'bounces-r-us.org', count: 6 },
    { domain: 'hello-world.com', count: 4 }
  ],
  topBouncedDomainsYahoo: [
    { domain: 'yahoo.com', count: 15 },
    { domain: 'ymail.com', count: 8 },
    { domain: 'rocketmail.com', count: 3 }
  ],
  topRecipientEmailsError: [
    { email: 'csr@master-roofinginc.com', count: 15 },
    { email: 'info@airhandlersva.com', count: 12 },
    { email: 'tharrington@syracusesignal.net', count: 10 },
    { email: 'gkansios@gmail.com', count: 8 },
    { email: 'heatherstout@benefitsspendhq.info', count: 7 },
    { email: 'alayahconway@driftcoreusa.co', count: 5 },
    { email: 'contact@sapperhvac.com', count: 4 },
    { email: 'john.smith@gmail.com', count: 4 },
    { email: 'alexa.collins@smartfortificapmedia.com', count: 3 },
    { email: 'directlineal@gamil.com', count: 2 }
  ],
  topRecipientDomainsError: [
    { domain: 'gmail.com', count: 120 },
    { domain: 'yahoo.com', count: 45 },
    { domain: 'outlook.com', count: 34 },
    { domain: 'hotmail.com', count: 22 },
    { domain: 'aol.com', count: 15 },
    { domain: 'icloud.com', count: 12 },
    { domain: 'protonmail.com', count: 8 },
    { domain: 'zoho.com', count: 5 },
    { domain: 'mail.com', count: 4 },
    { domain: 'yandex.com', count: 3 }
  ],
  historicalData: Array.from({ length: 30 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sent: Math.floor(Math.random() * 5000) + 15000,
      bounces: Math.floor(Math.random() * 100) + 20,
      deferred: Math.floor(Math.random() * 50) + 10,
    };
  })
};

module.exports = mockData;

/* ============================================================
   SignForge — configuration
   Edit this single file to rebrand the product or wire up
   your Stripe payment link. See README.md for details.
   ============================================================ */

var SITE_CONFIG = {
  brandName: "SignForge",

  /* Paste your Stripe Payment Link here (create one at
     https://dashboard.stripe.com/payment-links, e.g.
     "https://buy.stripe.com/xxxxxxxx"). While it still says
     PASTE_YOUR_STRIPE_PAYMENT_LINK_HERE, the upgrade button
     will politely tell the owner the link is not set. */
  stripePaymentLink: "PASTE_YOUR_STRIPE_PAYMENT_LINK_HERE",

  /* Displayed price on the landing page and in the upsell card. */
  price: "$9",

  /* Where this site is deployed. Used as the link target of the
     "Made with SignForge" badge inside free signatures, and for
     SEO defaults. Change this after you deploy (see README.md). */
  siteUrl: "https://signforge.netlify.app"
};

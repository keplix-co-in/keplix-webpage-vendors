// The ten FAQ entries vendors already see in the app, copied verbatim from
// keplix-frontend/components/Vendor/Support/FAQs.jsx. Answers here state policy
// (payout timing, cancellation), so they must not drift between web and mobile.

export const FAQS = [
  {
    id: 1,
    question: 'What is the Keplix Vendor App?',
    answer:
      'Keplix helps service providers receive bookings, manage jobs, and track earnings—all in one simple dashboard.',
  },
  {
    id: 2,
    question: 'How do I sign up as a vendor?',
    answer:
      "Enter your phone number, verify with OTP, fill in basic business details, upload documents, and you're ready to go after approval.",
  },
  {
    id: 3,
    question: 'What documents do I need?',
    answer: 'Shop ID, address proof, bank details, and GST (if applicable).',
  },
  {
    id: 4,
    question: 'How do I add or edit services?',
    answer: 'Go to Services → Add new service, set price, or edit existing ones anytime.',
  },
  {
    id: 5,
    question: 'How do I receive bookings?',
    answer: 'You’ll get instant notifications. Open the booking to accept, reject, or reschedule.',
  },
  {
    id: 6,
    question: 'How do payouts work?',
    answer:
      'Keplix transfers your earnings (after platform fee) directly to your bank within 24–72 hours.',
  },
  {
    id: 7,
    question: 'What if a customer cancels?',
    answer: 'You’ll be notified instantly. The platform automatically applies the cancellation policy.',
  },
  {
    id: 8,
    question: 'How do I check my earnings?',
    answer: 'Go to Earnings to view total income, pending payouts, and download statements.',
  },
  {
    id: 9,
    question: 'Can I chat with customers?',
    answer: 'Yes! Each booking includes a chat button for quick communication.',
  },
  {
    id: 10,
    question: 'The app isn’t working. What should I do?',
    answer:
      'Check your internet → Restart the app → Update to latest version. If still not fixed, contact support from Help → Support.',
  },
];

export default FAQS;

import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-gray-400">Last Updated: October 20, 2025</p>
        </div>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Introduction</h2>
            <p>
              Welcome to SyncCue. We respect your privacy and are committed to protecting your personal data.
              This privacy policy explains how we collect, use, and safeguard your information when you use our
              presentation timer application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Information We Collect</h2>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">Account Information</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Email address (required for account creation and authentication)</li>
              <li>Password (securely hashed and encrypted)</li>
              <li>Account creation and last login timestamps</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">Usage Data</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Timer configurations and preferences</li>
              <li>Event details (name, duration, description)</li>
              <li>Presenter assignments and access logs</li>
              <li>Team membership and role information</li>
              <li>Feedback submissions and ratings</li>
              <li>User settings and display preferences</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">Technical Information</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Device type and browser information</li>
              <li>IP address and general location data</li>
              <li>Session data and authentication tokens</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
            <p className="mb-3">We use your information to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide and maintain our timer service</li>
              <li>Authenticate your identity and manage your account</li>
              <li>Enable multi-user event coordination and presenter access</li>
              <li>Synchronize timers across multiple devices in real-time</li>
              <li>Generate performance reports and analytics</li>
              <li>Send PIN codes and access notifications</li>
              <li>Process payments and manage subscriptions</li>
              <li>Improve our service and develop new features</li>
              <li>Provide customer support</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Data Storage and Security</h2>
            <p className="mb-3">
              Your data is stored securely using Supabase, a modern database platform built on PostgreSQL.
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Encryption in transit (HTTPS/TLS)</li>
              <li>Encryption at rest for sensitive data</li>
              <li>Row-level security policies to protect your data</li>
              <li>Secure password hashing using industry-standard algorithms</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication mechanisms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Services</h2>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">Supabase</h3>
            <p className="mb-3">
              We use Supabase for authentication, database hosting, and real-time synchronization.
              Supabase processes your account information and application data.
              Learn more at <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">supabase.com/privacy</a>
            </p>

            <h3 className="text-xl font-semibold text-white mb-3 mt-4">Stripe</h3>
            <p className="mb-3">
              For paid subscriptions, we use Stripe to process payments. Stripe handles your payment
              information securely and we never store complete payment card details on our servers.
              Learn more at <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">stripe.com/privacy</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Data Sharing</h2>
            <p className="mb-3">
              We do not sell your personal data. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>With team members you explicitly invite to collaborate on events</li>
              <li>With service providers who help us operate our platform (Supabase, Stripe)</li>
              <li>When required by law or to protect our legal rights</li>
              <li>With your explicit consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Data Retention</h2>
            <p>
              We retain your data for as long as your account is active or as needed to provide you services.
              You can request deletion of your account and associated data at any time through the account settings.
              Deleted events are moved to a recently deleted folder for 30 days before permanent deletion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
            <p className="mb-3">Depending on your location, you may have the following rights:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Portability:</strong> Receive your data in a structured format</li>
              <li><strong>Objection:</strong> Object to certain processing of your data</li>
              <li><strong>Restriction:</strong> Request restriction of processing in certain cases</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, please contact us at hello@synccue.io or use the account settings
              within the application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Cookies and Local Storage</h2>
            <p>
              We use browser local storage and session storage to maintain your login session and store
              user preferences. This improves your experience by remembering your settings and keeping you
              logged in. You can clear this data through your browser settings, though this will log you out.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">International Data Transfers</h2>
            <p>
              Your data may be transferred to and processed in countries other than your own. We ensure
              appropriate safeguards are in place to protect your data in compliance with applicable privacy laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Children's Privacy</h2>
            <p>
              Our service is not intended for children under 13 years of age. We do not knowingly collect
              personal information from children under 13. If you believe we have collected information from
              a child under 13, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any material changes
              by posting the new policy on this page and updating the "Last Updated" date. Your continued use
              of the service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
            <p className="mb-3">
              If you have questions or concerns about this privacy policy or our data practices, please contact us:
            </p>
            <ul className="list-none space-y-2 ml-4">
              <li><strong>Email:</strong> <a href="mailto:hello@synccue.io" className="text-blue-400 hover:text-blue-300">hello@synccue.io</a></li>
              <li><strong>Application:</strong> SyncCue</li>
            </ul>
          </section>

          <section className="border-t border-gray-700 pt-8 mt-12">
            <h2 className="text-2xl font-semibold text-white mb-4">GDPR Compliance (European Users)</h2>
            <p className="mb-3">
              If you are located in the European Economic Area (EEA), UK, or Switzerland, you have additional
              rights under the General Data Protection Regulation (GDPR):
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Right to lodge a complaint with a supervisory authority</li>
              <li>Right to withdraw consent at any time</li>
              <li>Detailed information about our lawful basis for processing your data</li>
            </ul>
            <p className="mt-3">
              Our lawful basis for processing your personal data includes: performance of our contract with you,
              compliance with legal obligations, and legitimate interests in operating and improving our service.
            </p>
          </section>

          <section className="border-t border-gray-700 pt-8 mt-12">
            <h2 className="text-2xl font-semibold text-white mb-4">CCPA Rights (California Users)</h2>
            <p className="mb-3">
              If you are a California resident, you have specific rights under the California Consumer Privacy Act (CCPA):
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Right to know what personal information is collected, used, shared, or sold</li>
              <li>Right to delete personal information held by us</li>
              <li>Right to opt-out of the sale of personal information (we do not sell your data)</li>
              <li>Right to non-discrimination for exercising your CCPA rights</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-700">
          <a
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';

function Privacy() {
  return (
    <section className='legal-page'>
      <div className='container legal-container'>
        <header className='legal_header entrance-up'>
          <span className='legal_kicker'>Legal</span>
          <h1>Privacy Policy</h1>
          <p className='legal_updated'>Last updated: September 8, 2026</p>
        </header>

        <div className='legal_content entrance-up' style={{ animationDelay: '120ms' }}>
          <section>
            <h2>1. Introduction</h2>
            <p>
              Welcome to IVote (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). We are committed
              to protecting your personal information and your right to privacy. This Privacy Policy explains
              how we collect, use, disclose, and safeguard your information when you use our online voting
              platform and related services (collectively, the &ldquo;Service&rdquo;).
            </p>
            <p>
              By accessing or using the Service, you agree to the collection and use of information in
              accordance with this policy. If you do not agree, please discontinue use of the Service.
            </p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>
            <h3>Account Information</h3>
            <p>
              When you register, we collect your first name, last name, email address, and password.
              Administrators may have additional role-based attributes.
            </p>
            <h3>Election and Voting Data</h3>
            <p>
              We record election participation, vote submissions, and related audit metadata to ensure
              integrity of results. Individual vote choices are separated from voter identity in storage
              so that ballot secrecy is preserved.
            </p>
            <h3>Usage Data</h3>
            <p>
              We automatically collect certain technical data when you use the Service, including IP
              address, browser type, operating system, referral URLs, pages viewed, and timestamps. This
              data is used for security monitoring and service improvement.
            </p>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <ul>
              <li>To provide, maintain, and improve the Service.</li>
              <li>To verify voter identity and prevent duplicate voting.</li>
              <li>To authenticate users and manage account access.</li>
              <li>To detect and prevent fraud, abuse, and security incidents.</li>
              <li>To communicate transactional messages such as OTP codes and password resets.</li>
              <li>To comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2>4. How We Share Your Information</h2>
            <p>
              We do not sell your personal information. We may share information with:
            </p>
            <ul>
              <li>
                <strong>Service providers</strong> that help us operate the platform (hosting, email
                delivery, analytics) under strict data-processing agreements.
              </li>
              <li>
                <strong>Election administrators</strong> for elections you participate in, limited to
                what is necessary for managing that election.
              </li>
              <li>
                <strong>Legal authorities</strong> when required by law, court order, or to protect the
                rights, property, or safety of IVote or others.
              </li>
            </ul>
          </section>

          <section>
            <h2>5. Data Retention</h2>
            <p>
              We retain account information for as long as your account is active or as needed to provide
              the Service. Election audit records may be retained for longer periods to satisfy
              compliance and integrity requirements. You may request deletion of your account by contacting
              us.
            </p>
          </section>

          <section>
            <h2>6. Data Security</h2>
            <p>
              We implement industry-standard safeguards including encryption in transit (TLS), encrypted
              storage of sensitive data, role-based access controls, and regular security audits. However,
              no method of electronic transmission or storage is completely secure, and we cannot guarantee
              absolute security.
            </p>
          </section>

          <section>
            <h2>7. Your Rights</h2>
            <p>
              Depending on your jurisdiction, you may have rights to:
            </p>
            <ul>
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate or incomplete data.</li>
              <li>Request deletion of your personal data.</li>
              <li>Object to or restrict certain processing activities.</li>
              <li>Data portability.</li>
            </ul>
            <p>
              To exercise any of these rights, please contact us at{' '}
              <a href='mailto:privacy@ivote.com'>privacy@ivote.com</a>.
            </p>
          </section>

          <section>
            <h2>8. Cookies and Tracking</h2>
            <p>
              We use essential cookies to maintain your session and authentication state. We may also use
              analytics tools to understand how the Service is used. You can manage cookie preferences
              through the cookie consent banner displayed on your first visit.
            </p>
          </section>

          <section>
            <h2>9. Children&rsquo;s Privacy</h2>
            <p>
              The Service is not intended for users under the age of 16. We do not knowingly collect
              personal information from children. If we become aware that we have collected data from a
              child, we will take steps to delete it promptly.
            </p>
          </section>

          <section>
            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Material changes will be communicated
              through in-app notifications or email. The &ldquo;Last updated&rdquo; date at the top
              reflects the most recent revision.
            </p>
          </section>

          <section>
            <h2>11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at{' '}
              <a href='mailto:privacy@ivote.com'>privacy@ivote.com</a>.
            </p>
          </section>
        </div>

        <div className='legal_footer entrance-up' style={{ animationDelay: '200ms' }}>
          <Link to='/' className='btn'>&larr; Back to Home</Link>
          <Link to='/terms' className='btn primary'>Terms &amp; Conditions &rarr;</Link>
        </div>
      </div>
    </section>
  );
}

export default Privacy;

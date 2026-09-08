import React from 'react';
import { Link } from 'react-router-dom';

function Terms() {
  return (
    <section className='legal-page'>
      <div className='container legal-container'>
        <header className='legal_header entrance-up'>
          <span className='legal_kicker'>Legal</span>
          <h1>Terms &amp; Conditions</h1>
          <p className='legal_updated'>Last updated: September 8, 2026</p>
        </header>

        <div className='legal_content entrance-up' style={{ animationDelay: '120ms' }}>
          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using IVote (the &ldquo;Service&rdquo;), you agree to be bound by these
              Terms &amp; Conditions. If you do not agree, do not use the Service. These terms apply to
              all visitors, users, and others who access the Service.
            </p>
          </section>

          <section>
            <h2>2. Eligibility</h2>
            <p>
              You must be at least 16 years old to use the Service. By creating an account, you represent
              and warrant that you meet this age requirement and that the information you provide is
              accurate and complete.
            </p>
          </section>

          <section>
            <h2>3. Account Responsibilities</h2>
            <p>
              You are responsible for safeguarding your account credentials. You agree to:
            </p>
            <ul>
              <li>Not share your account with others.</li>
              <li>Notify us immediately of any unauthorized use.</li>
              <li>Ensure that your account information remains accurate.</li>
              <li>Accept responsibility for all activities that occur under your account.</li>
            </ul>
          </section>

          <section>
            <h2>4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any unlawful purpose.</li>
              <li>Attempt to manipulate, exploit, or circumvent election mechanisms.</li>
              <li>Impersonate another person or misrepresent your identity.</li>
              <li>Interfere with or disrupt the Service or its infrastructure.</li>
              <li>Attempt to gain unauthorized access to other accounts or systems.</li>
              <li>Use automated tools to interact with the Service unless explicitly authorized.</li>
            </ul>
          </section>

          <section>
            <h2>5. Election Integrity</h2>
            <p>
              IVote enforces one-person-one-vote rules for each election. Submitting multiple votes,
              tampering with ballots, or attempting to manipulate election results is strictly prohibited
              and may result in immediate account termination and, where applicable, legal action.
            </p>
          </section>

          <section>
            <h2>6. Intellectual Property</h2>
            <p>
              All content, design, logos, trademarks, and software associated with IVote are owned by or
              licensed to us. You are granted a limited, non-exclusive license to use the Service for its
              intended purpose. You may not copy, modify, distribute, or reverse-engineer any part of the
              Service without prior written consent.
            </p>
          </section>

          <section>
            <h2>7. User Content</h2>
            <p>
              If you submit content (e.g., election titles, descriptions, candidate information), you
              retain ownership but grant IVote a worldwide, non-exclusive license to use, display, and
              distribute that content in connection with the Service. You represent that you have the
              rights to any content you submit.
            </p>
          </section>

          <section>
            <h2>8. Disclaimer of Warranties</h2>
            <p>
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties
              of any kind, whether express or implied. We do not warrant that the Service will be
              uninterrupted, error-free, or secure.
            </p>
          </section>

          <section>
            <h2>9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, IVote and its affiliates shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages, or any loss of profits or
              data, arising from your use of the Service, even if we have been advised of the possibility
              of such damages.
            </p>
          </section>

          <section>
            <h2>10. Termination</h2>
            <p>
              We may suspend or terminate your account at our discretion, with or without notice, if we
              believe you have violated these terms. Upon termination, your right to use the Service
              ceases immediately. We may retain certain data as required by law or for legitimate business
              purposes.
            </p>
          </section>

          <section>
            <h2>11. Governing Law</h2>
            <p>
              These terms are governed by and construed in accordance with applicable laws. Any disputes
              arising under these terms shall be resolved in the competent courts of the applicable
              jurisdiction.
            </p>
          </section>

          <section>
            <h2>12. Changes to These Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Material changes will be notified
              through the Service or by email. Continued use after changes become effective constitutes
              acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2>13. Contact Us</h2>
            <p>
              If you have questions about these Terms &amp; Conditions, please contact us at{' '}
              <a href='mailto:legal@ivote.com'>legal@ivote.com</a>.
            </p>
          </section>
        </div>

        <div className='legal_footer entrance-up' style={{ animationDelay: '200ms' }}>
          <Link to='/' className='btn'>&larr; Back to Home</Link>
          <Link to='/privacy' className='btn primary'>Privacy Policy &rarr;</Link>
        </div>
      </div>
    </section>
  );
}

export default Terms;

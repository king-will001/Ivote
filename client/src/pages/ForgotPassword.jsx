import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { requestOtp, resetPassword } from '../utils/apiSimulator';

const OTP_TTL_SECONDS = 10 * 60;
const RESEND_COOLDOWN_SECONDS = 30;

const formatOtpTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
};

const ForgotPassword = () => {
  const [step, setStep] = useState('request');
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    password: '',
    passwordConfirm: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);
  const [otpTimerKey, setOtpTimerKey] = useState(0);
  const [resendMessage, setResendMessage] = useState(null);

  useEffect(() => {
    if (step !== 'reset') {
      setOtpSecondsLeft(0);
      setResendSecondsLeft(0);
      setResendMessage(null);
      return undefined;
    }

    const otpExpiresAt = Date.now() + OTP_TTL_SECONDS * 1000;
    const resendAvailableAt = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;

    const tick = () => {
      const now = Date.now();
      const otpRemaining = Math.max(0, Math.ceil((otpExpiresAt - now) / 1000));
      const resendRemaining = Math.max(
        0,
        Math.ceil((resendAvailableAt - now) / 1000)
      );
      setOtpSecondsLeft(otpRemaining);
      setResendSecondsLeft(resendRemaining);
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [step, otpTimerKey]);

  const changeInputHandler = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.email.trim()) {
      setError('Email is required.');
      return;
    }

    if (step === 'request') {
      setIsLoading(true);
      try {
        const response = await requestOtp({
          email: formData.email.trim(),
          purpose: 'reset',
        });
        if (response.success) {
          setSuccess(
            response.data?.message ||
              'If the account exists, an OTP has been sent.'
          );
          setStep('reset');
          setOtpTimerKey((prev) => prev + 1);
        } else {
          setError(response.message || 'Failed to send reset code.');
        }
      } catch (err) {
        setError('Failed to send reset code.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (step === 'reset') {
      if (!formData.otp.trim()) {
        setError('OTP is required.');
        return;
      }
      if (!formData.password || !formData.passwordConfirm) {
        setError('Password and confirmation are required.');
        return;
      }
      if (formData.password !== formData.passwordConfirm) {
        setError('Passwords do not match.');
        return;
      }

      setIsLoading(true);
      try {
        const response = await resetPassword({
          email: formData.email.trim(),
          otp: formData.otp.trim(),
          password: formData.password,
          passwordConfirm: formData.passwordConfirm,
        });
        if (response.success) {
          setSuccess('Password reset successful. You can now sign in.');
          setStep('done');
        } else {
          setError(response.message || 'Failed to reset password.');
        }
      } catch (err) {
        setError('Failed to reset password.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleResendOtp = async () => {
    if (isResending || resendSecondsLeft > 0) return;
    setError(null);
    setSuccess(null);
    setResendMessage(null);

    const email = formData.email.trim();
    if (!email) {
      setError('Email is required.');
      return;
    }

    setIsResending(true);
    try {
      const response = await requestOtp({ email, purpose: 'reset' });
      if (response.success) {
        setResendMessage(response.data?.message || 'A new OTP has been sent.');
        setOtpTimerKey((prev) => prev + 1);
      } else {
        setError(response.message || 'Failed to resend OTP.');
      }
    } catch (err) {
      setError('Failed to resend OTP.');
    } finally {
      setIsResending(false);
    }
  };

  const handleResetFlow = () => {
    setStep('request');
    setError(null);
    setSuccess(null);
    setResendMessage(null);
    setFormData((prev) => ({
      ...prev,
      otp: '',
      password: '',
      passwordConfirm: '',
    }));
  };

  const isRequestStep = step === 'request';
  const isResetStep = step === 'reset';
  const isDoneStep = step === 'done';

  return (
    <section className='register'>
      <div className='auth_shell'>
        <div className='auth_brand'>
          <span className='auth_badge'>IVOTE</span>
          <h1>Protect your account access.</h1>
          <p>
            Reset your password securely with a one-time verification code.
          </p>
          <div className='auth_points'>
            <span>Secure OTP verification</span>
            <span>Password updates in minutes</span>
            <span>Access restored across devices</span>
          </div>
        </div>

        <div className='auth_card'>
          <div className='register_container'>
            <div className='auth_header'>
              <span className='auth_kicker'>
                {isResetStep ? 'Verify code' : isDoneStep ? 'Complete' : 'Reset access'}
              </span>
              <h2>
                {isResetStep
                  ? 'Set a new password'
                  : isDoneStep
                    ? 'Password updated'
                    : 'Forgot password'}
              </h2>
              <p className='auth_subtitle'>
                {isResetStep
                  ? 'Enter your OTP and choose a new password.'
                  : isDoneStep
                    ? 'Your password is reset. Sign in to continue.'
                    : 'Enter your email to receive a reset code.'}
              </p>
            </div>

            {isDoneStep ? (
              <div className='auth_done'>
                {success && <p className='form_success-message'>{success}</p>}
                <p>
                  Ready to sign in? <Link to='/login'>Go to login</Link>
                </p>
                <button type='button' className='btn' onClick={handleResetFlow}>
                  Reset another account
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && <p className='form_error-message'>{error}</p>}
                {success && <p className='form_success-message'>{success}</p>}

                <input
                  type='email'
                  name='email'
                  placeholder='Email'
                  value={formData.email}
                  onChange={changeInputHandler}
                  autoComplete='email'
                  disabled={isLoading || isResetStep}
                />

                {isResetStep && (
                  <>
                    <input
                      type='text'
                      name='otp'
                      placeholder='Enter OTP'
                      value={formData.otp}
                      onChange={changeInputHandler}
                      autoComplete='one-time-code'
                      disabled={isLoading}
                    />
                    <input
                      type='password'
                      name='password'
                      placeholder='New password'
                      value={formData.password}
                      onChange={changeInputHandler}
                      autoComplete='new-password'
                      disabled={isLoading}
                    />
                    <input
                      type='password'
                      name='passwordConfirm'
                      placeholder='Confirm new password'
                      value={formData.passwordConfirm}
                      onChange={changeInputHandler}
                      autoComplete='new-password'
                      disabled={isLoading}
                    />
                    <p className={`otp_timer${otpSecondsLeft === 0 ? ' expired' : ''}`}>
                      {otpSecondsLeft === 0
                        ? 'Code expired. Use resend to get a new one.'
                        : `Code expires in ${formatOtpTime(otpSecondsLeft)}`}
                    </p>
                    <div className='otp_actions'>
                      <button
                        type='button'
                        className='btn sm'
                        onClick={handleResendOtp}
                        disabled={isResending || resendSecondsLeft > 0}
                      >
                        {isResending
                          ? 'Sending...'
                          : resendSecondsLeft > 0
                            ? `Resend in ${formatOtpTime(resendSecondsLeft)}`
                            : 'Resend code'}
                      </button>
                      {resendMessage && (
                        <span className='otp_action-note'>{resendMessage}</span>
                      )}
                    </div>
                    <p>
                      Not your email?{' '}
                      <button
                        type='button'
                        className='btn sm'
                        onClick={handleResetFlow}
                        disabled={isLoading}
                      >
                        Start over
                      </button>
                    </p>
                  </>
                )}

                {isRequestStep && (
                  <p className='auth_helper'>
                    Remembered your password? <Link to='/login'>Sign in</Link>
                  </p>
                )}

                <button type='submit' className='btn primary' disabled={isLoading}>
                  {isLoading
                    ? 'Please wait...'
                    : isResetStep
                      ? 'Reset password'
                      : 'Send reset code'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForgotPassword;

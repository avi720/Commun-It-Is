import React, { useState } from 'react';
import OnboardingPage from './Register/OnboardingPage';
import RegisterPage from './Register/RegisterPage';

export default function SignIn() {
    const [authData, setAuthData] = useState({ email: '', password: '' });
    const [step, setStep] = useState(1); // 1 = Register, 2 = Onboarding

    const handleContinue = (data) => {
        setAuthData(data); // שומר מייל וסיסמה
        setStep(2);        // עובר לשלב הבא
    };

    return (
        step === 1 
        ? <RegisterPage onContinue={handleContinue} />
        : <OnboardingPage initialAuth={authData} />
    );
}
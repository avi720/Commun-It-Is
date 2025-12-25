import React, { useState } from 'react';
import OnboardingPage from './Register/OnboardingPage';
import RegisterPage from './Register/RegisterPage';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isFinished, setIsFinished] = useState(false);
    return (
        isFinished
        ? (<OnboardingPage initialAuth={{ email, password }} /> ) 
        : (
            <RegisterPage 
                onContinue={({ email, password }) => {
                    setEmail(email);
                    setPassword(password);
                    setIsFinished(true);
                }} 
            />  
        )  
    )
 }
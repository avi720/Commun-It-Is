// ESLint flat config — ESLint 9, React 19, Vite 7.
//
// קוד יעדים מותאם ל-tech-debt findings שהיו לנו:
// - no-undef + no-unused-vars יתפסו את הסוג של T3 (avior לא מיובא) ו-T26 (formatDate מת)
// - react/jsx-no-comment-textnodes יתפוס T12
// - no-unused-expressions יתפוס T25 (closeSidebar;)
// - no-alert חוסם רגרסיה ל-T9 (חזרה ל-alert() ניטיב)
// - no-console מותר רק עבור warn/error — מונע רגרסיה ל-T10 (token leaks דרך console.log)
//
// אזורים שמסונכרנים עם הקוד:
// - vitest globals (describe/it/expect/vi) זמינים בקבצי .test.{js,jsx}
// - dist / .venv / android / node_modules מוחרגים

import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
    { ignores: ['dist', '.venv', 'android', 'node_modules', '.vercel'] },

    // קבצי source — React + JSX
    {
        files: ['src/**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                // Build-time constants injected by Vite's `define` (see vite.config.js)
                __APP_VERSION__: 'readonly',
            },
            parserOptions: {
                ecmaVersion: 'latest',
                ecmaFeatures: { jsx: true },
            },
        },
        plugins: {
            react,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        settings: { react: { version: '19.2' } },
        rules: {
            // base recommended
            ...js.configs.recommended.rules,
            ...react.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,

            // לא רלוונטי ב-React 17+ עם new JSX transform
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off', // לא משתמשים ב-PropTypes; TypeScript לעתיד
            'react/no-unknown-property': ['error', { ignore: ['dir'] }],

            // כלל T12 — JSX comment כסיבטל text node
            'react/jsx-no-comment-textnodes': 'error',

            // Hooks + Vite HMR
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

            // Rule חדש ב-eslint-plugin-react-hooks 7.x שמתריע על setState בתוך useEffect.
            // הכלל נכון תיאורטית (cascading renders), אבל בקוד יש כמה דפוסים תקפים
            // שהוא חוסם: טעינה ב-mount (AppContext), סנכרון form עם user prop
            // אסינכרוני (ProfileForm/SendRide). מורידים ל-warn במקום להחליף את כל
            // הדפוסים האלה — מי שמסתכל ב-lint יראה אותם, אבל הם לא חוסמים CI.
            'react-hooks/set-state-in-effect': 'warn',

            // יעדים שמגנים על תיקוני סבב הסבב הזה
            'no-alert': 'error',                       // T9 regression guard
            'no-console': ['warn', { allow: ['warn', 'error'] }], // T10
            'no-unused-expressions': 'error',          // T25
            'no-unused-vars': ['error', {
                varsIgnorePattern: '^[A-Z_]',          // אפשר UnusedComponentImport דרך CamelCase
                argsIgnorePattern: '^_',
            }],
            'no-undef': 'error',                       // T3
        },
    },

    // קבצי תצורה ב-root (vite.config, tailwind.config, וכו') — Node env
    {
        files: ['*.{js,cjs,mjs}', 'vitest.setup.js'],
        languageOptions: {
            globals: { ...globals.node },
            ecmaVersion: 2024,
            sourceType: 'module',
        },
    },

    // קבצי בדיקה — vitest globals + jest-dom
    {
        files: ['**/*.test.{js,jsx}', '**/*.spec.{js,jsx}'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                vi: 'readonly',
                vitest: 'readonly',
                describe: 'readonly',
                it: 'readonly',
                test: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
            },
        },
        rules: {
            // ב-tests מותר alert/console (אם פתאום תרצה לדבג)
            'no-alert': 'off',
            'no-console': 'off',
        },
    },
];

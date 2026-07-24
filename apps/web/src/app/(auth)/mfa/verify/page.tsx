import { AuthWorkflowForm } from '../../../../components/auth/auth-workflow-form';
import { Suspense } from 'react';
export default function MfaVerifyPage() { return <Suspense><AuthWorkflowForm kind="mfa-verify" /></Suspense>; }

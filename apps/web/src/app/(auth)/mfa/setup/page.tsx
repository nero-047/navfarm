import { AuthWorkflowForm } from '../../../../components/auth/auth-workflow-form';
import { Suspense } from 'react';
export default function MfaSetupPage() { return <Suspense><AuthWorkflowForm kind="mfa-setup" /></Suspense>; }

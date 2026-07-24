import { AuthWorkflowForm } from '../../../../components/auth/auth-workflow-form';
import { Suspense } from 'react';
export default function MfaRecoveryPage() { return <Suspense><AuthWorkflowForm kind="mfa-recovery" /></Suspense>; }

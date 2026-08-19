import LoginForm from '@/components/LoginForm';
import { isPhoneFeaturesEnabled } from '@/lib/settings';

export default async function LoginPage() {
  const phoneEnabled = await isPhoneFeaturesEnabled();
  return (
    <div className="flex flex-col items-center py-12">
      <LoginForm phoneEnabled={phoneEnabled} />
    </div>
  );
}
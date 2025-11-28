import { AuthForm } from "@/components/auth/AuthForm";

const Signup = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <AuthForm mode="signup" />
    </div>
  );
};

export default Signup;

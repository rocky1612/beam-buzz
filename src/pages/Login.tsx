import { AuthForm } from "@/components/auth/AuthForm";

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <AuthForm mode="login" />
    </div>
  );
};

export default Login;

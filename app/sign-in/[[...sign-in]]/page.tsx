import { SignIn } from '@clerk/nextjs';
import { Library } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-stone-100 via-indigo-50/30 to-stone-100 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="bg-indigo-900 p-3 rounded-xl shadow-lg">
            <Library className="w-7 h-7 text-indigo-100" />
          </div>
        </div>
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">LinguaLift</h1>
        <p className="text-stone-500 text-sm font-light tracking-wide">Your VCE EAL Learning Companion</p>
      </div>
      <SignIn
        forceRedirectUrl="/"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-stone-200/60",
            headerTitle: "font-serif text-2xl text-slate-900",
            headerSubtitle: "text-stone-500 font-light",
            formButtonPrimary: "bg-indigo-900 hover:bg-indigo-800 text-white shadow-lg transition-all duration-200",
            formFieldInput: "border-stone-300 focus:ring-indigo-500 focus:border-indigo-500 bg-stone-50/50 rounded-lg",
            formFieldLabel: "text-slate-700 font-medium",
            footerActionLink: "text-indigo-600 hover:text-indigo-800 font-medium",
            socialButtonsBlockButton: "border-stone-200 hover:bg-stone-50 transition-colors",
            dividerLine: "bg-stone-200",
            dividerText: "text-stone-400",
            identityPreview: "bg-stone-50 border-stone-200",
            formFieldAction: "text-indigo-600 hover:text-indigo-800",
          },
          variables: {
            colorPrimary: "#312e81",
            colorTextOnPrimaryBackground: "#fff",
            borderRadius: "0.75rem",
            fontFamily: "'Inter', sans-serif",
          },
        }}
        path="/sign-in"
        signUpUrl="/sign-up"
      />
    </div>
  );
}

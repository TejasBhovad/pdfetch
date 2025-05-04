import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4 gap-4">
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        appearance={{
          elements: {
            formButtonPrimary: "bg-blue-500 hover:bg-blue-600",
            formButtonSecondary: "bg-gray-500 hover:bg-gray-600",
          },
        }}
      />
    </div>
  );
}

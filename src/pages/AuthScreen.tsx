import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleAuth = async () => {
    setError(null);
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name.trim() } },
      });
      if (error) {
        setError(error.message);
      } else if (data.session) {
        // Email confirmation disabled — signed in immediately
        // Seed app_data row with display_name so they're discoverable right away
        await supabase.from("app_data").upsert({
          id: data.session.user.id,
          display_name: name.trim(),
          data: {},
        });
      } else {
        setConfirmed(true);
      }
    }

    setLoading(false);
  };

  const ready = isLogin ? email && password : email && password && name.trim();

  const changeMode = (mode: string | null) => {
    if (!mode) return;
    setIsLogin(mode === "login");
    setError(null);
    setName("");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleAuth();
  };

  const renderForm = (loginMode: boolean) => (
    <>
      <h2 className="mb-4 text-base font-semibold text-foreground">
        {loginMode ? "Sign in" : "Create account"}
      </h2>
      <form onSubmit={submit} noValidate className="flex flex-col gap-2.5">
        {!loginMode && (
          <Input
            aria-label="Your name"
            placeholder="Your name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            autoFocus
            className="h-10 border-input bg-background text-sm"
          />
        )}

        <Input
          aria-label="Email"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="h-10 border-input bg-background text-sm"
        />
        <Input
          aria-label="Password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={loginMode ? "current-password" : "new-password"}
          aria-invalid={Boolean(error)}
          className="h-10 border-input bg-background text-sm"
        />

        {error && (
          <div
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive"
            role="alert"
          >
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading || !ready} className="mt-0.5 h-10 w-full font-bold">
          {loading ? "..." : loginMode ? "Sign in" : "Create account"}
        </Button>
      </form>
    </>
  );

  if (confirmed)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm gap-0 border-border bg-card p-2 text-center shadow-xl shadow-black/20">
          <CardHeader className="justify-items-center gap-2 px-6 pt-6 pb-3">
            <div className="mb-1 text-4xl" aria-hidden="true">📬</div>
            <CardTitle className="text-xl">Check your email</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              We sent a confirmation link to{" "}
              <strong className="text-foreground">{email}</strong>. Click it to activate
              your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-5">
            <Button
              type="button"
              variant="link"
              onClick={() => {
                setConfirmed(false);
                setIsLogin(true);
              }}
              className="text-primary"
            >
              Back to login
            </Button>
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm gap-0 border-border bg-card p-2 shadow-xl shadow-black/20">
        <CardHeader className="items-center px-6 pt-6 pb-3 text-center">
          <h1 className="text-[22px] font-bold tracking-tight text-foreground">
            🔥 Hot Wax Weekly
          </h1>
          <CardDescription className="mt-0.5 text-[13px] italic">
            your album journal
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pt-3 pb-6">
          <Tabs value={isLogin ? "login" : "signup"} onValueChange={changeMode}>
            <TabsList className="flex w-full">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="pt-4">
              {renderForm(true)}
            </TabsContent>
            <TabsContent value="signup" className="pt-4">
              {renderForm(false)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

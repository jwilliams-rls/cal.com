//Updated 092524 5:19pm
import { zodResolver } from "@hookform/resolvers/zod";
import classNames from "classnames";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { SAMLogin } from "@calcom/features/auth/SAMLLogin";
import { ErrorCode } from "@calcom/features/auth/lib/ErrorCode";
import { HOSTED_CAL_FEATURES, WEBAPP_URL, WEBSITE_URL } from "@calcom/lib/constants";
import { getSafeRedirectUrl } from "@calcom/lib/getSafeRedirectUrl";
import { useCompatSearchParams } from "@calcom/lib/hooks/useCompatSearchParams";
import { useLastUsed, LastUsed } from "@calcom/lib/hooks/useLastUsed";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { collectPageParameters, telemetryEventTypes, useTelemetry } from "@calcom/lib/telemetry";
import { trpc } from "@calcom/trpc/react";
import { Alert, Button, EmailField, PasswordField } from "@calcom/ui";

import type { inferSSRProps } from "@lib/types/inferSSRProps";
import type { WithNonceProps } from "@lib/withNonce";

import AddToHomescreen from "@components/AddToHomescreen";
import PageWrapper from "@components/PageWrapper";
import BackupCode from "@components/auth/BackupCode";
import TwoFactor from "@components/auth/TwoFactor";
import AuthContainer from "@components/ui/AuthContainer";

import { getServerSideProps } from "@server/lib/auth/login/getServerSideProps";

interface LoginValues {
  email: string;
  password: string;
  totpCode: string;
  backupCode: string;
  csrfToken: string;
}

const GoogleIcon = () => (
  <img className="text-subtle mr-2 h-4 w-4 dark:invert" src="/google-icon.svg" alt="" />
);

export default function Login({
  csrfToken,
  isGoogleLoginEnabled,
  isSAMLLoginEnabled,
  samlTenantID,
  samlProductID,
  totpEmail,
}: inferSSRProps<typeof getServerSideProps> & WithNonceProps) {
  const searchParams = useCompatSearchParams();
  const { t } = useLocale();
  const router = useRouter();
  const formSchema = z.object({
    email: z
      .string()
      .min(1, `${t("error_required_field")}`)
      .email(`${t("enter_valid_email")}`),
    password: z.string().min(1, `${t("error_required_field")}`),
  });
  const methods = useForm<LoginValues>({ resolver: zodResolver(formSchema) });
  const { register, formState } = methods;
  const [twoFactorRequired, setTwoFactorRequired] = useState(!!totpEmail || false);
  const [twoFactorLostAccess, setTwoFactorLostAccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUsed, setLastUsed] = useLastUsed();

  const errorMessages: { [key: string]: string } = {
    [ErrorCode.SecondFactorRequired]: t("2fa_enabled_instructions"),
    [ErrorCode.IncorrectEmailPassword]: t("incorrect_email_password"),
    [ErrorCode.IncorrectTwoFactorCode]: `${t("incorrect_2fa_code")} ${t("please_try_again")}`,
    [ErrorCode.InternalServerError]: `${t("something_went_wrong")} ${t("please_try_again_and_contact_us")}`,
    [ErrorCode.ThirdPartyIdentityProviderEnabled]: t("account_created_with_identity_provider"),
  };

  const telemetry = useTelemetry();

  let callbackUrl = searchParams?.get("callbackUrl") || "";
  if (/^\/\//.test(callbackUrl)) callbackUrl = callbackUrl.substring(1);

  // If not absolute URL, make it absolute
  if (!/^https?:\/\//.test(callbackUrl)) {
    callbackUrl = `${WEBAPP_URL}/${callbackUrl}`;
  }

  const safeCallbackUrl = getSafeRedirectUrl(callbackUrl);
  callbackUrl = safeCallbackUrl || "";

  const LoginFooter = (
    <Link href={`${WEBSITE_URL}/signup`} className="text-brand-500 font-medium">
      {t("dont_have_an_account")}
    </Link>
  );

  const TwoFactorFooter = (
    <>
      <Button
        onClick={() => {
          if (twoFactorLostAccess) {
            setTwoFactorLostAccess(false);
            methods.setValue("backupCode", "");
          } else {
            setTwoFactorRequired(false);
            methods.setValue("totpCode", "");
          }
          setErrorMessage(null);
        }}
        StartIcon="arrow-left"
        color="minimal">
        {t("go_back")}
      </Button>
      {!twoFactorLostAccess ? (
        <Button
          onClick={() => {
            setTwoFactorLostAccess(true);
            setErrorMessage(null);
            methods.setValue("totpCode", "");
          }}
          StartIcon="lock"
          color="minimal">
          {t("lost_access")}
        </Button>
      ) : null}
    </>
  );

  const ExternalTopFooter = (
    <Button
      onClick={() => {
        window.location.replace("/");
      }}
      color="minimal">
      {t("cancel")}
    </Button>
  );

  const onSubmit = async (values: LoginValues) => {
    setErrorMessage(null);
    telemetry.event(telemetryEventTypes.login, collectPageParameters());
    const res = await signIn<"credentials">("credentials", {
      ...values,
      callbackUrl,
      redirect: false,
    });
    if (!res) setErrorMessage(errorMessages[ErrorCode.InternalServerError]);
    // we're logged in! let's do a hard refresh to the desired url
    else if (!res.error) {
      setLastUsed("credentials");
      router.push(callbackUrl);
    } else if (res.error === ErrorCode.SecondFactorRequired) setTwoFactorRequired(true);
    else if (res.error === ErrorCode.IncorrectBackupCode) setErrorMessage(t("incorrect_backup_code"));
    else if (res.error === ErrorCode.MissingBackupCodes) setErrorMessage(t("missing_backup_codes"));
    // fallback if error not found
    else setErrorMessage(errorMessages[res.error] || t("something_went_wrong"));
  };

  const { data, isPending, error } = trpc.viewer.public.ssoConnections.useQuery();

  useEffect(
    function refactorMeWithoutEffect() {
      if (error) {
        setErrorMessage(error.message);
      }
    },
    [error]
  );

  const displaySSOLogin = HOSTED_CAL_FEATURES
    ? true
    : isSAMLLoginEnabled && !isPending && data?.connectionExists;

  return (
    <div className="dark:bg-brand dark:text-brand-contrast text-emphasis min-h-screen [-cal-brand-emphasis:#101010] [-cal-brand-subtle:#9CA3AF] [-cal-brand-text:white] dark:[-cal-brand-emphasis:#e1e1e1] dark:[-cal-brand-subtle:#f0f0f0]">
      <AuthContainer footer={twoFactorRequired ? TwoFactorFooter : LoginFooter}>
        <FormProvider {...methods}>
          {errorMessage && <Alert color="danger">{errorMessage}</Alert>}
          <form
            data-testid="form"
            className={classNames("space-y-2", {
              hidden: twoFactorRequired,
            })}
            onSubmit={methods.handleSubmit(onSubmit)}>
            <input defaultValue={csrfToken || ""} type="hidden" hidden {...register("csrfToken")} />
            <EmailField required data-testid="email" />
            <PasswordField
              data-testid="password"
              disabled={formState.isSubmitting}
              externalTopFooter={ExternalTopFooter}
            />
            <Button
              type="submit"
              className="w-full justify-center"
              disabled={formState.isSubmitting}
              data-testid="signin">
              {t("sign_in")}
              {lastUsed === "credentials" && <LastUsed />}
            </Button>
          </form>
          {twoFactorRequired && (
            <>
              {!twoFactorLostAccess ? (
                <TwoFactor callbackUrl={callbackUrl} />
              ) : (
                <BackupCode callbackUrl={callbackUrl} />
              )}
            </>
          )}
          {!twoFactorRequired && (isGoogleLoginEnabled || displaySSOLogin) && (
            <>
              {isGoogleLoginEnabled && (
                <Button
                  color="secondary"
                  className="w-full justify-center"
                  disabled={formState.isSubmitting}
                  data-testid="google"
                  CustomStartIcon={<GoogleIcon />}
                  onClick={async (e) => {
                    e.preventDefault();
                    const res = await signIn("google", {
                      callbackUrl,
                    });
                    if (res && !res.error) {
                      setLastUsed("google");
                    }
                  }}>
                  <span>{t("signin_with_google")}</span>
                  {lastUsed === "google" && <LastUsed />}
                </Button>
              )}
              {displaySSOLogin && (
                <SAMLogin
                  samlTenantID={samlTenantID}
                  samlProductID={samlProductID}
                  setErrorMessage={setErrorMessage}
                />
              )}
            </>
          )}
        </FormProvider>
      </AuthContainer>
      <AddToHomescreen />
    </div>
  );
}

export { getServerSideProps };

Login.PageWrapper = PageWrapper;

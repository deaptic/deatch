import { Check, Copy } from "lucide-solid";
import { Show } from "solid-js";
import TwitchIcon from "./TwitchIcon.tsx";
import Button from "../../kit/Button.tsx";
import Loading from "../../kit/Loading.tsx";
import Card from "../../kit/Card.tsx";
import {
  deviceCode,
  type RestoreFailure,
  restoreFailure,
  waiting,
} from "../../lib/stores/auth.ts";
import * as session from "../../lib/services/session.ts";
import * as browser from "../../lib/services/browser.ts";
import { createCopied } from "../../kit/createCopied.ts";
import { t, tRich } from "../../shared/i18n/index.ts";
import { formatUrl } from "../../shared/format/url.ts";

const RESTORE_FAILURE_TEXT = {
  missingScope: "LOGIN_MISSING_SCOPE_ERROR",
  unreachable: "LOGIN_RESTORE_RETRYING_STATUS",
} as const satisfies Record<RestoreFailure, string>;

export default function Login() {
  const codeCopy = createCopied();

  return (
    <main class="flex-1 flex items-center justify-center px-6">
      <div class="w-100 max-w-full flex flex-col items-center text-center gap-4">
        <h1 class="text-hero text-ink">{t("LOGIN_WELCOME_TITLE")}</h1>
        <p class="text-body text-ink-soft">{t("LOGIN_TAGLINE_DESCRIPTION")}</p>
        <Show when={restoreFailure()}>
          {(failure) => (
            <p class="text-small text-caution">
              {t(RESTORE_FAILURE_TEXT[failure()])}
            </p>
          )}
        </Show>

        <Show
          when={waiting()}
          fallback={
            <>
              <Button
                size="lg"
                class="mt-2"
                icon={<TwitchIcon class="size-5" />}
                onClick={() => session.login()}
              >
                {t("LOGIN_SIGN_IN_LABEL")}
              </Button>
            </>
          }
        >
          <div class="mt-4 w-full">
            <Card>
              <div class="p-5 flex flex-col items-center gap-3">
                <Show
                  when={deviceCode()}
                  fallback={
                    <>
                      <Loading size={24} />
                      <p class="text-small text-ink-soft">
                        {t("LOGIN_REQUESTING_CODE_STATUS")}
                      </p>
                    </>
                  }
                >
                  {(code) => (
                    <>
                      <p class="text-small text-ink-soft">
                        {tRich("LOGIN_ENTER_CODE_DESCRIPTION", {
                          site: formatUrl(code().verificationUri),
                          link: (chunks) => (
                            <a
                              href={code().verificationUri}
                              onClick={(e) => {
                                e.preventDefault();
                                browser.open(code().verificationUri);
                              }}
                              class="text-accent-ink hover:underline"
                            >
                              {chunks}
                            </a>
                          ),
                        })}
                      </p>
                      <p class="font-mono text-hero text-ink">
                        {code().userCode}
                      </p>
                      <Button
                        variant="neutral"
                        size="sm"
                        icon={
                          codeCopy.copied() ? (
                            <Check class="size-4 text-positive enter-swap" />
                          ) : (
                            <Copy class="size-4" />
                          )
                        }
                        onClick={() => codeCopy.copy(code().userCode)}
                      >
                        {codeCopy.copied()
                          ? t("LOGIN_COPIED_LABEL")
                          : t("LOGIN_COPY_CODE_LABEL")}
                      </Button>
                    </>
                  )}
                </Show>
              </div>
            </Card>
          </div>
          <Button variant="ghost" onClick={() => session.abort()}>
            {t("LOGIN_CANCEL_LABEL")}
          </Button>
        </Show>
      </div>
    </main>
  );
}

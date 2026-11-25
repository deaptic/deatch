import { Check, Copy } from "lucide-solid";
import { Show } from "solid-js";
import TwitchIcon from "./ui/TwitchIcon.tsx";
import Button from "../../kit/Button.tsx";
import Loading from "../../kit/Loading.tsx";
import Card from "../../kit/Card.tsx";
import {
  deviceCode,
  type RestoreFailure,
  restoreFailure,
  waiting,
} from "./auth.ts";
import * as session from "./store.ts";
import * as browser from "../../platform/browser.ts";
import { createCopied } from "../../kit/createCopied.ts";
import { t, tRich } from "../../shared/i18n/index.ts";
import { formatUrl } from "../../shared/format/url.ts";
import TextLink from "../../kit/TextLink.tsx";
import Text from "../../kit/Text.tsx";

const RESTORE_FAILURE_TEXT = {
  missingScope: "LOGIN_MISSING_SCOPE_ERROR",
  unreachable: "LOGIN_RESTORE_RETRYING_STATUS",
} as const satisfies Record<RestoreFailure, string>;

export default function Login() {
  const codeCopy = createCopied();

  return (
    <main class="flex-1 flex items-center justify-center px-6">
      <div class="w-100 max-w-full flex flex-col items-center text-center gap-4">
        <Text as="h1" size="xl" tone="primary">
          {t("LOGIN_WELCOME_TITLE")}
        </Text>
        <Text as="p" size="md" tone="soft">
          {t("LOGIN_TAGLINE_DESCRIPTION")}
        </Text>
        <Show when={restoreFailure()}>
          {(failure) => (
            <Text as="p" size="sm" tone="caution">
              {t(RESTORE_FAILURE_TEXT[failure()])}
            </Text>
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
                      <Loading size="md" />
                      <Text as="p" size="sm" tone="soft">
                        {t("LOGIN_REQUESTING_CODE_STATUS")}
                      </Text>
                    </>
                  }
                >
                  {(code) => (
                    <>
                      <Text as="p" size="sm" tone="soft">
                        {tRich("LOGIN_ENTER_CODE_DESCRIPTION", {
                          site: formatUrl(code().verificationUri),
                          link: (chunks) => (
                            <TextLink
                              href={code().verificationUri}
                              onOpen={() =>
                                browser.open(code().verificationUri)
                              }
                            >
                              {chunks}
                            </TextLink>
                          ),
                        })}
                      </Text>
                      <p class="font-mono text-4xl text-ink">
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

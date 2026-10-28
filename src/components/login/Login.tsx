import { Check, Copy } from "lucide-solid";
import { Show } from "solid-js";
import TwitchIcon from "./TwitchIcon.tsx";
import Button from "../ui/Button.tsx";
import Loading from "../ui/Loading.tsx";
import { CARD_FRAME } from "../ui/Card.tsx";
import { deviceCode, waiting } from "../../lib/stores/auth.ts";
import * as session from "../../lib/services/session.ts";
import * as browser from "../../lib/services/browser.ts";
import { createCopied } from "../ui/createCopied.ts";
import { t } from "../../lib/i18n/index.ts";

export default function Login() {
  const codeCopy = createCopied();

  return (
    <main class="flex-1 flex items-center justify-center px-6">
      <div class="w-100 max-w-full flex flex-col items-center text-center gap-4">
        <h1 class="text-hero text-ink">{t("LOGIN_WELCOME")}</h1>
        <p class="text-body text-ink-soft">{t("LOGIN_TAGLINE")}</p>

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
                {t("LOGIN_BUTTON")}
              </Button>
            </>
          }
        >
          <div
            class={`mt-4 w-full bg-surface p-5 flex flex-col items-center gap-3 ${CARD_FRAME}`}
          >
            <Show
              when={deviceCode()}
              fallback={
                <>
                  <Loading size={24} />
                  <p class="text-small text-ink-soft">
                    {t("LOGIN_REQUESTING")}
                  </p>
                </>
              }
            >
              {(code) => (
                <>
                  <p class="text-small text-ink-soft">
                    {t("LOGIN_ENTER_CODE")}{" "}
                    <a
                      href={code().verificationUri}
                      onClick={(e) => {
                        e.preventDefault();
                        browser.open(code().verificationUri);
                      }}
                      class="text-accent-ink hover:underline"
                    >
                      twitch.tv/activate
                    </a>
                  </p>
                  <p class="font-mono text-hero text-ink">{code().userCode}</p>
                  <Button
                    variant="neutral"
                    size="sm"
                    icon={
                      codeCopy.copied() ? (
                        <Check class="size-4 text-positive" />
                      ) : (
                        <Copy class="size-4" />
                      )
                    }
                    onClick={() => codeCopy.copy(code().userCode)}
                  >
                    {codeCopy.copied()
                      ? t("LOGIN_COPIED")
                      : t("LOGIN_COPY_CODE")}
                  </Button>
                </>
              )}
            </Show>
          </div>
          <Button variant="ghost" onClick={() => session.abort()}>
            {t("LOGIN_CANCEL")}
          </Button>
        </Show>
      </div>
    </main>
  );
}

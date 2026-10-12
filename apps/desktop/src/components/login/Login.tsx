import { Copy } from "lucide-solid";
import { Show } from "solid-js";
import TwitchIcon from "./TwitchIcon.tsx";
import Button from "../ui/Button.tsx";
import Loading from "../ui/Loading.tsx";
import { deviceCode, waiting } from "../../lib/stores/auth.ts";
import * as session from "../../lib/services/session.ts";
import { copyField } from "../../lib/utils/clipboard.ts";

export default function Login() {
  return (
    <main class="flex-1 flex items-center justify-center px-6">
      <div class="w-100 max-w-full flex flex-col items-center text-center gap-4">
        <h1 class="text-hero text-ink">Welcome to Deatch</h1>
        <p class="text-body text-ink-soft">
          Every Twitch chat you care about, in one warm little window.
        </p>

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
                Log in with Twitch
              </Button>
            </>
          }
        >
          <div class="mt-4 w-full bg-surface rounded-lg border border-transparent [[data-theme=light]_&]:border-line-soft p-5 flex flex-col items-center gap-3">
            <Show
              when={deviceCode()}
              fallback={
                <>
                  <Loading size={24} />
                  <p class="text-small text-ink-soft">
                    Asking Twitch for a code…
                  </p>
                </>
              }
            >
              {(code) => (
                <>
                  <p class="text-small text-ink-soft">
                    Enter this code at{" "}
                    <a
                      href={code().verification_uri}
                      target="_blank"
                      class="text-accent-ink hover:underline"
                    >
                      twitch.tv/activate
                    </a>
                  </p>
                  <p class="font-mono text-hero text-ink">
                    {code().user_code}
                  </p>
                  <Button
                    variant="neutral"
                    size="sm"
                    icon={<Copy class="size-4" />}
                    onClick={() => copyField(code().user_code)}
                  >
                    Copy code
                  </Button>
                </>
              )}
            </Show>
          </div>
          <Button variant="ghost" onClick={() => session.abort()}>
            Cancel
          </Button>
        </Show>
      </div>
    </main>
  );
}

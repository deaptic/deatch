import { Show } from "solid-js";
import { waiting, deviceCode } from "../../lib/stores/auth";
import { sessionManager } from "../../lib/managers/SessionManager";
import TwitchIcon from "../icons/TwitchIcon";
import Loading from "../ui/Loading";

export default function Login() {
  return (
    <main class="flex-1 bg-bg-dark flex items-center justify-center">
      <div class="flex flex-col items-center gap-8">
        <div class="flex items-center gap-3">
          <TwitchIcon class="w-12 h-12 fill-primary" />
          <span class="text-text text-3xl font-bold tracking-tight">Deatch</span>
        </div>

        <div class="bg-bg border border-border-muted rounded-2xl p-10 flex flex-col items-center gap-6 w-80 shadow-2xl">
          {waiting() ? (
            <>
              <Show when={deviceCode()} fallback={<Loading size={56} />}>
                {(code) => (
                  <div class="flex flex-col items-center gap-4 w-full">
                    <div class="text-center flex flex-col gap-1">
                      <p class="text-text font-semibold">Activate on Twitch</p>
                      <p class="text-text-muted text-sm">
                        Go to <span class="text-primary">twitch.tv/activate</span> and enter this code:
                      </p>
                    </div>
                    <div class="bg-bg-dark border border-primary rounded-xl px-6 py-4 w-full text-center">
                      <span class="text-text text-2xl font-mono font-bold tracking-[0.25em]">
                        {code().user_code}
                      </span>
                    </div>
                    <a
                      href={code().verification_uri}
                      target="_blank"
                      class="text-primary hover:text-primary/80 text-sm underline transition-colors"
                    >
                      Open twitch.tv/activate
                    </a>
                  </div>
                )}
              </Show>
              <button
                onClick={() => sessionManager.abort()}
                class="text-text-muted hover:text-text text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <div class="text-center flex flex-col gap-1">
                <h2 class="text-text text-xl font-semibold">Welcome back</h2>
                <p class="text-text-muted text-sm">Connect your Twitch account to get started</p>
              </div>
              <button
                onClick={() => sessionManager.login()}
                class="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/85 active:bg-primary/70 transition-colors duration-150 text-text font-semibold py-3 px-6 rounded-lg cursor-pointer"
              >
                <TwitchIcon class="w-5 h-5 fill-text" />
                Login with Twitch
              </button>
              <p class="text-text-muted text-xs text-center">
                Your credentials are never stored by this app
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

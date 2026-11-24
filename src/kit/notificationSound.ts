import notificationSound from "../assets/notification.mp3";

let sound: HTMLAudioElement | null = null;

export function playNotificationSound(): void {
  sound ??= new Audio(notificationSound);
  if (!sound.paused) return;
  sound.play().catch((e: unknown) => console.warn("notification sound", e));
}

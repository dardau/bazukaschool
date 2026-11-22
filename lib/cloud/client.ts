import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const cloud = url && key ? createClient(url, key) : null;
export function errorText(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : String((error as { message?: string })?.message || error);
  if (message.includes("EDIT_CONFLICT"))
    return "Этот ответ изменён на другом устройстве. Скопируйте свой текст, обновите страницу и сравните версии перед сохранением.";
  if (/fetch|network/i.test(message))
    return "Нет связи с сервером. Данные ещё не отправлены. Проверьте интернет и повторите попытку.";
  if (/Invalid login/i.test(message)) return "Неверная почта или пароль.";
  if (/Email not confirmed/i.test(message))
    return "Подтвердите почту по ссылке из письма.";
  if (/rate limit/i.test(message))
    return "Слишком много попыток. Подождите несколько минут.";
  return message;
}

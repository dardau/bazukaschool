import { cloud } from "./client";
export async function submitWork(input: {
  id: string;
  studentId: string;
  teacherId: string;
  assignmentKey: string;
  title: string;
  body?: string;
  audio?: Blob;
}) {
  if (!cloud) throw Error("Онлайн-хранилище ещё не подключено.");
  const path = input.audio ? `${input.studentId}/${input.id}.audio` : null;
  if (input.audio && path) {
    if (input.audio.size > 25 * 1024 * 1024)
      throw Error(
        "Запись больше 25 МБ. Сократите ответ или загрузите меньший файл.",
      );
    const r = await cloud.storage
      .from("student-audio")
      .upload(path, input.audio, {
        contentType: input.audio.type.split(";")[0],
        upsert: false,
      });
    // A retried submission may already have uploaded its immutable object.
    if (r.error && !/already exists|duplicate/i.test(r.error.message))
      throw r.error;
  }
  const r = await cloud
    .from("submissions")
    .insert({
      id: input.id,
      student_id: input.studentId,
      teacher_id: input.teacherId,
      assignment_key: input.assignmentKey,
      title: input.title,
      body: input.body || "",
      audio_path: path,
    });
  if (r.error) {
    if (r.error.code === "23505") {
      const previous = await cloud
        .from("submissions")
        .select("id")
        .eq("id", input.id)
        .maybeSingle();
      if (previous.data) return;
    }
    // Keep the uploaded object for retry; never delete after an ambiguous network outcome.
    throw r.error;
  }
}

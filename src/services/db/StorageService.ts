async function uploadPhotoToFolder(
  file: Blob | File,
  folder: string,
  defaultName: string,
  fileName?: string
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file, file instanceof File && file.name ? file.name : defaultName);
  formData.append('folder', folder);
  if (fileName) formData.append('fileName', fileName);

  const res = await fetch('/api/upload-photo', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.url;
}

export const uploadStudentPhoto = async (file: Blob | File, fileName?: string): Promise<string> =>
  uploadPhotoToFolder(file, 'students_photos', 'student_photo.jpg', fileName);

export const uploadTeacherPhoto = async (file: Blob | File, fileName?: string): Promise<string> =>
  uploadPhotoToFolder(file, 'teachers_photos', 'teacher_photo.jpg', fileName);

export const uploadPostCoverPhoto = async (file: Blob | File, fileName?: string): Promise<string> =>
  uploadPhotoToFolder(file, 'post_covers', 'cover_photo.jpg', fileName);

export const uploadCertificateFrame = async (file: Blob | File, fileName?: string): Promise<string> =>
  uploadPhotoToFolder(file, 'certificate_frames', 'certificate_frame.png', fileName);

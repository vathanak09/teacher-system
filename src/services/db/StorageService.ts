export const uploadStudentPhoto = async (file: Blob | File, fileName?: string): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file, 'student_photo.jpg');
  formData.append('folder', 'students_photos');
  if (fileName) formData.append('fileName', fileName);
  
  const res = await fetch('/api/upload-photo', {
    method: 'POST',
    body: formData,
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.url;
};

export const uploadTeacherPhoto = async (file: Blob | File, fileName?: string): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file, 'teacher_photo.jpg');
  formData.append('folder', 'teachers_photos');
  if (fileName) formData.append('fileName', fileName);
  
  const res = await fetch('/api/upload-photo', {
    method: 'POST',
    body: formData,
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.url;
};

export const uploadPostCoverPhoto = async (file: Blob | File, fileName?: string): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file, 'cover_photo.jpg');
  formData.append('folder', 'post_covers');
  if (fileName) formData.append('fileName', fileName);
  
  const res = await fetch('/api/upload-photo', {
    method: 'POST',
    body: formData,
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.url;
};

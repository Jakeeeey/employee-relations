"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Concern,
  CreateConcernInput,
  UpdateConcernInput,
  ConcernAttachment,
} from "../type";
import { toast } from "sonner";

export type UploadProgressState = {
  uploading: boolean;
  uploadCount: number;
  totalCount: number;
};

export function useConcern() {
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState | null>(null);

  const fetchConcerns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/er/application/concern", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch concerns");
      setConcerns(data.data ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConcerns();
  }, [fetchConcerns]);

  const createConcern = async (data: CreateConcernInput) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/er/application/concern", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to submit concern");

      setConcerns((prev) => [result.data, ...prev]);
      toast.success("Concern submitted successfully");
      return result.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateConcern = async (id: number, data: UpdateConcernInput) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/er/application/concern/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to update concern");

      setConcerns((prev) =>
        prev.map((item) => (item.id === id ? result.data : item))
      );
      toast.success("Concern updated successfully");
      return result.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadFile = async (file: File): Promise<{
    file_id: string;
    file_url: string;
    filename_download: string;
    type?: string;
  }> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/er/application/concern/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to upload file");
    }

    return res.json();
  };

  const createAttachment = async (data: {
    concern_id: number;
    file_path: string;
    file_name: string;
    file_type?: string | null;
  }) => {
    const res = await fetch("/api/er/application/concern/attachment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Failed to create attachment");
    return result.data;
  };

  const fetchAttachments = async (
    concernId: number,
  ): Promise<ConcernAttachment[]> => {
    const res = await fetch(
      `/api/er/application/concern/attachment?concern_id=${concernId}`,
      { cache: "no-store" },
    );
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Failed to fetch attachments");
    return result.data ?? [];
  };

  const submitConcernWithAttachments = async (
    data: CreateConcernInput,
    files: File[],
  ) => {
    let uploadedFiles: Array<{
      file_id: string;
      file_url: string;
      filename_download: string;
      type?: string;
    }> = [];

    if (files.length > 0) {
      setUploadProgress({ uploading: true, uploadCount: 0, totalCount: files.length });

      uploadedFiles = [];

      for (let i = 0; i < files.length; i++) {
        try {
          const result = await uploadFile(files[i]);
          uploadedFiles.push(result);
          setUploadProgress({ uploading: true, uploadCount: i + 1, totalCount: files.length });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Failed to upload file";
          toast.error(`Failed to upload "${files[i].name}": ${message}`);
          setUploadProgress(null);
          throw err;
        }
      }
    }

    const concern = await createConcern(data);

    if (concern?.id && uploadedFiles.length > 0) {
      const attachmentPromises = uploadedFiles.map((f) =>
        createAttachment({
          concern_id: concern.id,
          file_path: f.file_url,
          file_name: f.filename_download,
          file_type: f.type ?? null,
        }).catch((err: unknown) => {
          console.error(`Failed to create attachment for ${f.filename_download}:`, err);
          return null;
        }),
      );

      await Promise.all(attachmentPromises);
    }

    setUploadProgress(null);
    return concern;
  };

  return {
    concerns,
    isLoading,
    error,
    uploadProgress,
    createConcern,
    updateConcern,
    refresh: fetchConcerns,
    submitConcernWithAttachments,
    fetchAttachments,
  };
}

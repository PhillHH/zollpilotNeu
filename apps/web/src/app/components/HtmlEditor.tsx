"use client";

import { useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";

type HtmlEditorProps = {
  value: string;
  onChange: (value: string) => void;
  height?: number;
  placeholder?: string;
};

export function HtmlEditor({
  value,
  onChange,
  height = 400,
  placeholder = "Schreibe hier deinen Inhalt...",
}: HtmlEditorProps) {
  const editorRef = useRef<any>(null);

  return (
    <Editor
      tinymceScriptSrc="/tinymce/tinymce.min.js"
      onInit={(_evt, editor) => (editorRef.current = editor)}
      value={value}
      onEditorChange={(newValue) => onChange(newValue)}
      init={{
        height,
        menubar: true,
        plugins: [
          "advlist",
          "autolink",
          "lists",
          "link",
          "image",
          "charmap",
          "preview",
          "anchor",
          "searchreplace",
          "visualblocks",
          "code",
          "fullscreen",
          "insertdatetime",
          "media",
          "table",
          "help",
          "wordcount",
        ],
        toolbar:
          "undo redo | blocks | " +
          "bold italic forecolor | alignleft aligncenter " +
          "alignright alignjustify | bullist numlist outdent indent | " +
          "link image media | removeformat | code | help",
        content_style:
          "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; font-size: 16px; line-height: 1.6; }",
        placeholder,
        language: "de",
        language_url: "/tinymce/langs/de.js",
        branding: false,
        promotion: false,
        // Image upload settings
        image_title: true,
        automatic_uploads: true,
        file_picker_types: "image media",
        // Allow base64 images for simple setup (can be changed to server upload later)
        images_upload_handler: (blobInfo) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(reader.result as string);
            };
            reader.readAsDataURL(blobInfo.blob());
          });
        },
        // Media embed settings
        media_live_embeds: true,
      }}
    />
  );
}

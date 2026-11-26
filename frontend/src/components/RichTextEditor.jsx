import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ script: "sub" }, { script: "super" }],
    ["clean"],
  ],
};

const formats = ["header", "bold", "italic", "underline", "list", "script"];

function RichTextEditor({ value, onChange, placeholder }) {
  const handleChange = (content, delta, source, editor) => {
    onChange(editor.getText().trim() === "" ? "" : content);
  };

  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={handleChange}
      modules={modules}
      formats={formats}
      placeholder={placeholder}
    />
  );
}

export default RichTextEditor;
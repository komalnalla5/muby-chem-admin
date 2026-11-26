import DOMPurify from "dompurify";

function RichText({ html }) {
  if (!html) {
    return <p className="text-gray-600">No data available</p>;
  }
  const isHtml = /<[a-z][\s\S]*>/i.test(html);
  if (!isHtml) {
   return <p className="whitespace-pre-line break-words text-gray-900">{html}</p>;
  }
  return (
   <div
  className="rich-text break-words text-gray-900"
  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
/>
  );
}

export default RichText;
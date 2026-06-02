const typeLabel = (type) => {
  if (type === "docx-to-pdf") return "Word → PDF";
  if (type === "image-to-text") return "Image → Text";
  if (type === "compress-image") return "Compress Image";
  if (type === "text-to-pdf") return "Text → PDF";
  return type;
};

const typeColor = (type) => {
  if (type === "docx-to-pdf") return "text-blue-400 bg-blue-500/10 border-blue-500/20";
  if (type === "image-to-text") return "text-purple-400 bg-purple-500/10 border-purple-500/20";
  if (type === "compress-image") return "text-green-400 bg-green-500/10 border-green-500/20";
  if (type === "text-to-pdf") return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  return "text-white/40 bg-white/5 border-white/10";
};

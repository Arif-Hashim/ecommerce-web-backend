const Image = require('../models/Image');

// multer (memory storage) files -> ["/api/images/<id>", ...]
exports.saveFiles = async (files = []) => {
  const paths = [];
  for (const f of files) {
    const img = await Image.create({ name: f.originalname, contentType: f.mimetype, data: f.buffer });
    paths.push(`/api/images/${img._id}`);
  }
  return paths;
};

// delete a stored image if the path points to one of ours
exports.removeImage = async (p) => {
  const m = /^\/api\/images\/([a-f0-9]{24})$/i.exec(p || '');
  if (m) await Image.findByIdAndDelete(m[1]);
};

exports.notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
};

exports.errorHandler = (err, req, res, next) => { // eslint-disable-line
  let status = err.status || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Server error';
  if (err.name === 'CastError') { status = 404; message = 'Resource not found'; }
  else if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors).map((e) => e.message).join(', '); }
  else if (err.code === 11000) { status = 409; message = 'Duplicate value: ' + Object.keys(err.keyValue || {}).join(', '); }
  else if (err.name === 'MulterError') { status = 400; }
  res.status(status).json({ message });
};

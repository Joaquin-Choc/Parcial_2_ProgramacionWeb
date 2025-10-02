const errorHandler = (err, req, res, next) => {
  console.error('Error inesperado:', err);
  
  if (res.headersSent) {
    return next(err);
  }
  
  res.status(500).json({
    error: "Error interno del servidor",
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
};

module.exports = errorHandler;

export const notFound = (req, res, next) => {
  res.status(404).json({ error: `Not Found - ${req.originalUrl}` })
}

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message)
  
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    })
  }

  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
}

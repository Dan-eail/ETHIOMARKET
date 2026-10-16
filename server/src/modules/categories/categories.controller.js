import prisma from '../../config/database.js'

export const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: { where: { status: 'PUBLISHED' } } }
        }
      },
      orderBy: { name: 'asc' }
    })
    res.json({ categories })
  } catch (err) {
    next(err)
  }
}

export const createCategory = async (req, res, next) => {
  try {
    const { name, slug, description, icon, imageUrl } = req.body
    if (!name) return res.status(400).json({ error: 'Category name is required' })

    const category = await prisma.category.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description,
        icon,
        imageUrl,
      }
    })
    res.status(201).json({ category })
  } catch (err) {
    next(err)
  }
}

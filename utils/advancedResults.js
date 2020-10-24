const advancedResults = async (req, model, populate) => {
  const reqQuery = { ...req.query };

  const removeFields = ['select', 'sort', 'page', 'limit'];
  removeFields.forEach((param) => delete reqQuery[param]);

  let queryString = JSON.stringify(reqQuery);
  queryString = JSON.parse(
    queryString.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`)
  );

  const query = model.find(queryString);

  // Select
  if (req.query.select) {
    const fields = req.query.select.replace(',', ' ');
    query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.replace(',', ' ');
    query.sort(sortBy);
  } else {
    query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 15;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments();

  query.skip(startIndex).limit(limit);

  if (populate) query.populate(populate);

  const results = await query;

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  return {
    success: true,
    count: results.length,
    pagination,
    data: results,
  };
};

module.exports = advancedResults;
